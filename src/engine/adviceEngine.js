import {
  HIGH_INTEREST_THRESHOLD, MEDIUM_INTEREST_THRESHOLD,
  ROTH_IRA_MONTHLY_LIMIT, EMERGENCY_FUND_MIN_MONTHS,
  EMERGENCY_FUND_TARGET_MONTHS, STOCK_BOND_SPLITS
} from '../constants/financeRules.js';
import { totalExpenses, monthlySurplus } from '../utils/calculations.js';
import { fmt, fmtMonths } from '../utils/formatters.js';

export function runAdviceEngine(profile) {
  const surplus = monthlySurplus(profile);
  const monthlyExpenses = totalExpenses(profile);
  const advice = [];
  const allocations = [];
  let remaining = Math.max(0, surplus);

  function allocate(ruleId, label, amount, color) {
    const a = Math.min(remaining, Math.max(0, amount));
    if (a > 0) allocations.push({ ruleId, label, monthlyAmount: a, color });
    remaining = Math.max(0, remaining - a);
    return a;
  }

  // Rule 1: Emergency fund (min 3 months)
  const efBalance = profile.emergencyFundBalance || 0;
  const efMin = monthlyExpenses * EMERGENCY_FUND_MIN_MONTHS;
  const efTarget = monthlyExpenses * EMERGENCY_FUND_TARGET_MONTHS;
  const efGap = Math.max(0, efMin - efBalance);
  let efAlloc = 0;
  if (efGap > 0) {
    const monthsToFill = 6;
    efAlloc = allocate('emergency_min', 'Emergency Fund (3-mo)', efGap / monthsToFill, '#6366f1');
    advice.push({
      ruleId: 'emergency_min', priority: 1,
      title: 'Build Your Emergency Fund',
      rationale: 'A 3-month emergency fund is your financial safety net before tackling other goals.',
      monthlyAmount: efAlloc,
      status: 'in_progress',
      detail: `You have ${fmt(efBalance)} saved. Your 3-month target is ${fmt(efMin)}. Contributing ${fmt(efAlloc)}/mo closes the gap in ${fmtMonths(Math.ceil(efGap / Math.max(efAlloc,1)))}.`
    });
  } else {
    advice.push({
      ruleId: 'emergency_min', priority: 1,
      title: 'Emergency Fund (3 months)',
      rationale: 'Your 3-month emergency fund is funded.',
      monthlyAmount: 0, status: 'complete',
      detail: `You have ${fmt(efBalance)}, which covers ${Math.floor(efBalance / Math.max(monthlyExpenses,1))} months of expenses.`
    });
  }

  // Rule 2: High-interest debt (>7%)
  const highDebt = (profile.debts || []).filter(d => d.interestRate > HIGH_INTEREST_THRESHOLD)
    .sort((a,b) => b.interestRate - a.interestRate);
  const highDebtTotal = highDebt.reduce((s,d) => s + d.balance, 0);
  if (highDebtTotal > 0 && remaining > 0) {
    const hiAlloc = allocate('high_debt', 'High-Interest Debt Payoff', remaining, '#ef4444');
    advice.push({
      ruleId: 'high_debt', priority: 2,
      title: 'Pay Off High-Interest Debt',
      rationale: 'Debt above 7% interest is a guaranteed negative return. Paying it off beats most investments.',
      monthlyAmount: hiAlloc, status: 'in_progress',
      detail: `You have ${fmt(highDebtTotal)} in high-interest debt. Applying ${fmt(hiAlloc)}/mo extra pays it off in ~${fmtMonths(Math.ceil(highDebtTotal / Math.max(hiAlloc,1)))}.`
    });
  } else {
    advice.push({
      ruleId: 'high_debt', priority: 2,
      title: 'High-Interest Debt',
      rationale: 'No high-interest debt (>7%). Great position to be in.',
      monthlyAmount: 0, status: 'complete',
      detail: highDebtTotal > 0 ? `You have high-interest debt but no surplus to pay it down — reduce expenses to free up cash.` : 'No high-interest debt detected.'
    });
  }

  // Rule 3: 401k match (advisory only — we don't know match %)
  if (!advice.find(a => a.ruleId === 'high_debt' && a.status === 'in_progress')) {
    advice.push({
      ruleId: '401k_match', priority: 3,
      title: 'Contribute to 401k (Employer Match)',
      rationale: 'An employer match is a 50–100% instant return. Always capture the full match.',
      monthlyAmount: 0, status: 'complete',
      detail: 'Verify you are contributing at least enough to capture your full employer match. This is free money.'
    });
  }

  // Rule 4: Medium-interest debt (4–7%)
  if (highDebtTotal === 0) {
    const medDebt = (profile.debts || []).filter(d =>
      d.interestRate >= MEDIUM_INTEREST_THRESHOLD && d.interestRate <= HIGH_INTEREST_THRESHOLD
    );
    const medDebtTotal = medDebt.reduce((s,d) => s + d.balance, 0);
    if (medDebtTotal > 0 && remaining > 0) {
      const medAlloc = allocate('med_debt', 'Medium-Interest Debt', remaining * 0.5, '#f97316');
      advice.push({
        ruleId: 'med_debt', priority: 4,
        title: 'Pay Down Medium-Interest Debt',
        rationale: 'Debt at 4–7% is a borderline case — split extra cash between payoff and investing.',
        monthlyAmount: medAlloc, status: 'in_progress',
        detail: `${fmt(medDebtTotal)} in medium-interest debt. Applying ${fmt(medAlloc)}/mo extra while investing the rest.`
      });
    }
  }

  // Rule 5: Roth IRA
  if (highDebtTotal === 0) {
    const rothAlloc = allocate('roth_ira', 'Roth IRA', ROTH_IRA_MONTHLY_LIMIT, '#8b5cf6');
    if (rothAlloc > 0) {
      advice.push({
        ruleId: 'roth_ira', priority: 5,
        title: 'Max Out Roth IRA',
        rationale: 'Tax-free growth and withdrawals in retirement. Contribute up to $7,000/year.',
        monthlyAmount: rothAlloc, status: rothAlloc >= ROTH_IRA_MONTHLY_LIMIT ? 'complete' : 'in_progress',
        detail: `Contributing ${fmt(rothAlloc)}/mo toward your Roth IRA (limit: ${fmt(ROTH_IRA_MONTHLY_LIMIT)}/mo).`
      });
    }
  }

  // Rule 7 (before Rule 6): Goal savings
  const goals = [...(profile.goals || [])].sort((a,b) => a.targetMonths - b.targetMonths);
  for (const goal of goals) {
    if (remaining <= 0) break;
    const needed = Math.max(0, goal.targetAmount - (goal.currentSaved || 0));
    const monthly = needed / Math.max(goal.targetMonths, 1);
    const goalAlloc = allocate(`goal_${goal.id}`, goal.label, Math.min(remaining * 0.3, monthly), '#10b981');
    if (goalAlloc > 0) {
      advice.push({
        ruleId: `goal_${goal.id}`, priority: 6,
        title: `Goal: ${goal.label}`,
        rationale: 'Dedicated savings for your stated financial goal.',
        monthlyAmount: goalAlloc, status: 'in_progress',
        detail: `Target ${fmt(goal.targetAmount)} in ${fmtMonths(goal.targetMonths)}. Contributing ${fmt(goalAlloc)}/mo. On track: ${goalAlloc >= monthly ? 'Yes' : 'No — increase contributions or extend timeline'}.`
      });
    }
  }

  // Rule 6: Invest remaining
  if (remaining > 0 && highDebtTotal === 0) {
    const split = STOCK_BOND_SPLITS[profile.riskTolerance || 'moderate'];
    const stockAmt = allocate('stocks', 'Stock Index Funds', remaining * split.stocks, '#3b82f6');
    const bondAmt = allocate('bonds', 'Bond Funds', remaining * split.bonds, '#06b6d4');
    const cashAmt = allocate('cash_savings', 'High-Yield Savings', remaining * split.cash, '#84cc16');
    if (stockAmt + bondAmt + cashAmt > 0) {
      advice.push({
        ruleId: 'invest', priority: 7,
        title: 'Invest Remaining Surplus',
        rationale: `Based on your ${profile.riskTolerance || 'moderate'} risk tolerance.`,
        monthlyAmount: stockAmt + bondAmt + cashAmt, status: 'in_progress',
        detail: `Split: ${fmt(stockAmt)}/mo stocks, ${fmt(bondAmt)}/mo bonds, ${fmt(cashAmt)}/mo high-yield savings.`
      });
    }
  }

  // Emergency fund top-up (3→6 months)
  const efTopUpGap = Math.max(0, efTarget - efBalance);
  if (efBalance >= efMin && efTopUpGap > 0 && remaining > 0) {
    const topUp = allocate('emergency_topup', 'Emergency Fund (6-mo target)', Math.min(remaining * 0.1, efTopUpGap / 12), '#a78bfa');
    if (topUp > 0) {
      advice.push({
        ruleId: 'emergency_topup', priority: 8,
        title: 'Grow Emergency Fund to 6 Months',
        rationale: 'Extend your safety net from 3 to 6 months of expenses.',
        monthlyAmount: topUp, status: 'in_progress',
        detail: `Adding ${fmt(topUp)}/mo to reach the ${fmt(efTarget)} 6-month target.`
      });
    }
  }

  // Buffer
  if (remaining > 0) {
    allocations.push({ ruleId: 'buffer', label: 'Discretionary / Buffer', monthlyAmount: remaining, color: '#d1d5db' });
  }

  // Sort advice by priority
  advice.sort((a,b) => a.priority - b.priority);

  return { advice, allocations, surplus, remaining };
}
