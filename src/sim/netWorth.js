// Net worth model shared by Home, snapshots, and the projection.

import { minimumSchedule } from './debts.js';
import { totalExpenses } from '../utils/calculations.js';

const CASH_RE = /checking|saving|cash|emergency|money\s*market|hysa/i;

export function isCashAccount(account) {
  return CASH_RE.test(`${account.id || ''} ${account.label || ''}`);
}

/** Same definition the Home page shows: account balances minus debts. */
export function computeNetWorth(profile) {
  const accounts = profile?.accounts || [];
  const assets = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const liabilities = (profile?.debts || []).reduce((s, d) => s + (d.balance || 0), 0);
  return { assets, liabilities, netWorth: assets - liabilities };
}

/** 4% rule: 25× annual spending, in today's dollars. */
export function fiNumber(profile) {
  return totalExpenses(profile || {}) * 12 * 25;
}

/**
 * Inputs for simulate() that turn an investment projection into a net worth one:
 *   - invested accounts follow simulated market returns
 *   - cash accounts compound at a fixed `cashYield`
 *   - debts amortize at their minimum payments; once a debt is paid off, its
 *     payment is redirected into investing
 * Cash and debt are deterministic, so they enter as per-month offsets.
 */
export function netWorthInputs(profile, { months, monthlySavings, inflation = 0.025, real = true, cashYield = 0.035 }) {
  const accounts = profile?.accounts || [];
  const cash0 = accounts.filter(isCashAccount).reduce((s, a) => s + (a.balance || 0), 0);
  const invested0 = accounts.filter(a => !isCashAccount(a)).reduce((s, a) => s + (a.balance || 0), 0);

  const { balance: debt, freed, debtFreeMonth } = minimumSchedule(profile?.debts, months);

  const offsets = new Array(months + 1);
  for (let m = 0; m <= months; m++) {
    const cash = cash0 * Math.pow(1 + cashYield / 12, m);
    const defl = real ? Math.pow(1 + inflation, m / 12) : 1;
    offsets[m] = (cash - debt[m]) / defl;
  }

  return {
    startBalance: invested0,
    monthlyContribution: Math.max(0, monthlySavings),
    extraContributions: Array.from(freed),
    offsets,
    debtFreeMonth,
    cash0,
    invested0,
  };
}
