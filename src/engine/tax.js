// Federal income tax helpers. Federal only: no state tax, credits, or FICA
// (FICA applies to both Roth and traditional contributions, so it doesn't
// change the Roth-vs-traditional comparison).

import { taxYear } from '../constants/taxYears.js';

const statusOf = s => (s === 'mfj' || s === 'hoh' ? s : 'single');

export function taxableIncome(grossAnnual, filingStatus, year, pretaxDeductions = 0) {
  const t = taxYear(year);
  return Math.max(0, (grossAnnual || 0) - pretaxDeductions - t.standardDeduction[statusOf(filingStatus)]);
}

export function incomeTax(taxable, filingStatus, year) {
  const brackets = taxYear(year).brackets[statusOf(filingStatus)];
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const [start, rate] = brackets[i];
    const end = i + 1 < brackets.length ? brackets[i + 1][0] : Infinity;
    if (taxable <= start) break;
    tax += (Math.min(taxable, end) - start) * rate;
  }
  return tax;
}

export function marginalRate(taxable, filingStatus, year) {
  const brackets = taxYear(year).brackets[statusOf(filingStatus)];
  let rate = brackets[0][1];
  for (const [start, r] of brackets) if (taxable > start) rate = r;
  return rate;
}

/** Room left in the current bracket before the next rate applies. */
export function roomInBracket(taxable, filingStatus, year) {
  const brackets = taxYear(year).brackets[statusOf(filingStatus)];
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (taxable > brackets[i][0]) {
      return i + 1 < brackets.length ? brackets[i + 1][0] - taxable : Infinity;
    }
  }
  return brackets[1][0] - taxable;
}

/**
 * Roth (pay tax now) vs traditional (deduct now, pay tax on withdrawal).
 * Compares today's marginal rate with the rate you'd likely pay on retirement
 * withdrawals, estimating retirement taxable income as your current annual
 * spending (in today's dollars; brackets are inflation-indexed, so today's
 * brackets are a fair stand-in).
 */
export function rothVsTraditional({ grossAnnual, filingStatus, year, annualSpending, pretaxDeductions = 0 }) {
  const t = taxYear(year);
  const status = statusOf(filingStatus);
  const nowTaxable = taxableIncome(grossAnnual, status, t.year, pretaxDeductions);
  const nowRate = marginalRate(nowTaxable, status, t.year);
  const retireTaxable = Math.max(0, (annualSpending || 0) - t.standardDeduction[status]);
  const retireRate = marginalRate(retireTaxable, status, t.year);

  let choice, reason;
  if (nowRate <= 0.12) {
    choice = 'roth';
    reason = `You're in the ${pct(nowRate)} bracket now, which is about as low as it gets. Paying tax now with Roth locks that in, and growth is tax-free.`;
  } else if (nowRate > retireRate) {
    choice = 'traditional';
    reason = `You'd deduct at ${pct(nowRate)} now and likely pay about ${pct(retireRate)} on withdrawals in retirement, so traditional saves more.`;
  } else if (nowRate < retireRate) {
    choice = 'roth';
    reason = `Your retirement spending would put withdrawals in the ${pct(retireRate)} bracket, above your ${pct(nowRate)} rate today, so paying tax now with Roth wins.`;
  } else {
    choice = 'split';
    reason = `Your rate today (${pct(nowRate)}) and your likely retirement rate are the same, so splitting between Roth and traditional hedges against future tax changes.`;
  }
  return { choice, nowRate, retireRate, nowTaxable, retireTaxable, reason };
}

/** Roth IRA eligibility by modified AGI; partial contributions are prorated across the phase-out. */
export function rothIraAllowance({ magi, filingStatus, year, age = 0 }) {
  const t = taxYear(year);
  const status = statusOf(filingStatus);
  const limit = t.limits.ira + (age >= 50 ? t.limits.iraCatchUp50 : 0);
  const [lo, hi] = t.rothIraPhaseOut[status];
  if (magi <= lo) return { status: 'full', amount: limit, limit, range: [lo, hi] };
  if (magi >= hi) return { status: 'none', amount: 0, limit, range: [lo, hi] };
  // IRS rounds the reduced limit up to the next $10, with a $200 minimum.
  const raw = limit * (hi - magi) / (hi - lo);
  return { status: 'partial', amount: Math.max(200, Math.ceil(raw / 10) * 10), limit, range: [lo, hi] };
}

export function k401Limit(year, age = 0) {
  const { limits } = taxYear(year);
  if (age >= 60 && age <= 63) return limits.k401 + limits.k401CatchUp60to63;
  if (age >= 50) return limits.k401 + limits.k401CatchUp50;
  return limits.k401;
}

export const pct = r => `${Math.round(r * 100)}%`;
