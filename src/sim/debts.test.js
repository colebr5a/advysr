import { describe, it, expect } from 'vitest';
import { simulatePayoff, minimumPaymentFor, minimumSchedule } from './debts.js';

const card = { id: 'card', label: 'Card', balance: 5000, interestRate: 0.24, minimumPayment: 150 };
const car  = { id: 'car',  label: 'Car',  balance: 2000, interestRate: 0.06, minimumPayment: 100 };
const loan = { id: 'loan', label: 'Loan', balance: 9000, interestRate: 0.05, minimumPayment: 120 };

describe('simulatePayoff', () => {
  it('handles a zero-interest debt exactly', () => {
    const r = simulatePayoff([{ balance: 1000, interestRate: 0, minimumPayment: 100 }], { strategy: 'minimum' });
    expect(r.months).toBe(10);
    expect(r.totalInterest).toBe(0);
    expect(r.series.at(-1)).toBe(0);
  });

  it('avalanche never pays more interest than snowball', () => {
    const debts = [card, car, loan];
    const av = simulatePayoff(debts, { extra: 200, strategy: 'avalanche' });
    const sn = simulatePayoff(debts, { extra: 200, strategy: 'snowball' });
    expect(av.totalInterest).toBeLessThanOrEqual(sn.totalInterest + 1e-6);
  });

  it('snowball clears the smallest balance first; avalanche the highest rate', () => {
    const debts = [card, car, loan];
    expect(simulatePayoff(debts, { extra: 200, strategy: 'snowball' }).payoffs[0].id).toBe('car');
    expect(simulatePayoff(debts, { extra: 200, strategy: 'avalanche' }).payoffs[0].id).toBe('card');
  });

  it('extra payments beat minimums on time and interest', () => {
    const min = simulatePayoff([card, car, loan], { strategy: 'minimum' });
    const av = simulatePayoff([card, car, loan], { extra: 300, strategy: 'avalanche' });
    expect(av.months).toBeLessThan(min.months);
    expect(av.totalInterest).toBeLessThan(min.totalInterest);
  });

  it('flags debts whose payment never covers the interest', () => {
    const r = simulatePayoff([{ balance: 10000, interestRate: 0.3, minimumPayment: 100 }], { strategy: 'minimum', maxMonths: 120 });
    expect(r.paidOff).toBe(false);
    expect(r.months).toBeNull();
  });

  it('does not mutate the input debts', () => {
    const debts = [{ ...card }];
    simulatePayoff(debts, { extra: 500 });
    expect(debts[0].balance).toBe(5000);
  });
});

describe('minimumPaymentFor', () => {
  it('uses the stated minimum, else interest + 1% with a $25 floor', () => {
    expect(minimumPaymentFor(card)).toBe(150);
    expect(minimumPaymentFor({ balance: 1000, interestRate: 0.12 })).toBeCloseTo(25, 6);
    expect(minimumPaymentFor({ balance: 10000, interestRate: 0.12 })).toBeCloseTo(200, 6);
    expect(minimumPaymentFor({ balance: 10, interestRate: 0.2 })).toBe(10);
  });
});

describe('minimumSchedule', () => {
  it('never lets a too-small minimum compound forever', () => {
    const s = minimumSchedule([{ balance: 12000, interestRate: 0.229, minimumPayment: 120 }], 480);
    expect(s.debtFreeMonth).not.toBeNull();
    expect(s.balance[480]).toBe(0);
  });

  it('frees up payments once a debt is cleared', () => {
    const s = minimumSchedule([{ balance: 300, interestRate: 0, minimumPayment: 100 }], 6);
    expect(s.debtFreeMonth).toBe(3);
    expect(s.freed[4]).toBe(100);
    expect(s.balance[6]).toBe(0);
  });
});
