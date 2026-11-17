import { describe, it, expect } from 'vitest';
import { taxYear } from '../constants/taxYears.js';
import {
  taxableIncome, incomeTax, marginalRate, rothVsTraditional, rothIraAllowance, k401Limit,
} from './tax.js';

describe('tax tables', () => {
  it('returns exact years and flags fallbacks', () => {
    expect(taxYear(2026).approximate).toBe(false);
    expect(taxYear(2027).limits.k401).toBe(25500);
    const future = taxYear(2031);
    expect(future.approximate).toBe(true);
    expect(future.year).toBe(2027);
  });

  it('brackets are ascending with rising rates for every status and year', () => {
    for (const y of [2026, 2027]) {
      for (const s of ['single', 'mfj', 'hoh']) {
        const b = taxYear(y).brackets[s];
        expect(b).toHaveLength(7);
        for (let i = 1; i < b.length; i++) {
          expect(b[i][0]).toBeGreaterThan(b[i - 1][0]);
          expect(b[i][1]).toBeGreaterThan(b[i - 1][1]);
        }
      }
    }
  });
});

describe('incomeTax', () => {
  it('applies brackets progressively (2026 single)', () => {
    // 12,400 × 10% + (50,400 − 12,400) × 12% + (60,000 − 50,400) × 22%
    expect(incomeTax(60000, 'single', 2026)).toBeCloseTo(1240 + 4560 + 2112, 6);
    expect(incomeTax(0, 'single', 2026)).toBe(0);
  });

  it('subtracts the standard deduction and pre-tax contributions', () => {
    expect(taxableIncome(100000, 'single', 2026)).toBe(83900);
    expect(taxableIncome(100000, 'single', 2026, 6000)).toBe(77900);
    expect(taxableIncome(10000, 'mfj', 2026)).toBe(0);
  });

  it('finds the marginal rate', () => {
    expect(marginalRate(83900, 'single', 2026)).toBe(0.22);
    expect(marginalRate(83900, 'mfj', 2026)).toBe(0.12);
    expect(marginalRate(700000, 'single', 2027)).toBe(0.37);
  });
});

describe('rothVsTraditional', () => {
  it('favors Roth in low brackets', () => {
    const r = rothVsTraditional({ grossAnnual: 45000, filingStatus: 'single', year: 2026, annualSpending: 36000 });
    expect(r.nowRate).toBe(0.12);
    expect(r.choice).toBe('roth');
  });

  it('favors traditional when today\'s rate beats the retirement rate', () => {
    const r = rothVsTraditional({ grossAnnual: 180000, filingStatus: 'single', year: 2026, annualSpending: 60000 });
    expect(r.nowRate).toBe(0.24);
    expect(r.retireRate).toBe(0.12);
    expect(r.choice).toBe('traditional');
  });

  it('splits when the rates match', () => {
    const r = rothVsTraditional({ grossAnnual: 110000, filingStatus: 'single', year: 2026, annualSpending: 100000 });
    expect(r.nowRate).toBe(0.22);
    expect(r.retireRate).toBe(0.22);
    expect(r.choice).toBe('split');
  });
});

describe('rothIraAllowance', () => {
  it('is full below, partial inside, and zero above the phase-out', () => {
    expect(rothIraAllowance({ magi: 100000, filingStatus: 'single', year: 2026 }))
      .toMatchObject({ status: 'full', amount: 7500 });
    const mid = rothIraAllowance({ magi: 160500, filingStatus: 'single', year: 2026 });
    expect(mid.status).toBe('partial');
    expect(mid.amount).toBe(3750); // halfway through 153k–168k
    expect(rothIraAllowance({ magi: 200000, filingStatus: 'single', year: 2026 }).status).toBe('none');
  });

  it('adds the catch-up at 50', () => {
    expect(rothIraAllowance({ magi: 50000, filingStatus: 'mfj', year: 2027, age: 52 }).amount).toBe(8600);
  });
});

describe('k401Limit', () => {
  it('handles regular, 50+, and 60–63 catch-ups', () => {
    expect(k401Limit(2027, 30)).toBe(25500);
    expect(k401Limit(2027, 55)).toBe(34000);
    expect(k401Limit(2027, 61)).toBe(25500 + 11750);
    expect(k401Limit(2027, 64)).toBe(34000);
  });
});
