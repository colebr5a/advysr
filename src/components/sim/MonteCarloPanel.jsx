import { useMemo, useState } from 'react';
import { useSimulation } from '../../sim/useSimulation.js';
import { historicalSummary, stressImpact, STRESS_SCENARIOS, MARKET } from '../../sim/market.js';
import { fiNumber, isCashAccount } from '../../sim/netWorth.js';
import { STOCK_BOND_SPLITS } from '../../constants/financeRules.js';
import { monthlySurplus } from '../../utils/calculations.js';
import { fmt } from '../../utils/formatters.js';
import { FanChart, LegendItem } from '../charts/FanChart.jsx';
import { Histogram } from '../charts/Histogram.jsx';
import { C, fmtCompact, addMonths, monthLabel } from '../charts/chartUtils.js';
import {
  Card, SectionTitle, Slider, Segmented, Chip, StatTile, AnimatedValue,
  Disclosure, TableToggle,
} from './controls.jsx';
import { fmtPct0, fmtYears } from './format.js';

const round = (v, step) => Math.round(v / step) * step;

function goalSaved(g) {
  return (g.contributions || []).reduce((s, c) => s + (c.amount || 0), 0);
}

function defaultStockPct(risk) {
  const s = STOCK_BOND_SPLITS[risk] || STOCK_BOND_SPLITS.moderate;
  return round((s.stocks / (s.stocks + s.bonds)) * 100, 5);
}

function scenarioFor(profile, goalId) {
  const goal = (profile.goals || []).find(g => g.id === goalId);
  const stockPct = defaultStockPct(profile.riskTolerance);
  if (goal) {
    const saved = goalSaved(goal);
    const months = Math.max(6, round(goal.targetMonths || 24, 6));
    return {
      start: saved,
      monthly: Math.max(0, round((goal.targetAmount - saved) / months, 25)),
      months,
      stockPct,
      target: goal.targetAmount,
      targetLabel: goal.label || 'Goal',
    };
  }
  const accounts = profile.accounts || [];
  const invested = accounts.filter(a => !isCashAccount(a)).reduce((s, a) => s + (a.balance || 0), 0);
  const all = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const fi = fiNumber(profile);
  const age = profile.age || 0;
  return {
    start: Math.round(invested || all),
    monthly: Math.max(0, round(monthlySurplus(profile), 50)),
    months: age > 0 && age < 62 ? Math.min(480, (65 - age) * 12) : 360,
    stockPct,
    target: fi > 0 ? round(fi, 10000) : 1000000,
    targetLabel: fi > 0 ? 'FI number' : 'Target',
  };
}

function MoneyInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-medium" style={{ color: '#6B7280' }}>{label}</span>
      <div className="mt-1 flex items-center rounded-xl px-3" style={{ border: '1.5px solid #E6E9E6', background: '#FFFFFF' }}>
        <span className="text-sm" style={{ color: '#9CA3AF' }}>$</span>
        <input
          inputMode="numeric"
          className="w-full py-2 pl-1 text-sm font-semibold outline-none bg-transparent"
          style={{ color: '#111827' }}
          value={value ? value.toLocaleString('en-US') : ''}
          placeholder="0"
          onChange={e => onChange(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
        />
      </div>
    </label>
  );
}

function chanceTone(p) {
  if (p >= 0.75) return { label: 'On track', bg: '#E8F5EE', fg: '#1B4332', icon: '✓' };
  if (p >= 0.45) return { label: 'Toss-up', bg: '#FEF3E2', fg: '#92400E', icon: '!' };
  return { label: 'Unlikely', bg: '#FDECEC', fg: '#991B1B', icon: '✕' };
}

export function MonteCarloPanel({ profile, initialGoalId }) {
  const goals = profile.goals || [];
  const [scenario, setScenario] = useState(
    goals.some(g => g.id === initialGoalId) ? initialGoalId : 'custom');
  const [inputs, setInputs] = useState(() => scenarioFor(profile, scenario));
  const [method, setMethod] = useState('historical');
  const [real, setReal] = useState(true);
  const [inflation, setInflation] = useState(2.5);
  const [raise, setRaise] = useState(2);
  const [stress, setStress] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const set = key => v => setInputs(s => ({ ...s, [key]: v }));

  function pickScenario(id) {
    setScenario(id);
    setInputs(scenarioFor(profile, id));
    setStress(null);
  }

  const payload = useMemo(() => ({
    compare: true,
    params: {
      startBalance: inputs.start,
      monthlyContribution: inputs.monthly,
      contributionGrowth: raise / 100,
      months: inputs.months,
      stockPct: inputs.stockPct / 100,
      method,
      real,
      inflation: inflation / 100,
      target: inputs.target || null,
      stress,
      trials: 2000,
      samplePaths: 28,
    },
  }), [inputs, method, real, inflation, raise, stress]);

  const { result, running } = useSimulation(payload);
  const history = useMemo(() => historicalSummary(inputs.stockPct / 100), [inputs.stockPct]);

  const endDate = addMonths(new Date(), inputs.months);
  const tone = result?.probability != null ? chanceTone(result.probability) : null;
  const last = arr => arr[arr.length - 1];
  const mixLabel = `${inputs.stockPct}/${100 - inputs.stockPct}`;

  const tableRows = useMemo(() => {
    if (!result) return [];
    const rows = [];
    for (let i = 0; i < result.xs.length; i++) {
      const m = result.xs[i];
      if (m % 12 === 0 || i === result.xs.length - 1) rows.push(i);
    }
    return rows;
  }, [result]);

  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr] md:items-start">
      {/* ── Controls ─────────────────────────────── */}
      <div className="contents md:block md:space-y-4 md:sticky md:top-16">
        <Card className="p-4 space-y-4 order-1">
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: '#6B7280' }}>Simulate</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              <Chip active={scenario === 'custom'} onClick={() => pickScenario('custom')}>Long-term investing</Chip>
              {goals.map(g => (
                <Chip key={g.id} active={scenario === g.id} onClick={() => pickScenario(g.id)}>{g.label}</Chip>
              ))}
            </div>
          </div>

          <Slider label="Monthly contribution" value={inputs.monthly} min={0}
            max={Math.max(5000, round(inputs.monthly * 2, 500))} step={25}
            onChange={set('monthly')} format={v => `${fmt(v)}/mo`} />
          <Slider label="Time horizon" value={inputs.months} min={6} max={480} step={6}
            onChange={set('months')} format={v => `${fmtYears(v)} · ${endDate.getFullYear()}`} />
          <Slider label="Stocks vs bonds" value={inputs.stockPct} min={0} max={100} step={5}
            onChange={set('stockPct')} format={v => `${v}% stocks`} />

          <div className="grid grid-cols-2 gap-3">
            <MoneyInput label="Starting balance" value={inputs.start} onChange={set('start')} />
            <MoneyInput label={inputs.targetLabel} value={inputs.target} onChange={set('target')} />
          </div>
        </Card>

        <Card className="p-4 space-y-4 order-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Assumptions</p>
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Return model</p>
            <Segmented size="sm" ariaLabel="Return model" value={method} onChange={setMethod}
              options={[{ value: 'historical', label: 'Historical' }, { value: 'normal', label: 'Normal' }]} />
          </div>
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Show values in</p>
            <Segmented size="sm" ariaLabel="Dollar basis" value={real ? 'real' : 'nominal'} onChange={v => setReal(v === 'real')}
              options={[{ value: 'real', label: "Today's $" }, { value: 'nominal', label: 'Future $' }]} />
          </div>
          <Slider label="Inflation" value={inflation} min={0} max={6} step={0.25}
            onChange={setInflation} format={v => `${v}%/yr`} />
          <Slider label="Contribution raise" value={raise} min={0} max={8} step={0.5}
            onChange={setRaise} format={v => `${v}%/yr`} hint="Grow your contribution each year, e.g. with raises" />
        </Card>
      </div>

      {/* ── Results ──────────────────────────────── */}
      <div className="space-y-4 min-w-0 order-2 md:order-none">
        <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <p className="text-xs font-medium" style={{ color: '#6B7280' }}>
                Chance of reaching {fmt(inputs.target || 0)} by {monthLabel(endDate)}
              </p>
              <p className="text-5xl font-semibold tracking-tight mt-1" style={{ color: '#111827', letterSpacing: '-0.03em' }}>
                {result?.probability != null
                  ? <AnimatedValue value={result.probability * 100} format={v => `${Math.round(v)}%`} />
                  : '—'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {tone && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: tone.bg, color: tone.fg }}>
                  <span aria-hidden>{tone.icon}</span>{tone.label}
                </span>
              )}
              <span className="text-[11px] flex items-center gap-1.5" style={{ color: '#9CA3AF' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: running ? '#D97706' : '#52B788', transition: 'background 200ms' }} />
                {running ? 'Simulating…' : '2,000 simulations'}
              </span>
            </div>
          </div>

          {result?.compare && (
            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>
              {result.compare.method === 'normal' ? 'A normal-distribution model' : 'Resampling real history'} says{' '}
              <span className="font-semibold" style={{ color: '#374151' }}>{fmtPct0(result.compare.probability)}</span>
              {method === 'historical' && result.compare.p10 > last(result.bands.p10) && (
                <> and a rosier bad case ({fmtCompact(result.compare.p10)} vs {fmtCompact(last(result.bands.p10))}): real markets crash harder than a bell curve predicts.</>
              )}
            </p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-2">
            <LegendItem kind="line" color={C.median} label="Median" />
            <LegendItem kind="band" color="rgba(47,158,110,0.38)" label="50% of outcomes" />
            <LegendItem kind="band" color="rgba(47,158,110,0.16)" label="80% of outcomes" />
            <LegendItem kind="line" color={C.target} label={inputs.targetLabel} />
          </div>

          <FanChart
            result={result}
            target={inputs.target || null}
            targetLabel={inputs.targetLabel}
            height={300}
            ariaLabel="Monte Carlo projection: percentile bands of simulated balances over time"
            tooltipExtra={i => result?.successByCol
              ? [{ label: `Chance ≥ ${fmtCompact(inputs.target)}`, value: fmtPct0(result.successByCol[i]) }]
              : []}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <StatTile label="Median outcome" value={result ? last(result.bands.p50) : null} format={fmtCompact} />
            <StatTile label="Bad case (10th %)" value={result ? last(result.bands.p10) : null} format={fmtCompact} />
            <StatTile label="Good case (90th %)" value={result ? last(result.bands.p90) : null} format={fmtCompact} />
            <StatTile label="You contribute" value={result ? result.totalContributed + inputs.start : null} format={fmtCompact}
              sub={real ? "in today's dollars" : undefined} />
          </div>

          <div className="flex justify-end mt-3">
            <TableToggle open={showTable} onToggle={() => setShowTable(v => !v)} />
          </div>
          {showTable && result && (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <thead>
                  <tr style={{ color: '#6B7280' }}>
                    <th className="text-left font-medium py-1.5">Year</th>
                    <th className="text-right font-medium">10th %</th>
                    <th className="text-right font-medium">Median</th>
                    <th className="text-right font-medium">90th %</th>
                    <th className="text-right font-medium">Chance</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map(i => (
                    <tr key={i} style={{ borderTop: '1px solid #F3F4F3', color: '#374151' }}>
                      <td className="py-1.5">{addMonths(new Date(), result.xs[i]).getFullYear()}</td>
                      <td className="text-right">{fmt(result.bands.p10[i])}</td>
                      <td className="text-right font-semibold">{fmt(result.bands.p50[i])}</td>
                      <td className="text-right">{fmt(result.bands.p90[i])}</td>
                      <td className="text-right">{result.successByCol ? fmtPct0(result.successByCol[i]) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Stress test */}
        <Card className="p-4 sm:p-5">
          <SectionTitle title="Stress test" subtitle="Replay a real crash, month by month, right at the start" />
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
            <Chip active={!stress} onClick={() => setStress(null)}>None</Chip>
            {STRESS_SCENARIOS.map(s => (
              <Chip key={s.id} active={stress === s.id} onClick={() => setStress(s.id)}>{s.label}</Chip>
            ))}
          </div>
          {stress && (() => {
            const sc = STRESS_SCENARIOS.find(s => s.id === stress);
            const impact = stressImpact(stress, inputs.stockPct / 100);
            return (
              <p className="text-sm mt-3 sim-enter" key={stress} style={{ color: '#374151' }}>
                A {mixLabel} portfolio went{' '}
                <span className="font-semibold" style={{ color: impact.ret < 0 ? '#B91C1C' : '#1B4332' }}>
                  {impact.ret < 0 ? '' : '+'}{(impact.ret * 100).toFixed(1)}%
                </span>{' '}
                over {impact.months} month{impact.months === 1 ? '' : 's'} ({sc.start} → {sc.end}).
                The chance above now assumes that happens first.
              </p>
            );
          })()}
        </Card>

        {/* Distribution + drawdown */}
        <Card className="p-4 sm:p-5">
          <SectionTitle title="Where you could end up" subtitle={`The middle 98% of 2,000 outcomes in ${endDate.getFullYear()}`} />
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
            <LegendItem kind="band" color={C.catA} label={`Reaches ${fmtCompact(inputs.target || 0)}`} />
            <LegendItem kind="band" color={C.miss} label="Falls short" />
          </div>
          <Histogram histogram={result?.histogram} target={inputs.target || null} />
          {result && (
            <p className="text-xs mt-3 leading-relaxed" style={{ color: '#6B7280' }}>
              Along the way, a typical path falls{' '}
              <span className="font-semibold" style={{ color: '#374151' }}>{fmtPct0(result.medianMaxDrawdown)}</span>{' '}
              from a peak at some point, and 1 in 10 fall more than{' '}
              <span className="font-semibold" style={{ color: '#374151' }}>{fmtPct0(result.badMaxDrawdown)}</span>.
              Staying invested through that is what the chance above assumes.
            </p>
          )}
        </Card>

        {/* Real history */}
        <Card className="p-4 sm:p-5">
          <SectionTitle title={`How a ${mixLabel} mix actually did`}
            subtitle={`Real monthly returns, ${MARKET.start.slice(0, 4)}–${MARKET.end.slice(0, 4)}`} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatTile label="Annual return" value={`${(history.annualReturn * 100).toFixed(1)}%`} sub="before inflation" />
            <StatTile label="Worst 12 months" value={`${(history.worst12.ret * 100).toFixed(0)}%`} sub={`ending ${history.worst12.end}`} />
            <StatTile label="Best 12 months" value={`+${(history.best12.ret * 100).toFixed(0)}%`} sub={`ending ${history.best12.end}`} />
            <StatTile label="Biggest drop" value={`${(-history.maxDrawdown.dd * 100).toFixed(0)}%`}
              sub={`${history.maxDrawdown.peak} → ${history.maxDrawdown.trough}`} />
          </div>
        </Card>

        <Disclosure title="How this simulation works">
          <p>
            <b>Historical</b> builds each of 2,000 possible futures by stitching together random 12-month
            blocks of real monthly returns ({MARKET.start} to {MARKET.end}, S&amp;P 500 and US bond index funds,
            dividends reinvested). This is a <i>block bootstrap</i>: resampling real history keeps crash months
            like Oct 1987 and Oct 2008, and keeping 12-month blocks preserves how bad months cluster together.
          </p>
          <p>
            <b>Normal</b> draws each month from a bell curve with the same average and volatility. It's the
            textbook model, but monthly stock returns here have an excess kurtosis of{' '}
            {history.excessKurtosis.toFixed(1)} (a bell curve has 0), so it understates extreme months.
          </p>
          <p>
            Contributions are added monthly and grow by your raise each year. "Today's dollars" divides by
            inflation so a future {fmtCompact(1000000)} is shown at what it would buy now. Results use a fixed
            random seed, so the same inputs always give the same answer. Past returns don't guarantee future
            results, and this is an educational estimate, not financial advice.
          </p>
        </Disclosure>
      </div>
    </div>
  );
}
