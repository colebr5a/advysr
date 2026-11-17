import { describe, it, expect } from 'vitest';
import { simulate, runPayload, firstCrossing } from './engine.js';
import { MARKET, portfolioSeries, seriesStats, stressReturns, historicalSummary } from './market.js';

const base = { startBalance: 10000, monthlyContribution: 500, months: 120, stockPct: 0.7, trials: 400 };

describe('simulate', () => {
  it('is deterministic for a given seed', () => {
    const a = simulate({ ...base, seed: 7 });
    const b = simulate({ ...base, seed: 7 });
    expect(a.bands).toEqual(b.bands);
    const c = simulate({ ...base, seed: 8 });
    expect(c.bands.p50).not.toEqual(a.bands.p50);
  });

  it('produces ordered percentile bands at every point', () => {
    const r = simulate(base);
    for (let i = 0; i < r.xs.length; i++) {
      expect(r.bands.p10[i]).toBeLessThanOrEqual(r.bands.p25[i]);
      expect(r.bands.p25[i]).toBeLessThanOrEqual(r.bands.p50[i]);
      expect(r.bands.p50[i]).toBeLessThanOrEqual(r.bands.p75[i]);
      expect(r.bands.p75[i]).toBeLessThanOrEqual(r.bands.p90[i]);
    }
    expect(r.xs[0]).toBe(0);
    expect(r.xs.at(-1)).toBe(120);
  });

  it('downsamples long horizons but always keeps the final month', () => {
    const r = simulate({ ...base, months: 500, maxPoints: 101 });
    expect(r.xs.length).toBeLessThanOrEqual(102);
    expect(r.xs.at(-1)).toBe(500);
  });

  it('historical bootstrap only uses real consecutive monthly returns', () => {
    const series = portfolioSeries(1);
    const r = simulate({
      startBalance: 1, monthlyContribution: 0, months: 12, stockPct: 1,
      method: 'historical', blockMonths: 12, real: false, trials: 1, samplePaths: 1,
    });
    const ending = r.paths[0].at(-1);
    // Some 12-month (circular) window of history must reproduce it exactly.
    const N = series.length;
    const match = Array.from({ length: N }, (_, s) => {
      let g = 1;
      for (let k = 0; k < 12; k++) g *= 1 + series[(s + k) % N];
      return g;
    }).some(g => Math.abs(g - ending) < 1e-9);
    expect(match).toBe(true);
  });

  it('replays a stress scenario identically in every trial', () => {
    const rets = stressReturns('2008', 0.7);
    const r = simulate({
      startBalance: 1000, monthlyContribution: 0, months: rets.length, stockPct: 0.7,
      stress: '2008', real: false, trials: 50,
    });
    const expected = rets.reduce((g, x) => g * (1 + x), 1000);
    expect(r.bands.p10.at(-1)).toBeCloseTo(expected, 6);
    expect(r.bands.p90.at(-1)).toBeCloseTo(expected, 6);
    expect(expected).toBeLessThan(1000 * 0.75); // it was a real crash
  });

  it('reports today\'s dollars by deflating nominal values', () => {
    const rets = stressReturns('2020', 0.7);
    const params = { startBalance: 1000, monthlyContribution: 0, months: rets.length, stockPct: 0.7, stress: '2020', trials: 5 };
    const nominal = simulate({ ...params, real: false }).bands.p50.at(-1);
    const real = simulate({ ...params, real: true, inflation: 0.03 }).bands.p50.at(-1);
    expect(real).toBeCloseTo(nominal / Math.pow(1.03, rets.length / 12), 6);
  });

  it('computes P(reach target) consistently with the bands', () => {
    const r = simulate({ ...base, target: 80000 });
    expect(r.probability).toBeGreaterThanOrEqual(0);
    expect(r.probability).toBeLessThanOrEqual(1);
    expect(r.probability).toBe(r.successByCol.at(-1));
    // If the median clears the target, at least half the trials do.
    if (r.bands.p50.at(-1) >= 80000) expect(r.probability).toBeGreaterThanOrEqual(0.5);
    else expect(r.probability).toBeLessThanOrEqual(0.5);
  });

  it('applies deterministic offsets to every trial', () => {
    const offsets = new Array(121).fill(-5000);
    const a = simulate(base);
    const b = simulate({ ...base, offsets });
    expect(b.bands.p50.at(-1)).toBeCloseTo(a.bands.p50.at(-1) - 5000, 6);
  });

  it('runPayload compares against the other return model', () => {
    const r = runPayload({ params: { ...base, target: 90000, method: 'historical' }, compare: true });
    expect(r.compare.method).toBe('normal');
    expect(r.compare.probability).toBeGreaterThanOrEqual(0);
  });
});

describe('market data', () => {
  it('has paired, plausible monthly returns', () => {
    expect(MARKET.months.length).toBe(MARKET.stocks.length);
    expect(MARKET.months.length).toBe(MARKET.bonds.length);
    expect(MARKET.months.length).toBeGreaterThan(400);
    const crash = MARKET.stocks[MARKET.months.indexOf('1987-10')];
    expect(crash).toBeLessThan(-0.2);
  });

  it('stock returns have fatter tails than a normal distribution', () => {
    expect(seriesStats(portfolioSeries(1)).excessKurtosis).toBeGreaterThan(1);
  });

  it('summarizes history with real worst/best windows', () => {
    const h = historicalSummary(1);
    expect(h.worst12.ret).toBeLessThan(-0.3);
    expect(h.maxDrawdown.dd).toBeGreaterThan(0.4);
    expect(h.annualReturn).toBeGreaterThan(0.05);
  });
});

describe('firstCrossing', () => {
  it('finds the first x where values reach a level', () => {
    expect(firstCrossing([0, 12, 24], [1, 5, 9], 5)).toBe(12);
    expect(firstCrossing([0, 12, 24], [1, 5, 9], 10)).toBeNull();
  });
});
