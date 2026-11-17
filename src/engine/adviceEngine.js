// Rules-based advice engine: the "financial order of operations".
//
// Rules run in priority order and each one claims part of the monthly surplus.
// Every rule, fired or not, records an explanation in `trace`, and every piece
// of advice carries `why` (the reasoning) and `facts` (the exact inputs that
// drove it), so the plan can always answer "why this?".
//
// Output shape (consumed by Home and Invest):
//   { advice[], allocations[], trace[], tax, surplus, remaining, year }

import {
  HIGH_INTEREST_THRESHOLD, MEDIUM_INTEREST_THRESHOLD,
  EMERGENCY_FUND_MIN_MONTHS, EMERGENCY_FUND_TARGET_MONTHS, STOCK_BOND_SPLITS,
} from '../constants/financeRules.js';
import { taxYear } from '../constants/taxYears.js';
import { totalExpenses, monthlySurplus } from '../utils/calculations.js';
import { fmt, fmtMonths } from '../utils/formatters.js';
import {
  taxableIncome, incomeTax, marginalRate, rothVsTraditional, rothIraAllowance, k401Limit, pct,
} from './tax.js';

const rate = r => `${(r * 100).toFixed(1).replace(/\.0$/, '')}%`;

/** Has the user given enough tax/401k detail for the precise rules? */
export function hasTaxDetails(profile) {
  return (profile?.taxes?.grossAnnualIncome || 0) > 0;
}
export function has401kDetails(profile) {
  const k = profile?.retirement401k;
  return k && (k.available === false || (k.available === true && k.matchLimitPercent >= 0));
}

export function runAdviceEngine(profile, { year = new Date().getFullYear() } = {}) {
  const ty = taxYear(year);
  const surplus = monthlySurplus(profile);
  const monthlyExpenses = totalExpenses(profile);
  const age = profile.age || 0;
  const advice = [];
  const allocations = [];
  const trace = [];
  let remaining = Math.max(0, surplus);

  function allocate(ruleId, label, amount, color) {
    const a = Math.min(remaining, Math.max(0, amount));
    if (a > 0) allocations.push({ ruleId, label, monthlyAmount: a, color });
    remaining = Math.max(0, remaining - a);
    return a;
  }
  function record(ruleId, title, fired, reason) {
    trace.push({ ruleId, title, fired, reason, remainingAfter: remaining });
  }

  // ── Tax picture (only when we know gross income) ───────────────────────────
  const k = profile.retirement401k || {};
  const gross = profile.taxes?.grossAnnualIncome || 0;
  const status = profile.taxes?.filingStatus || 'single';
  const current401kPct = k.available ? (k.contributionPercent || 0) : 0;
  const pretax401k = gross * current401kPct / 100;
  let tax = null;
  if (gross > 0) {
    const taxable = taxableIncome(gross, status, ty.year, pretax401k);
    const owed = incomeTax(taxable, status, ty.year);
    tax = {
      year: ty.year,
      approximate: ty.approximate,
      filingStatus: status,
      grossAnnual: gross,
      taxable,
      federalTax: owed,
      marginalRate: marginalRate(taxable, status, ty.year),
      effectiveRate: gross > 0 ? owed / gross : 0,
      ...(() => {
        const r = rothVsTraditional({
          grossAnnual: gross, filingStatus: status, year: ty.year,
          annualSpending: monthlyExpenses * 12, pretaxDeductions: pretax401k,
        });
        return { accountChoice: r.choice, accountReason: r.reason, retireRate: r.retireRate };
      })(),
    };
  }

  // ── Rule 1: Emergency fund (3 months) ──────────────────────────────────────
  const efBalance = profile.emergencyFundBalance || 0;
  const efMin = monthlyExpenses * EMERGENCY_FUND_MIN_MONTHS;
  const efTarget = monthlyExpenses * EMERGENCY_FUND_TARGET_MONTHS;
  const efGap = Math.max(0, efMin - efBalance);
  const monthsCovered = efBalance / Math.max(monthlyExpenses, 1);
  if (efGap > 0) {
    const efAlloc = allocate('emergency_min', 'Emergency Fund (3-mo)', efGap / 6, '#6366f1');
    advice.push({
      ruleId: 'emergency_min', priority: 1, status: 'in_progress',
      title: 'Build your emergency fund',
      rationale: 'A 3-month emergency fund is your safety net before tackling other goals.',
      monthlyAmount: efAlloc,
      detail: `You have ${fmt(efBalance)} saved. Your 3-month target is ${fmt(efMin)}. Contributing ${fmt(efAlloc)}/mo closes the gap in ${fmtMonths(Math.ceil(efGap / Math.max(efAlloc, 1)))}.`,
      why: [
        `Your emergency fund covers ${monthsCovered.toFixed(1)} months of expenses; the first milestone is ${EMERGENCY_FUND_MIN_MONTHS}.`,
        'Without a cushion, a surprise bill or job loss ends up on a credit card, undoing everything below.',
        'It\'s spread over 6 months so the rest of your plan keeps moving.',
      ],
      facts: [['Saved', fmt(efBalance)], ['3-month target', fmt(efMin)], ['Monthly expenses', fmt(monthlyExpenses)]],
    });
    record('emergency_min', 'Emergency fund', true, `Covers ${monthsCovered.toFixed(1)} of ${EMERGENCY_FUND_MIN_MONTHS} months.`);
  } else {
    advice.push({
      ruleId: 'emergency_min', priority: 1, status: 'complete',
      title: 'Emergency fund (3 months)', rationale: 'Your 3-month emergency fund is funded.', monthlyAmount: 0,
      detail: `You have ${fmt(efBalance)}, which covers ${Math.floor(monthsCovered)} months of expenses.`,
      why: [`${fmt(efBalance)} covers ${monthsCovered.toFixed(1)} months, at or above the ${EMERGENCY_FUND_MIN_MONTHS}-month minimum.`],
      facts: [['Saved', fmt(efBalance)], ['3-month target', fmt(efMin)]],
    });
    record('emergency_min', 'Emergency fund', false, `Already covers ${monthsCovered.toFixed(1)} months.`);
  }

  // ── Rule 2: 401(k) employer match ──────────────────────────────────────────
  // Ranked above high-interest debt: a 50–100% instant match beats paying off
  // even a 25% card.
  if (k.available === true && gross > 0) {
    const capPct = k.matchLimitPercent || 0;
    const matchRate = (k.matchPercent || 0) / 100;
    const yearlyMatchAtCap = gross * capPct / 100 * matchRate;
    if (capPct > 0 && current401kPct < capPct) {
      const extraPct = capPct - current401kPct;
      const extraGrossMonthly = gross * extraPct / 100 / 12;
      // Traditional contributions are pre-tax: take-home only drops by (1 − marginal rate).
      const useRoth = tax?.accountChoice === 'roth';
      const takeHomeCost = useRoth ? extraGrossMonthly : extraGrossMonthly * (1 - (tax?.marginalRate || 0));
      const cost = allocate('401k_match', '401(k) up to match', takeHomeCost, '#0ea5e9');
      const fullyFunded = cost >= takeHomeCost - 0.5;
      const freeMoney = gross * extraPct / 100 * matchRate;
      advice.push({
        ruleId: '401k_match', priority: 2, status: 'in_progress',
        title: `Raise your 401(k) to ${capPct}%`,
        rationale: `Your employer matches ${k.matchPercent}% of contributions up to ${capPct}% of salary: an instant ${k.matchPercent}% return.`,
        monthlyAmount: cost,
        detail: `Going from ${current401kPct}% to ${capPct}% adds ${fmt(freeMoney)}/yr from your employer. It lowers your take-home by about ${fmt(takeHomeCost)}/mo${useRoth ? '' : ' after the tax deduction'}.`,
        why: [
          `You contribute ${current401kPct}%, but your employer matches up to ${capPct}%. You're leaving ${fmt(freeMoney)} a year unclaimed.`,
          `A ${k.matchPercent}% match is a guaranteed ${k.matchPercent}% return on every dollar, before any market growth. Nothing else in your plan pays that, so it comes before debt payoff.`,
          useRoth
            ? 'We\'ve used Roth contributions here (see the tax note), so the full amount comes out of take-home pay.'
            : `Traditional contributions are pre-tax: each $1 you put in only costs $${(1 - (tax?.marginalRate || 0)).toFixed(2)} of take-home at your ${pct(tax?.marginalRate || 0)} rate.`,
          ...(fullyFunded ? [] : ['Your surplus doesn\'t fully cover it yet, so this is a partial step.']),
        ],
        facts: [
          ['Gross salary', fmt(gross)],
          ['Match', `${k.matchPercent}% up to ${capPct}%`],
          ['You contribute', `${current401kPct}%`],
          ['Employer adds at cap', `${fmt(yearlyMatchAtCap)}/yr`],
        ],
      });
      record('401k_match', '401(k) match', true, `Contributing ${current401kPct}% of a ${capPct}% match.`);
    } else {
      advice.push({
        ruleId: '401k_match', priority: 2, status: 'complete',
        title: 'Capturing your full 401(k) match', monthlyAmount: 0,
        rationale: 'You contribute enough to get every dollar your employer offers.',
        detail: `Your employer adds about ${fmt(yearlyMatchAtCap)} a year.`,
        why: [`You contribute ${current401kPct}%, at or above the ${capPct}% your employer matches.`],
        facts: [['Match', `${k.matchPercent}% up to ${capPct}%`], ['Employer adds', `${fmt(yearlyMatchAtCap)}/yr`]],
      });
      record('401k_match', '401(k) match', false, 'Already contributing up to the match.');
    }
  } else if (k.available === false) {
    record('401k_match', '401(k) match', false, 'No employer retirement plan.');
  } else {
    advice.push({
      ruleId: '401k_match', priority: 2, status: 'needs_info',
      title: 'Check your 401(k) match', monthlyAmount: 0,
      rationale: 'An employer match is a 50–100% instant return. Always capture the full match.',
      detail: 'Add your 401(k) details to see exactly how much to contribute.',
      why: ['We don\'t know your salary or employer match yet, so we can\'t size this step.'],
      facts: [],
    });
    record('401k_match', '401(k) match', false, 'Missing salary or 401(k) details.');
  }

  // ── Rule 3: High-interest debt (> 7%) ──────────────────────────────────────
  const highDebt = (profile.debts || []).filter(d => d.interestRate > HIGH_INTEREST_THRESHOLD)
    .sort((a, b) => b.interestRate - a.interestRate);
  const highDebtTotal = highDebt.reduce((s, d) => s + d.balance, 0);
  if (highDebtTotal > 0 && remaining > 0) {
    const hiAlloc = allocate('high_debt', 'High-Interest Debt Payoff', remaining, '#ef4444');
    advice.push({
      ruleId: 'high_debt', priority: 3, status: 'in_progress',
      title: 'Pay off high-interest debt',
      rationale: 'Debt above 7% interest is a guaranteed negative return. Paying it off beats most investments.',
      monthlyAmount: hiAlloc,
      detail: `You have ${fmt(highDebtTotal)} in high-interest debt. Applying ${fmt(hiAlloc)}/mo extra pays it off in ~${fmtMonths(Math.ceil(highDebtTotal / Math.max(hiAlloc, 1)))}.`,
      why: [
        `${highDebt.map(d => `${d.label} at ${rate(d.interestRate)}`).join(', ')}: every dollar paid off earns that rate, guaranteed and tax-free.`,
        `Stocks have averaged roughly 10% a year with big swings, so anything above ${rate(HIGH_INTEREST_THRESHOLD)} is a better use of cash.`,
        `Extra payments go to the highest rate first (${highDebt[0].label}): the avalanche method. Compare it with snowball in Simulate → Debt payoff.`,
        'Investing and lower-priority goals wait until this is gone, so all remaining surplus goes here.',
      ],
      facts: highDebt.map(d => [d.label, `${fmt(d.balance)} at ${rate(d.interestRate)}`]),
    });
    record('high_debt', 'High-interest debt', true, `${fmt(highDebtTotal)} above ${rate(HIGH_INTEREST_THRESHOLD)}.`);
  } else {
    advice.push({
      ruleId: 'high_debt', priority: 3, status: 'complete',
      title: 'High-interest debt', monthlyAmount: 0,
      rationale: `No debt above ${rate(HIGH_INTEREST_THRESHOLD)}. Great position to be in.`,
      detail: highDebtTotal > 0 ? 'You have high-interest debt but no surplus to pay it down. Reduce expenses to free up cash.' : 'No high-interest debt detected.',
      why: [highDebtTotal > 0 ? 'No surplus is left after the steps above.' : `None of your debts charge more than ${rate(HIGH_INTEREST_THRESHOLD)}.`],
      facts: [],
    });
    record('high_debt', 'High-interest debt', false,
      highDebtTotal > 0 ? 'Has high-interest debt but no surplus left.' : `No debt above ${rate(HIGH_INTEREST_THRESHOLD)}.`);
  }

  // ── Rule 4: Medium-interest debt (4–7%) ────────────────────────────────────
  if (highDebtTotal === 0) {
    const medDebt = (profile.debts || []).filter(d =>
      d.interestRate >= MEDIUM_INTEREST_THRESHOLD && d.interestRate <= HIGH_INTEREST_THRESHOLD);
    const medDebtTotal = medDebt.reduce((s, d) => s + d.balance, 0);
    if (medDebtTotal > 0 && remaining > 0) {
      const medAlloc = allocate('med_debt', 'Medium-Interest Debt', remaining * 0.5, '#f97316');
      advice.push({
        ruleId: 'med_debt', priority: 4, status: 'in_progress',
        title: 'Pay down medium-interest debt',
        rationale: 'Debt at 4–7% is a borderline case. Split extra cash between payoff and investing.',
        monthlyAmount: medAlloc,
        detail: `${fmt(medDebtTotal)} in medium-interest debt. Applying ${fmt(medAlloc)}/mo extra while investing the rest.`,
        why: [
          `${medDebt.map(d => `${d.label} at ${rate(d.interestRate)}`).join(', ')}: close to what a balanced portfolio might earn.`,
          'Because it\'s a toss-up, half of what\'s left goes to payoff and half keeps flowing to investing.',
        ],
        facts: medDebt.map(d => [d.label, `${fmt(d.balance)} at ${rate(d.interestRate)}`]),
      });
      record('med_debt', 'Medium-interest debt', true, `${fmt(medDebtTotal)} at 4–7%.`);
    } else {
      record('med_debt', 'Medium-interest debt', false, medDebtTotal > 0 ? 'No surplus left.' : 'No debt at 4–7%.');
    }
  } else {
    record('med_debt', 'Medium-interest debt', false, 'Waits until high-interest debt is paid off.');
  }

  // ── Rule 5: IRA (Roth or traditional), year-specific limits ───────────────
  if (highDebtTotal === 0) {
    const iraLimit = ty.limits.ira + (age >= 50 ? ty.limits.iraCatchUp50 : 0);
    const magi = gross > 0 ? gross - pretax401k : null;
    const roth = magi != null ? rothIraAllowance({ magi, filingStatus: status, year: ty.year, age }) : null;
    const backdoor = roth?.status === 'none';
    const annualRoom = roth && roth.status === 'partial' ? roth.amount : iraLimit;
    const label = backdoor ? 'IRA (backdoor Roth)' : 'Roth IRA';
    const rothAlloc = allocate('roth_ira', label, annualRoom / 12, '#8b5cf6');
    if (rothAlloc > 0) {
      const why = [
        `The ${ty.year} IRA limit is ${fmt(ty.limits.ira)}${age >= 50 ? ` plus a ${fmt(ty.limits.iraCatchUp50)} catch-up at ${age}` : ''}: ${fmt(iraLimit / 12)}/mo.`,
        'Roth money grows tax-free and comes out tax-free in retirement, with no required withdrawals.',
      ];
      if (roth?.status === 'partial') {
        why.push(`Your income (${fmt(magi)}) is inside the ${fmt(roth.range[0])}–${fmt(roth.range[1])} phase-out, so you can put in ${fmt(roth.amount)} directly this year.`);
      } else if (backdoor) {
        why.push(`Your income (${fmt(magi)}) is above the ${fmt(roth.range[1])} Roth limit. A "backdoor" Roth (a nondeductible traditional IRA contribution, then converting it) still gets money in. It's worth a tax pro's review if you have other IRA balances.`);
      } else if (magi == null) {
        why.push('Add your salary to check you\'re under the Roth IRA income limit.');
      }
      if (tax && tax.accountChoice === 'traditional') {
        why.push('Your tax picture favors traditional accounts, so lean on your 401(k)\'s traditional option. A traditional IRA is often not deductible when you have a workplace plan, which is why we still suggest Roth here.');
      }
      advice.push({
        ruleId: 'roth_ira', priority: 5,
        status: rothAlloc >= annualRoom / 12 - 0.5 ? 'complete' : 'in_progress',
        title: backdoor ? 'Fund a backdoor Roth IRA' : 'Max out your Roth IRA',
        rationale: `Tax-free growth and withdrawals in retirement. Contribute up to ${fmt(annualRoom)}/year.`,
        monthlyAmount: rothAlloc,
        detail: `Contributing ${fmt(rothAlloc)}/mo toward your ${label} (limit: ${fmt(annualRoom / 12)}/mo).`,
        why,
        facts: [
          ['Tax year', `${ty.year}${ty.approximate ? ' (latest known)' : ''}`],
          ['Annual limit', fmt(annualRoom)],
          ...(roth ? [['Roth income limit', `${fmt(roth.range[0])}–${fmt(roth.range[1])}`]] : []),
        ],
      });
      record('roth_ira', 'IRA', true, `${fmt(rothAlloc)}/mo of ${fmt(annualRoom / 12)}/mo room.`);
    } else {
      record('roth_ira', 'IRA', false, 'No surplus left.');
    }
  } else {
    record('roth_ira', 'IRA', false, 'Waits until high-interest debt is paid off.');
  }

  // ── Rule 6: Goals (soonest first, ≤ 30% of what's left each) ───────────────
  const goals = [...(profile.goals || [])].sort((a, b) => a.targetMonths - b.targetMonths);
  for (const goal of goals) {
    if (remaining <= 0) {
      record(`goal_${goal.id}`, `Goal: ${goal.label}`, false, 'No surplus left.');
      continue;
    }
    const saved = (goal.contributions || []).reduce((s, c) => s + (c.amount || 0), 0) || goal.currentSaved || 0;
    const needed = Math.max(0, goal.targetAmount - saved);
    const monthly = needed / Math.max(goal.targetMonths, 1);
    const goalAlloc = allocate(`goal_${goal.id}`, goal.label, Math.min(remaining * 0.3, monthly), '#10b981');
    if (goalAlloc > 0) {
      const onTrack = goalAlloc >= monthly - 0.5;
      advice.push({
        ruleId: `goal_${goal.id}`, priority: 6, status: 'in_progress',
        title: `Goal: ${goal.label}`,
        rationale: 'Dedicated savings for your stated goal.',
        monthlyAmount: goalAlloc,
        detail: `Target ${fmt(goal.targetAmount)} in ${fmtMonths(goal.targetMonths)}. Contributing ${fmt(goalAlloc)}/mo. On track: ${onTrack ? 'Yes' : 'No: increase contributions or extend timeline'}.`,
        why: [
          `You need ${fmt(needed)} more in ${fmtMonths(goal.targetMonths)}: ${fmt(monthly)}/mo.`,
          'Goals are funded soonest-deadline first, each capped at 30% of what\'s left so one goal can\'t crowd out the rest.',
          ...(onTrack ? [] : ['That cap means you\'re behind pace. Extend the deadline or free up more surplus.']),
          ...(goal.targetMonths <= 60 ? ['With under 5 years to go, keep this in savings or bonds rather than stocks. See its odds in Simulate.'] : []),
        ],
        facts: [['Target', fmt(goal.targetAmount)], ['Saved', fmt(saved)], ['Deadline', fmtMonths(goal.targetMonths)]],
      });
      record(`goal_${goal.id}`, `Goal: ${goal.label}`, true, `${fmt(goalAlloc)}/mo of ${fmt(monthly)}/mo needed.`);
    } else {
      record(`goal_${goal.id}`, `Goal: ${goal.label}`, false, 'Already fully funded.');
    }
  }

  // ── Rule 7: Beyond the match: more 401(k) when traditional saves tax ───────
  if (k.available === true && tax && highDebtTotal === 0 && remaining > 0
      && (tax.accountChoice === 'traditional' || tax.accountChoice === 'split') && tax.marginalRate >= 0.22) {
    const limit = k401Limit(ty.year, age);
    const targetPct = Math.max(current401kPct, k.matchLimitPercent || 0);
    const roomGross = Math.max(0, limit - gross * targetPct / 100);
    const roomTakeHome = roomGross / 12 * (1 - tax.marginalRate);
    const extra = allocate('max_401k', '401(k) beyond match', Math.min(remaining * 0.5, roomTakeHome), '#0284c7');
    if (extra > 0) {
      const grossEquivalent = extra / (1 - tax.marginalRate);
      advice.push({
        ruleId: 'max_401k', priority: 6.5, status: 'in_progress',
        title: 'Put more into your 401(k)',
        rationale: `At a ${pct(tax.marginalRate)} rate, pre-tax 401(k) dollars beat a taxable brokerage account.`,
        monthlyAmount: extra,
        detail: `Raising contributions by about ${fmt(grossEquivalent)}/mo of salary costs ${fmt(extra)}/mo of take-home.`,
        why: [
          tax.accountReason,
          `Every $1 of salary you defer saves ${pct(tax.marginalRate)} in federal tax this year: ${fmt(grossEquivalent * tax.marginalRate * 12)} a year at this level.`,
          `The ${ty.year} employee limit is ${fmt(limit)}${age >= 50 ? ' including your catch-up' : ''}. Up to half of what's left goes here; the rest stays flexible.`,
        ],
        facts: [['Marginal rate', pct(tax.marginalRate)], ['401(k) limit', fmt(limit)], ['Room left', `${fmt(roomGross)}/yr`]],
      });
      record('max_401k', '401(k) beyond match', true, `${pct(tax.marginalRate)} bracket favors pre-tax.`);
    }
  } else {
    record('max_401k', '401(k) beyond match', false,
      k.available !== true ? 'No 401(k) details.'
        : !tax ? 'Needs salary to compare tax rates.'
          : tax.marginalRate < 0.22 ? `At ${pct(tax.marginalRate)}, Roth/taxable is as good or better.`
            : 'Waits for earlier steps.');
  }

  // ── Rule 8: Invest the rest ────────────────────────────────────────────────
  if (remaining > 0 && highDebtTotal === 0) {
    const risk = profile.riskTolerance || 'moderate';
    const split = STOCK_BOND_SPLITS[risk];
    const stockAmt = allocate('stocks', 'Stock Index Funds', remaining * split.stocks, '#3b82f6');
    const bondAmt = allocate('bonds', 'Bond Funds', remaining * split.bonds, '#06b6d4');
    const cashAmt = allocate('cash_savings', 'High-Yield Savings', remaining * split.cash, '#84cc16');
    if (stockAmt + bondAmt + cashAmt > 0) {
      advice.push({
        ruleId: 'invest', priority: 7, status: 'in_progress',
        title: 'Invest the remaining surplus',
        rationale: `Based on your ${risk} risk tolerance.`,
        monthlyAmount: stockAmt + bondAmt + cashAmt,
        detail: `Split: ${fmt(stockAmt)}/mo stocks, ${fmt(bondAmt)}/mo bonds, ${fmt(cashAmt)}/mo high-yield savings.`,
        why: [
          'Everything with a guaranteed return or tax break is handled above, so the rest goes to long-term growth.',
          `Your ${risk} risk tolerance sets the mix: ${Math.round(split.stocks * 100)}% stocks / ${Math.round(split.bonds * 100)}% bonds / ${Math.round(split.cash * 100)}% cash.`,
        ],
        facts: [['Risk tolerance', risk], ['Stocks', `${fmt(stockAmt)}/mo`], ['Bonds', `${fmt(bondAmt)}/mo`]],
      });
      record('invest', 'Invest the rest', true, `${fmt(stockAmt + bondAmt + cashAmt)}/mo left over.`);
    }
  } else {
    record('invest', 'Invest the rest', false, highDebtTotal > 0 ? 'Waits until high-interest debt is paid off.' : 'Nothing left over.');
  }

  // ── Rule 9: Emergency fund top-up (3 → 6 months) ───────────────────────────
  const efTopUpGap = Math.max(0, efTarget - efBalance);
  if (efBalance >= efMin && efTopUpGap > 0 && remaining > 0) {
    const topUp = allocate('emergency_topup', 'Emergency Fund (6-mo target)', Math.min(remaining * 0.1, efTopUpGap / 12), '#a78bfa');
    if (topUp > 0) {
      advice.push({
        ruleId: 'emergency_topup', priority: 8, status: 'in_progress',
        title: 'Grow your emergency fund to 6 months',
        rationale: 'Extend your safety net from 3 to 6 months of expenses.',
        monthlyAmount: topUp,
        detail: `Adding ${fmt(topUp)}/mo to reach the ${fmt(efTarget)} 6-month target.`,
        why: ['Three months covers most surprises; six covers a longer job search. It\'s a slow top-up so it doesn\'t stall investing.'],
        facts: [['Saved', fmt(efBalance)], ['6-month target', fmt(efTarget)]],
      });
    }
  }

  if (remaining > 0) {
    allocations.push({ ruleId: 'buffer', label: 'Discretionary / Buffer', monthlyAmount: remaining, color: '#d1d5db' });
  }

  advice.sort((a, b) => a.priority - b.priority);
  return { advice, allocations, trace, tax, surplus, remaining, year: ty.year };
}
