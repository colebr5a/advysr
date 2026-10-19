// Box-Muller transform: turns two uniform randoms into one standard-normal random.
function randNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Simulates `trials` possible futures for a goal, each stepping month-by-month with a
// randomly drawn monthly return, and returns the sorted ending balances plus the
// probability of reaching targetAmount.
export function runMonteCarlo({
  startingAmount,
  monthlyContribution,
  months,
  meanReturn,
  stdDev,
  targetAmount,
  trials = 1000,
}) {
  if (months <= 0) {
    const hit = startingAmount >= targetAmount ? 1 : 0;
    return { endings: [startingAmount], probabilityOfSuccess: hit, p10: startingAmount, p50: startingAmount, p90: startingAmount };
  }

  const monthlyMean = meanReturn / 12;
  const monthlyStdDev = stdDev / Math.sqrt(12);

  const endings = new Array(trials);
  for (let t = 0; t < trials; t++) {
    let balance = startingAmount;
    for (let m = 0; m < months; m++) {
      const monthlyReturn = monthlyMean + monthlyStdDev * randNormal();
      balance = balance * (1 + monthlyReturn) + monthlyContribution;
    }
    endings[t] = Math.max(0, balance);
  }
  endings.sort((a, b) => a - b);

  const successes = endings.filter(e => e >= targetAmount).length;
  const percentile = p => endings[Math.min(endings.length - 1, Math.floor(p * endings.length))];

  return {
    endings,
    probabilityOfSuccess: successes / trials,
    p10: percentile(0.1),
    p50: percentile(0.5),
    p90: percentile(0.9),
  };
}
