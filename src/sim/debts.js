// Debt amortization and payoff strategies.

/** Minimum payment, falling back to a typical card formula (interest + 1%, $25 floor). */
export function minimumPaymentFor(debt) {
  if (debt.minimumPayment > 0) return debt.minimumPayment;
  const bal = debt.balance || 0;
  return Math.min(bal, Math.max(25, bal * ((debt.interestRate || 0) / 12) + bal * 0.01));
}

/**
 * Month-by-month payoff.
 *   avalanche — extra money goes to the highest interest rate first (least interest)
 *   snowball  — extra money goes to the smallest balance first (fastest early wins)
 *   minimum   — minimums only; a paid-off debt's payment is not reused
 *
 * For avalanche/snowball the monthly budget is fixed at (sum of minimums + extra),
 * so a cleared debt's minimum rolls into the next target.
 */
export function simulatePayoff(debts, { extra = 0, strategy = 'avalanche', maxMonths = 600 } = {}) {
  const ds = (debts || [])
    .filter(d => (d.balance || 0) > 0)
    .map((d, i) => ({
      id: d.id ?? `d${i}`,
      label: d.label || 'Debt',
      bal: d.balance,
      rate: d.interestRate || 0,
      min: minimumPaymentFor(d),
    }));

  const series = [ds.reduce((s, d) => s + d.bal, 0)];
  const payoffs = [];
  let totalInterest = 0;
  const budget = ds.reduce((s, d) => s + d.min, 0) + (strategy === 'minimum' ? 0 : extra);

  const order = [...ds].sort(strategy === 'snowball'
    ? (a, b) => a.bal - b.bal || b.rate - a.rate
    : (a, b) => b.rate - a.rate || a.bal - b.bal);

  let m = 0;
  while (m < maxMonths && ds.some(d => d.bal > 0)) {
    m++;
    for (const d of ds) {
      if (d.bal <= 0) continue;
      const interest = d.bal * (d.rate / 12);
      d.bal += interest;
      totalInterest += interest;
    }

    let available = budget;
    for (const d of ds) {
      if (d.bal <= 0) continue;
      const pay = Math.min(d.min, d.bal);
      d.bal -= pay;
      available -= pay;
    }
    if (strategy !== 'minimum') {
      for (const d of order) {
        if (available <= 0) break;
        if (d.bal <= 0) continue;
        const pay = Math.min(available, d.bal);
        d.bal -= pay;
        available -= pay;
      }
    }

    for (const d of ds) {
      if (d.bal > 0 && d.bal < 0.005) d.bal = 0;
      if (d.bal === 0 && !payoffs.some(p => p.id === d.id)) {
        payoffs.push({ id: d.id, label: d.label, month: m });
      }
    }
    series.push(ds.reduce((s, d) => s + d.bal, 0));
  }

  const paidOff = ds.every(d => d.bal <= 0);
  return {
    strategy,
    months: paidOff ? m : null,
    series,
    totalInterest,
    payoffs,
    paidOff,
    budget,
  };
}

/**
 * Minimum-payment schedule used by the net worth projection: total debt
 * balance per month, and the monthly payments freed up as debts are cleared.
 *
 * A stated minimum that doesn't cover the interest would compound forever and
 * swamp a decades-long projection, and no lender allows that, so each payment
 * is floored at interest + 1% of the starting balance, which always amortizes.
 */
export function minimumSchedule(debts, months) {
  const ds = (debts || []).filter(d => (d.balance || 0) > 0)
    .map(d => {
      const rate = d.interestRate || 0;
      const floor = d.balance * (rate / 12) + d.balance * 0.01;
      return { bal: d.balance, rate, min: Math.max(minimumPaymentFor(d), floor) };
    });
  const balance = new Float64Array(months + 1);
  const freed = new Float64Array(months + 1);
  balance[0] = ds.reduce((s, d) => s + d.bal, 0);
  let debtFreeMonth = balance[0] === 0 ? 0 : null;

  for (let m = 1; m <= months; m++) {
    let freedNow = 0;
    for (const d of ds) {
      if (d.bal <= 0) { freedNow += d.min; continue; }
      d.bal = d.bal * (1 + d.rate / 12) - d.min;
      if (d.bal <= 0.005) d.bal = 0;
    }
    balance[m] = ds.reduce((s, d) => s + d.bal, 0);
    freed[m] = freedNow;
    if (debtFreeMonth === null && balance[m] === 0) debtFreeMonth = m;
  }
  return { balance, freed, debtFreeMonth };
}
