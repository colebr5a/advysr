import { describe, it, expect } from 'vitest';
import { runAdviceEngine } from './adviceEngine.js';

const base = {
  age: 30,
  monthlyIncome: 6000,
  fixedExpenses: { total: 2500 },
  variableExpenses: { total: 1000 },
  emergencyFundBalance: 15000,
  riskTolerance: 'moderate',
  debts: [],
  goals: [],
};

const byId = (r, id) => r.advice.find(a => a.ruleId === id);
const allocated = r => r.allocations.reduce((s, a) => s + a.monthlyAmount, 0);

describe('runAdviceEngine', () => {
  it('never allocates more than the surplus', () => {
    const r = runAdviceEngine({ ...base, debts: [{ id: 'cc', label: 'Card', balance: 5000, interestRate: 0.24 }] }, { year: 2026 });
    expect(allocated(r)).toBeCloseTo(r.surplus, 6);
  });

  it('explains every rule it evaluates', () => {
    const r = runAdviceEngine(base, { year: 2026 });
    const ids = r.trace.map(t => t.ruleId);
    for (const id of ['emergency_min', '401k_match', 'high_debt', 'med_debt', 'roth_ira', 'max_401k', 'invest']) {
      expect(ids).toContain(id);
    }
    for (const t of r.trace) expect(t.reason).toBeTruthy();
    for (const a of r.advice) expect(a.why.length).toBeGreaterThan(0);
  });

  it('asks for 401(k) details when they are missing', () => {
    expect(byId(runAdviceEngine(base, { year: 2026 }), '401k_match').status).toBe('needs_info');
  });

  it('captures the match before paying down high-interest debt', () => {
    const r = runAdviceEngine({
      ...base,
      taxes: { filingStatus: 'single', grossAnnualIncome: 90000 },
      retirement401k: { available: true, matchPercent: 50, matchLimitPercent: 6, contributionPercent: 2 },
      debts: [{ id: 'cc', label: 'Card', balance: 8000, interestRate: 0.25 }],
    }, { year: 2026 });
    const match = byId(r, '401k_match');
    expect(match.status).toBe('in_progress');
    // 4% more of $90k = $300/mo gross; at a 22% rate that's $234/mo of take-home.
    expect(match.monthlyAmount).toBeCloseTo(300 * (1 - 0.22), 6);
    expect(match.detail).toContain('$1,800'); // 4% × 90k × 50% employer money per year
    expect(r.allocations[0].ruleId).toBe('401k_match');
    expect(r.allocations[1].ruleId).toBe('high_debt');
  });

  it('marks the match complete when already contributing enough', () => {
    const r = runAdviceEngine({
      ...base,
      taxes: { filingStatus: 'single', grossAnnualIncome: 90000 },
      retirement401k: { available: true, matchPercent: 100, matchLimitPercent: 4, contributionPercent: 5 },
    }, { year: 2026 });
    expect(byId(r, '401k_match').status).toBe('complete');
  });

  it('uses the tax year\'s IRA limit', () => {
    const r26 = runAdviceEngine(base, { year: 2026 });
    expect(byId(r26, 'roth_ira').detail).toContain('$625/mo'); // 7,500 / 12
  });

  it('suggests a backdoor Roth above the income limit', () => {
    const r = runAdviceEngine({
      ...base, monthlyIncome: 16000,
      taxes: { filingStatus: 'single', grossAnnualIncome: 250000 },
      retirement401k: { available: false },
    }, { year: 2026 });
    const ira = byId(r, 'roth_ira');
    expect(ira.title).toMatch(/backdoor/i);
  });

  it('recommends extra 401(k) only when pre-tax beats Roth', () => {
    const high = runAdviceEngine({
      ...base, monthlyIncome: 11000,
      taxes: { filingStatus: 'single', grossAnnualIncome: 180000 },
      retirement401k: { available: true, matchPercent: 50, matchLimitPercent: 6, contributionPercent: 6 },
    }, { year: 2026 });
    expect(byId(high, 'max_401k')).toBeTruthy();
    expect(high.tax.accountChoice).toBe('traditional');

    const low = runAdviceEngine({
      ...base,
      taxes: { filingStatus: 'single', grossAnnualIncome: 45000 },
      retirement401k: { available: true, matchPercent: 50, matchLimitPercent: 6, contributionPercent: 6 },
    }, { year: 2026 });
    expect(byId(low, 'max_401k')).toBeUndefined();
    expect(low.trace.find(t => t.ruleId === 'max_401k').reason).toMatch(/12%/);
  });

  it('keeps the allocation ids the Home and Invest pages rely on', () => {
    const r = runAdviceEngine(base, { year: 2026 });
    const ids = r.allocations.map(a => a.ruleId);
    expect(ids).toEqual(expect.arrayContaining(['roth_ira', 'stocks', 'bonds']));
  });
});
