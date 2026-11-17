import { useMemo, useState } from 'react';
import { simulatePayoff, minimumPaymentFor } from '../../sim/debts.js';
import { monthlySurplus } from '../../utils/calculations.js';
import { fmt } from '../../utils/formatters.js';
import { MultiLineChart } from '../charts/MultiLineChart.jsx';
import { LegendItem } from '../charts/FanChart.jsx';
import { C, addMonths, monthLabel } from '../charts/chartUtils.js';
import { Card, SectionTitle, Slider, Segmented, StatTile, Disclosure, TableToggle } from './controls.jsx';
import { fmtYears } from './format.js';

const round = (v, step) => Math.round(v / step) * step;
const when = m => (m == null ? 'Never' : monthLabel(addMonths(new Date(), m)));

export function DebtPayoffPanel({ profile }) {
  const debts = useMemo(() => (profile.debts || []).filter(d => (d.balance || 0) > 0), [profile.debts]);
  const surplus = Math.max(0, monthlySurplus(profile));
  const [extra, setExtra] = useState(Math.min(500, Math.max(50, round(surplus / 2, 25))));
  const [focus, setFocus] = useState('avalanche');
  const [showTable, setShowTable] = useState(false);

  const plans = useMemo(() => ({
    avalanche: simulatePayoff(debts, { extra, strategy: 'avalanche' }),
    snowball: simulatePayoff(debts, { extra, strategy: 'snowball' }),
    minimum: simulatePayoff(debts, { strategy: 'minimum' }),
  }), [debts, extra]);

  if (debts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#E8F5EE' }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#1B4332" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="font-semibold" style={{ color: '#111827' }}>No debts to pay off</p>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Add debts in your profile to compare payoff strategies.</p>
      </Card>
    );
  }

  const { avalanche: av, snowball: sn, minimum: mn } = plans;
  const sel = plans[focus];
  const fastest = Math.max(av.months ?? 600, sn.months ?? 600);
  // Keep the chart readable when minimums take decades (or never finish).
  const chartMonths = Math.min(mn.series.length - 1, Math.max(24, Math.round(fastest * 2)));
  const totalMin = debts.reduce((s, d) => s + minimumPaymentFor(d), 0);

  // With some debts both strategies pick the same order and the lines coincide;
  // draw them as one instead of hiding one line under the other.
  const sameOrder = av.payoffs.map(p => p.id).join() === sn.payoffs.map(p => p.id).join();
  const minSeries = { id: 'minimum', label: 'Minimums only', color: C.neutral, values: mn.series.slice(0, chartMonths + 1) };
  const series = sameOrder
    ? [{ id: 'avalanche', label: 'Avalanche & snowball', color: C.catA, values: av.series }, minSeries]
    : [
      { id: 'avalanche', label: 'Avalanche', color: C.catA, values: av.series },
      { id: 'snowball', label: 'Snowball', color: C.catB, values: sn.series },
      minSeries,
    ];

  const interestSaved = mn.paidOff ? mn.totalInterest - sel.totalInterest : null;
  const avVsSn = sn.totalInterest - av.totalInterest;
  const firstWinGap = (av.payoffs[0]?.month ?? 0) - (sn.payoffs[0]?.month ?? 0);

  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr] md:items-start">
      <div className="contents md:block md:space-y-4 md:sticky md:top-16">
        <Card className="p-4 space-y-4 order-1">
          <Slider label="Extra payment" value={extra} min={0} max={Math.max(1000, round(surplus, 100))} step={25}
            onChange={setExtra} format={v => `+${fmt(v)}/mo`}
            hint={`On top of ${fmt(totalMin)}/mo in minimums`} />
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Strategy</p>
            <Segmented size="sm" ariaLabel="Payoff strategy" value={focus} onChange={setFocus}
              options={[{ value: 'avalanche', label: 'Avalanche' }, { value: 'snowball', label: 'Snowball' }]} />
            <p className="text-[11px] mt-1.5" style={{ color: '#9CA3AF' }}>
              {focus === 'avalanche' ? 'Highest interest rate first: the least interest paid.' : 'Smallest balance first: the quickest early wins.'}
            </p>
          </div>
        </Card>

        <Card className="p-4 order-3">
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>
            {focus === 'avalanche' ? 'Avalanche' : 'Snowball'} order
          </p>
          <ol className="space-y-3">
            {sel.payoffs.map((p, i) => {
              const d = debts.find(x => (x.id ?? '') === p.id) || {};
              return (
                <li key={p.id} className="flex items-center gap-3 sim-enter" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                    style={{ background: '#E8F5EE', color: '#1B4332' }}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: '#111827' }}>{p.label}</p>
                    <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                      {fmt(d.balance || 0)} at {((d.interestRate || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#374151' }}>{when(p.month)}</span>
                </li>
              );
            })}
            {!sel.paidOff && (
              <li className="text-xs" style={{ color: '#B91C1C' }}>Some balances never clear: payments don't cover interest.</li>
            )}
          </ol>
        </Card>
      </div>

      <div className="space-y-4 min-w-0 order-2 md:order-none">
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Debt-free with {focus}</p>
          <p className="text-5xl font-semibold tracking-tight mt-1" style={{ color: '#111827', letterSpacing: '-0.03em' }}>
            {when(sel.months)}
          </p>
          <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
            {sel.months != null ? `${fmtYears(sel.months)} from now · ${fmt(sel.totalInterest)} in interest` : 'Increase payments to clear every balance'}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 mb-2">
            {sameOrder
              ? <LegendItem kind="line" color={C.catA} label={`Avalanche & snowball · ${when(av.months)}`} />
              : <>
                <LegendItem kind="line" color={C.catA} label={`Avalanche · ${when(av.months)}`} />
                <LegendItem kind="line" color={C.catB} label={`Snowball · ${when(sn.months)}`} />
              </>}
            <LegendItem kind="line" color={C.neutral} label={`Minimums only · ${when(mn.months)}`} />
          </div>
          <MultiLineChart series={series} height={250} ariaLabel="Total debt balance over time by payoff strategy" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <StatTile label="Interest paid" value={sel.totalInterest} format={fmt} />
            <StatTile label="Interest saved" value={mn.paidOff ? interestSaved : 'All of it'} format={fmt}
              tone="#1B4332" sub="vs minimums only" />
            <StatTile label="Minimums only" value={when(mn.months)} tone={mn.paidOff ? undefined : '#B91C1C'}
              sub={mn.paidOff
                ? (sel.months != null ? `${fmtYears(mn.months - sel.months)} longer` : undefined)
                : 'interest outgrows the payments'} />
            <StatTile label="Monthly budget" value={sel.budget} format={fmt} sub="minimums + extra" />
          </div>

          <div className="flex justify-end mt-3">
            <TableToggle open={showTable} onToggle={() => setShowTable(v => !v)} />
          </div>
          {showTable && (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <thead>
                  <tr style={{ color: '#6B7280' }}>
                    <th className="text-left font-medium py-1.5">Date</th>
                    {series.map(s => <th key={s.id} className="text-right font-medium">{s.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.floor(chartMonths / 6) + 1 }, (_, k) => k * 6).map(m => (
                    <tr key={m} style={{ borderTop: '1px solid #F3F4F3', color: '#374151' }}>
                      <td className="py-1.5">{m === 0 ? 'Today' : monthLabel(addMonths(new Date(), m))}</td>
                      {series.map(s => <td key={s.id} className="text-right">{fmt(s.values[Math.min(m, s.values.length - 1)])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionTitle title="Avalanche or snowball?" />
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
            {sameOrder ? <>
              For your debts, both strategies pay them off in the same order ({av.payoffs.map(p => p.label).join(' → ')}),
              so they give identical results. Your highest-rate debt is also your smallest. That's the best case:
              quick wins <i>and</i> the least interest.
            </> : <>
            {avVsSn > 1
              ? <>Avalanche saves <b>{fmt(avVsSn)}</b> in interest</>
              : <>Both strategies cost about the same in interest</>}
            {firstWinGap > 0
              ? <>, while snowball pays off your first debt <b>{firstWinGap} month{firstWinGap === 1 ? '' : 's'} sooner</b>.</>
              : <>, and it clears your first debt just as fast.</>}
            {' '}Avalanche is the math-optimal choice; snowball trades a little interest for early wins that help
            many people stick with the plan.
            </>}
          </p>
        </Card>

        <Disclosure title="How this is calculated">
          <p>
            Each month every balance accrues interest at its rate ÷ 12, every debt gets its minimum payment, and the
            rest of your budget goes to the target debt. When a debt is cleared, its minimum rolls into the next one,
            so your monthly budget stays the same until everything is paid.
          </p>
          <p>
            Where a minimum payment isn't set, it's estimated as interest plus 1% of the balance (at least $25), a
            common credit card formula. Rates are assumed fixed.
          </p>
        </Disclosure>
      </div>
    </div>
  );
}
