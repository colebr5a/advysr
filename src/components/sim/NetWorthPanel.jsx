import { useEffect, useMemo, useState } from 'react';
import { useSimulation } from '../../sim/useSimulation.js';
import { computeNetWorth, fiNumber, netWorthInputs } from '../../sim/netWorth.js';
import { firstCrossing } from '../../sim/engine.js';
import { fetchSnapshots } from '../../lib/snapshotService.js';
import { MARKET } from '../../sim/market.js';
import { STOCK_BOND_SPLITS } from '../../constants/financeRules.js';
import { monthlySurplus } from '../../utils/calculations.js';
import { fmt } from '../../utils/formatters.js';
import { FanChart, LegendItem } from '../charts/FanChart.jsx';
import { C, fmtCompact, addMonths, monthLabel } from '../charts/chartUtils.js';
import { Card, SectionTitle, Slider, StatTile, AnimatedValue, Disclosure, TableToggle } from './controls.jsx';
import { fmtYears } from './format.js';

const INFLATION = 0.025;
const CASH_YIELD = 0.035;
const round = (v, step) => Math.round(v / step) * step;

function monthsBetween(from, to) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
    + (to.getDate() - from.getDate()) / 30.44;
}

export function NetWorthPanel({ profile }) {
  const age = profile.age || 0;
  const risk = STOCK_BOND_SPLITS[profile.riskTolerance] || STOCK_BOND_SPLITS.moderate;

  const [savings, setSavings] = useState(Math.max(0, round(monthlySurplus(profile), 50)));
  const [stockPct, setStockPct] = useState(round((risk.stocks / (risk.stocks + risk.bonds)) * 100, 5));
  const [months, setMonths] = useState(age > 0 && age < 62 ? Math.min(480, (65 - age) * 12) : 360);
  const [snapState, setSnapState] = useState({ loaded: false, snapshots: [], available: true });
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchSnapshots().then(r => { if (alive) setSnapState({ loaded: true, ...r }); });
    return () => { alive = false; };
  }, []);

  const now = computeNetWorth(profile);
  const fi = fiNumber(profile);

  const inputs = useMemo(
    () => netWorthInputs(profile, { months, monthlySavings: savings, inflation: INFLATION, cashYield: CASH_YIELD }),
    [profile, months, savings],
  );

  const payload = useMemo(() => ({
    params: {
      startBalance: inputs.startBalance,
      monthlyContribution: inputs.monthlyContribution,
      contributionGrowth: 0.02,
      extraContributions: inputs.extraContributions,
      offsets: inputs.offsets,
      months,
      stockPct: stockPct / 100,
      method: 'historical',
      real: true,
      inflation: INFLATION,
      target: fi > 0 ? fi : null,
      trials: 2000,
      samplePaths: 20,
    },
  }), [inputs, months, stockPct, fi]);

  const { result, running } = useSimulation(payload);

  // Past snapshots (in nominal dollars as recorded), ending at today's live value.
  const history = useMemo(() => {
    const today = new Date();
    const pts = snapState.snapshots
      .map(s => {
        const d = new Date(`${s.date}T12:00:00`);
        return { x: monthsBetween(today, d), y: s.netWorth, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) };
      })
      .filter(p => p.x < -0.5);
    if (pts.length === 0) return null;
    return [...pts, { x: 0, y: now.netWorth, label: 'Today' }];
  }, [snapState.snapshots, now.netWorth]);

  const first = snapState.snapshots[0];
  const change = first ? now.netWorth - first.netWorth : null;

  const crossing = band => (result && fi > 0 ? firstCrossing(result.xs, result.bands[band], fi) : null);
  const fiMedian = crossing('p50');
  const fiEarly = crossing('p90');
  const fiLate = crossing('p10');
  const ageAt = m => (age > 0 ? Math.floor(age + m / 12) : null);
  const fiLabel = m => (m == null ? 'Beyond horizon' : ageAt(m) != null ? `Age ${ageAt(m)}` : addMonths(new Date(), m).getFullYear());

  const endDate = addMonths(new Date(), months);
  const last = arr => arr[arr.length - 1];

  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr] md:items-start">
      <div className="contents md:block md:space-y-4 md:sticky md:top-16">
        <Card className="p-4 space-y-4 order-1">
          <Slider label="Monthly savings" value={savings} min={0} max={Math.max(5000, round(savings * 2, 500))} step={25}
            onChange={setSavings} format={v => `${fmt(v)}/mo`} hint="Defaults to your monthly surplus" />
          <Slider label="Stocks vs bonds" value={stockPct} min={0} max={100} step={5}
            onChange={setStockPct} format={v => `${v}% stocks`} />
          <Slider label="Project until" value={months} min={12} max={480} step={12}
            onChange={setMonths} format={v => `${endDate.getFullYear()}${age ? ` · age ${Math.floor(age + v / 12)}` : ''}`} />
        </Card>

        <Card className="p-4 order-3">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9CA3AF' }}>What's included</p>
          <ul className="text-xs space-y-1.5" style={{ color: '#6B7280' }}>
            <li><span className="font-medium" style={{ color: '#374151' }}>Invested accounts</span> {fmtCompact(inputs.invested0)} follow simulated market returns</li>
            <li><span className="font-medium" style={{ color: '#374151' }}>Cash accounts</span> {fmtCompact(inputs.cash0)} earn {(CASH_YIELD * 100).toFixed(1)}%</li>
            <li><span className="font-medium" style={{ color: '#374151' }}>Debts</span> {fmtCompact(now.liabilities)} shrink at their minimum payments; each cleared payment gets invested</li>
            <li>Savings grow 2%/yr with raises. All values in today's dollars ({(INFLATION * 100).toFixed(1)}% inflation).</li>
          </ul>
        </Card>
      </div>

      <div className="space-y-4 min-w-0 order-2 md:order-none">
        <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium" style={{ color: '#6B7280' }}>
                Projected net worth · {monthLabel(endDate)}{age ? ` (age ${Math.floor(age + months / 12)})` : ''}
              </p>
              <p className="text-5xl font-semibold tracking-tight mt-1" style={{ color: '#111827', letterSpacing: '-0.03em' }}>
                {result ? <AnimatedValue value={last(result.bands.p50)} format={fmtCompact} /> : '—'}
              </p>
              {result && (
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                  80% range {fmtCompact(last(result.bands.p10))} – {fmtCompact(last(result.bands.p90))}
                </p>
              )}
            </div>
            <span className="text-[11px] flex items-center gap-1.5 mt-1" style={{ color: '#9CA3AF' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: running ? '#D97706' : '#52B788', transition: 'background 200ms' }} />
              {running ? 'Simulating…' : 'Up to date'}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 mb-2">
            {history && <LegendItem kind="line" color={C.history} label="Your history" />}
            <LegendItem kind="line" color={C.median} label="Median projection" />
            <LegendItem kind="band" color="rgba(47,158,110,0.38)" label="50% of outcomes" />
            <LegendItem kind="band" color="rgba(47,158,110,0.16)" label="80% of outcomes" />
            {fi > 0 && <LegendItem kind="line" color={C.target} label="FI number" />}
          </div>

          <FanChart
            result={result}
            history={history}
            target={fi > 0 ? fi : null}
            targetLabel="FI number"
            valueLabel="Median net worth"
            height={300}
            ariaLabel="Net worth: past snapshots and projected range"
            tooltipExtra={i => {
              const m = result?.xs[i] ?? 0;
              return age ? [{ label: 'Age', value: String(Math.floor(age + m / 12)) }] : [];
            }}
          />

          {snapState.loaded && !history && (
            <p className="text-xs mt-3 px-3 py-2 rounded-lg" style={{ background: '#F7F8F6', color: '#6B7280' }}>
              {snapState.available
                ? 'Your history starts today. Advysr saves a snapshot each day your balances change, and it will appear here as a line leading into the projection.'
                : 'Net worth history isn’t set up yet, so only the projection is shown.'}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <StatTile label="Net worth today" value={now.netWorth} format={fmtCompact}
              sub={change != null ? `${change >= 0 ? '+' : '−'}${fmtCompact(Math.abs(change))} since ${new Date(`${first.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : undefined} />
            <StatTile label="Financial independence" value={result ? fiLabel(fiMedian) : null}
              sub={fi <= 0 ? 'add expenses to estimate'
                : result && fiMedian != null ? `likely ${fiLabel(fiEarly)} to ${fiLate != null ? fiLabel(fiLate) : 'later'}`
                : `at ${fmtCompact(fi)}`} />
            <StatTile label="Debt-free" value={now.liabilities === 0 ? 'No debt' : inputs.debtFreeMonth != null ? monthLabel(addMonths(new Date(), inputs.debtFreeMonth)) : 'Not on minimums'}
              sub={now.liabilities > 0 ? 'paying minimums' : undefined} />
            <StatTile label="Years projected" value={fmtYears(months)} />
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
                    {age > 0 && <th className="text-right font-medium">Age</th>}
                    <th className="text-right font-medium">10th %</th>
                    <th className="text-right font-medium">Median</th>
                    <th className="text-right font-medium">90th %</th>
                  </tr>
                </thead>
                <tbody>
                  {result.xs.map((m, i) => (m % 12 === 0 || i === result.xs.length - 1) && (
                    <tr key={i} style={{ borderTop: '1px solid #F3F4F3', color: '#374151' }}>
                      <td className="py-1.5">{addMonths(new Date(), m).getFullYear()}</td>
                      {age > 0 && <td className="text-right">{Math.floor(age + m / 12)}</td>}
                      <td className="text-right">{fmt(result.bands.p10[i])}</td>
                      <td className="text-right font-semibold">{fmt(result.bands.p50[i])}</td>
                      <td className="text-right">{fmt(result.bands.p90[i])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {fi > 0 && (
          <Card className="p-4 sm:p-5">
            <SectionTitle title="Your FI number" subtitle="The 4% rule: 25× a year of spending" />
            <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
              You spend about <b>{fmt(fi / 25 / 12)}</b>/mo, so a portfolio of <b>{fmt(fi)}</b> could
              historically fund that indefinitely at a 4% withdrawal rate.{' '}
              {fiMedian != null
                ? <>In the median simulation you get there in <b>{monthLabel(addMonths(new Date(), fiMedian))}</b>{ageAt(fiMedian) ? <> at age <b>{ageAt(fiMedian)}</b></> : null}.</>
                : <>The median simulation doesn't reach it within {fmtYears(months)}. Try a longer horizon or higher savings.</>}
            </p>
          </Card>
        )}

        <Disclosure title="How this projection works">
          <p>
            Each simulated future replays random 12-month blocks of real stock and bond returns (since{' '}
            {MARKET.start.slice(0, 4)}) on your invested balance, adds your monthly savings, then adds your cash and subtracts the
            debt you'd still owe that month. The bands show the spread of 2,000 futures.
          </p>
          <p>
            Your history comes from daily snapshots of your balances in Advysr. Past points are in the dollars of
            their day; the projection is in today's dollars.
          </p>
        </Disclosure>
      </div>
    </div>
  );
}
