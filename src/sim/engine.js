// Monte Carlo engine.
//
// Two return models, both calibrated to the same historical portfolio series so
// they're an apples-to-apples comparison:
//   - 'historical': circular block bootstrap. Each trial stitches together
//     random 12-month blocks of real monthly returns. Resampling real data keeps
//     the fat tails (crash months) a normal distribution understates, and using
//     blocks instead of single months keeps short-run momentum/volatility
//     clustering intact.
//   - 'normal': i.i.d. Gaussian monthly returns with the series' mean and sd —
//     the textbook model, kept for comparison.
//
// Everything is in "display units": today's dollars when `real` is true
// (deflated by `inflation`), nominal dollars otherwise.

import { mulberry32, gaussian } from './rng.js';
import { portfolioSeries, seriesStats, stressReturns } from './market.js';

const PCTS = [['p10', 0.1], ['p25', 0.25], ['p50', 0.5], ['p75', 0.75], ['p90', 0.9]];

function percentileOfSorted(sorted, p) {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * sorted.length)));
  return sorted[i];
}

/**
 * @param {object} p
 * @param {number} p.startBalance           invested balance today
 * @param {number} p.monthlyContribution    nominal $/month at the start
 * @param {number} [p.contributionGrowth]   annual raise applied to contributions
 * @param {number} p.months                 horizon
 * @param {number} p.stockPct               0..1, rest in bonds; rebalanced monthly
 * @param {'historical'|'normal'} [p.method]
 * @param {number} [p.blockMonths]          bootstrap block length
 * @param {number} [p.inflation]            annual, used when real = true
 * @param {boolean} [p.real]                report in today's dollars
 * @param {number|null} [p.target]          goal, in display units
 * @param {string|null} [p.stress]          STRESS_SCENARIOS id replayed at the start
 * @param {number[]} [p.extraContributions] extra nominal $ added at month m
 * @param {number[]} [p.offsets]            display-unit $ added to every trial at month m
 *                                          (deterministic parts like cash minus debt)
 */
export function simulate(p) {
  const {
    startBalance = 0,
    monthlyContribution = 0,
    contributionGrowth = 0,
    stockPct = 0.7,
    method = 'historical',
    blockMonths = 12,
    inflation = 0.025,
    real = true,
    target = null,
    trials = 2000,
    seed = 20260101,
    stress = null,
    samplePaths = 24,
    extraContributions = null,
    offsets = null,
    maxPoints = 241,
  } = p;
  const months = Math.max(1, Math.round(p.months));

  const series = portfolioSeries(stockPct);
  const N = series.length;
  const { mean, sd } = seriesStats(series);
  const stressRets = stress ? stressReturns(stress, stockPct) : null;

  // Columns we keep (downsampled so long horizons stay cheap to sort and draw).
  const step = Math.max(1, Math.ceil(months / (maxPoints - 1)));
  const xs = [];
  for (let m = 0; m <= months; m += step) xs.push(m);
  if (xs[xs.length - 1] !== months) xs.push(months);
  const C = xs.length;

  // Per-month schedules, computed once.
  const contrib = new Float64Array(months + 1);
  const defl = new Float64Array(months + 1);
  let totalContributed = 0;
  for (let m = 0; m <= months; m++) {
    defl[m] = real ? Math.pow(1 + inflation, m / 12) : 1;
    if (m > 0) {
      contrib[m] = monthlyContribution * Math.pow(1 + contributionGrowth, Math.floor((m - 1) / 12))
        + (extraContributions?.[m] || 0);
      totalContributed += contrib[m] / defl[m];
    }
  }
  const off = m => (offsets ? offsets[m] || 0 : 0);

  const rand = mulberry32(seed);
  const normal = gaussian(rand);
  const values = new Float64Array(trials * C);
  const maxDD = new Float64Array(trials);

  for (let t = 0; t < trials; t++) {
    let bal = startBalance;
    let pos = 0, blockLeft = 0;
    let wealth = 1, peak = 1, dd = 0;
    let c = 0;
    values[t * C] = bal + off(0);

    for (let m = 1; m <= months; m++) {
      let r;
      if (stressRets && m <= stressRets.length) {
        r = stressRets[m - 1];
      } else if (method === 'historical') {
        if (blockLeft === 0) {
          pos = Math.floor(rand() * N);
          blockLeft = blockMonths;
        }
        r = series[pos];
        pos = (pos + 1) % N; // circular: blocks can wrap past the end
        blockLeft--;
      } else {
        r = mean + sd * normal();
      }

      bal = bal * (1 + r) + contrib[m];
      if (bal < 0) bal = 0;

      // Drawdown of the investment itself (ignores contributions).
      wealth *= 1 + r;
      if (wealth > peak) peak = wealth;
      else if (1 - wealth / peak > dd) dd = 1 - wealth / peak;

      if (m === xs[c + 1]) {
        c++;
        values[t * C + c] = bal / defl[m] + off(m);
      }
    }
    maxDD[t] = dd;
  }

  // Percentile bands and P(≥ target) at every kept column.
  const bands = Object.fromEntries(PCTS.map(([k]) => [k, new Array(C)]));
  const successByCol = target != null ? new Array(C) : null;
  const col = new Float64Array(trials);
  for (let c = 0; c < C; c++) {
    let hits = 0;
    for (let t = 0; t < trials; t++) {
      const v = values[t * C + c];
      col[t] = v;
      if (target != null && v >= target) hits++;
    }
    col.sort();
    for (const [k, q] of PCTS) bands[k][c] = percentileOfSorted(col, q);
    if (successByCol) successByCol[c] = hits / trials;
  }

  // Ending distribution
  const endings = new Float64Array(trials);
  for (let t = 0; t < trials; t++) endings[t] = values[t * C + C - 1];
  endings.sort();
  const histogram = buildHistogram(endings, target);

  maxDD.sort();

  const paths = [];
  for (let t = 0; t < Math.min(samplePaths, trials); t++) {
    paths.push(Array.from(values.subarray(t * C, t * C + C)));
  }

  return {
    method,
    months,
    xs,
    bands,
    paths,
    target,
    successByCol,
    probability: successByCol ? successByCol[C - 1] : null,
    totalContributed,
    startBalance: startBalance + off(0),
    histogram,
    // Typical worst peak-to-trough fall a trial lives through, and a bad case.
    medianMaxDrawdown: percentileOfSorted(maxDD, 0.5),
    badMaxDrawdown: percentileOfSorted(maxDD, 0.9),
    model: { monthlyMean: mean, monthlySd: sd, trials, blockMonths },
  };
}

function buildHistogram(sortedEndings, target, binCount = 28) {
  const n = sortedEndings.length;
  const lo = percentileOfSorted(sortedEndings, 0.01);
  const hi = percentileOfSorted(sortedEndings, 0.99);
  if (!(hi > lo)) return { bins: [{ x0: lo, x1: lo + 1, count: n, share: 1, hit: target == null || lo >= target }], lo, hi: lo + 1 };
  const width = (hi - lo) / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    x0: lo + i * width,
    x1: lo + (i + 1) * width,
    count: 0,
  }));
  // Outcomes outside the 1st–99th percentile are left out rather than piled
  // into the edge bins, which would draw a misleading spike.
  for (let i = 0; i < n; i++) {
    const v = sortedEndings[i];
    if (v < lo || v > hi) continue;
    const b = Math.min(binCount - 1, Math.floor((v - lo) / width));
    bins[b].count++;
  }
  for (const b of bins) {
    b.share = b.count / n;
    b.hit = target == null ? true : (b.x0 + b.x1) / 2 >= target;
  }
  return { bins, lo, hi };
}

/** Month index (in xs units) at which a band first reaches `level`, or null. */
export function firstCrossing(xs, values, level) {
  for (let i = 0; i < values.length; i++) {
    if (values[i] >= level) return xs[i];
  }
  return null;
}

/**
 * Entry point used by the worker and the main-thread fallback. With `compare`,
 * also runs the other return model on the same inputs so the UI can show how
 * much the model choice (fat tails vs normal) changes the answer.
 */
export function runPayload({ params, compare = false }) {
  const result = simulate(params);
  if (compare) {
    const method = params.method === 'normal' ? 'historical' : 'normal';
    const alt = simulate({ ...params, method, trials: 1500, samplePaths: 0, maxPoints: 2 });
    result.compare = {
      method,
      probability: alt.probability,
      p10: alt.bands.p10[alt.bands.p10.length - 1],
      p50: alt.bands.p50[alt.bands.p50.length - 1],
    };
  }
  return result;
}
