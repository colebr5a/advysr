import { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { CsvImportModal } from '../components/portfolio/CsvImportModal.jsx';
import { ASSET_CLASSES, TARGET_ALLOCATIONS, getAssetClass } from '../utils/tickerClassifier.js';
import { fmt } from '../utils/formatters.js';

// ─── Donut Chart ──────────────────────────────────────────────────────────

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutArcPath(cx, cy, outerR, innerR, startAngle, endAngle) {
  // Clamp to avoid degenerate arcs
  const sweep = Math.min(endAngle - startAngle, 359.99);
  const end = startAngle + sweep;
  const o1 = polarToCartesian(cx, cy, outerR, startAngle);
  const o2 = polarToCartesian(cx, cy, outerR, end);
  const i1 = polarToCartesian(cx, cy, innerR, end);
  const i2 = polarToCartesian(cx, cy, innerR, startAngle);
  const large = sweep > 180 ? 1 : 0;
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y}`,
    'Z',
  ].join(' ');
}

function DonutChart({ slices, totalValue }) {
  const [hovered, setHovered] = useState(null);
  const cx = 110, cy = 110, outerR = 95, innerR = 62;
  let angle = 0;

  const arcs = slices.map(s => {
    const sweep = (s.value / totalValue) * 360;
    const arc = { ...s, startAngle: angle, endAngle: angle + sweep };
    angle += sweep;
    return arc;
  });

  const active = hovered != null ? arcs.find(a => a.key === hovered) : null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg viewBox="0 0 220 220" className="w-52 h-52 sm:w-60 sm:h-60">
          {arcs.map(arc => (
            <path
              key={arc.key}
              d={donutArcPath(cx, cy, outerR, innerR, arc.startAngle, arc.endAngle)}
              fill={arc.color}
              stroke="#1a1a1a"
              strokeWidth="2"
              style={{ transition: 'opacity 0.15s', opacity: hovered && hovered !== arc.key ? 0.4 : 1, cursor: 'pointer' }}
              onMouseEnter={() => setHovered(arc.key)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* Center text */}
          {active ? (
            <>
              <text x={cx} y={cy - 10} textAnchor="middle" fontSize="11" fill="#9ca3af">{active.label}</text>
              <text x={cx} y={cy + 8} textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">
                {fmt(active.value)}
              </text>
              <text x={cx} y={cy + 24} textAnchor="middle" fontSize="11" fill="#9ca3af">
                {((active.value / totalValue) * 100).toFixed(1)}%
              </text>
            </>
          ) : (
            <>
              <text x={cx} y={cy - 8} textAnchor="middle" fontSize="10" fill="#9ca3af">Portfolio</text>
              <text x={cx} y={cy + 10} textAnchor="middle" fontSize="15" fontWeight="bold" fill="white">
                {fmt(totalValue)}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="w-full mt-2 space-y-1.5">
        {arcs.map(arc => (
          <div
            key={arc.key}
            className="flex items-center justify-between text-sm cursor-pointer rounded-lg px-2 py-1 transition-colors"
            style={{ background: hovered === arc.key ? arc.color + '18' : 'transparent' }}
            onMouseEnter={() => setHovered(arc.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: arc.color }} />
              <span className="text-gray-400 truncate text-xs">{arc.label}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <span className="text-xs text-gray-500">{((arc.value / totalValue) * 100).toFixed(1)}%</span>
              <span className="text-xs font-medium text-white">{fmt(arc.value)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Target vs Actual bars ────────────────────────────────────────────────

function TargetBar({ label, color, actual, target }) {
  const diff = actual - target;
  const maxPct = Math.max(actual, target, 0.01);
  const barWidth = pct => `${Math.min(100, (pct / Math.max(maxPct * 1.2, 0.01)) * 100)}%`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
          <span className="text-xs text-gray-400 truncate">{label}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2 text-xs">
          <span className="text-gray-500">{(actual * 100).toFixed(0)}%</span>
          <span className={`font-semibold ${diff > 0.02 ? 'text-amber-400' : diff < -0.02 ? 'text-blue-400' : 'text-green-400'}`}>
            {diff >= 0 ? '+' : ''}{(diff * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      {/* Actual bar */}
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: '#383838' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: barWidth(actual), background: color, opacity: 0.85 }}
        />
        {/* Target line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 rounded-full"
          style={{ left: barWidth(target), background: '#9ca3af' }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>Actual {(actual * 100).toFixed(1)}%</span>
        <span>Target {(target * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}

// ─── Holdings table ───────────────────────────────────────────────────────

const SORT_KEYS = {
  ticker: (a, b) => a.ticker.localeCompare(b.ticker),
  value: (a, b) => (b.currentValue || 0) - (a.currentValue || 0),
  gainLoss: (a, b) => {
    const ag = a.costBasis != null ? (a.currentValue || 0) - a.costBasis : -Infinity;
    const bg = b.costBasis != null ? (b.currentValue || 0) - b.costBasis : -Infinity;
    return bg - ag;
  },
  gainPct: (a, b) => {
    const ap = a.costBasis ? ((a.currentValue || 0) - a.costBasis) / a.costBasis : -Infinity;
    const bp = b.costBasis ? ((b.currentValue || 0) - b.costBasis) / b.costBasis : -Infinity;
    return bp - ap;
  },
};

function SortHeader({ label, sortKey, active, dir, onSort }) {
  return (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-white transition-colors select-none"
      onClick={() => onSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        {active && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={dir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
          </svg>
        )}
      </span>
    </th>
  );
}

function HoldingsTable({ holdings, totalValue }) {
  const [sortKey, setSortKey] = useState('value');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const hasCostBasis = holdings.some(h => h.costBasis != null);

  function handleSort(key) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const sorted = useMemo(() => {
    let filtered = holdings;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = holdings.filter(h =>
        h.ticker.toLowerCase().includes(q) || (h.name || '').toLowerCase().includes(q)
      );
    }
    const fn = SORT_KEYS[sortKey] || SORT_KEYS.value;
    const arr = [...filtered].sort(fn);
    return sortDir === 'asc' ? arr.reverse() : arr;
  }, [holdings, sortKey, sortDir, search]);

  return (
    <div>
      {/* Search */}
      <div className="mb-3 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by ticker or name…"
          className="w-full pl-9 pr-4 py-2 text-sm text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          style={{ background: '#2c2c2c', border: '1px solid #3a3a3a' }}
        />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #3a3a3a' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#383838', borderBottom: '1px solid #3a3a3a' }}>
                <SortHeader label="Ticker" sortKey="ticker" active={sortKey === 'ticker'} dir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Asset Class</th>
                <SortHeader label="Value" sortKey="value" active={sortKey === 'value'} dir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">% of Port.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Shares</th>
                {hasCostBasis && <>
                  <SortHeader label="Gain/Loss" sortKey="gainLoss" active={sortKey === 'gainLoss'} dir={sortDir} onSort={handleSort} />
                  <SortHeader label="Return" sortKey="gainPct" active={sortKey === 'gainPct'} dir={sortDir} onSort={handleSort} />
                </>}
              </tr>
            </thead>
            <tbody>
              {sorted.map((h, i) => {
                const ac = getAssetClass(h.assetClass);
                const pct = totalValue > 0 ? (h.currentValue || 0) / totalValue : 0;
                const gainLoss = h.costBasis != null ? (h.currentValue || 0) - h.costBasis : null;
                const gainPct = h.costBasis ? gainLoss / h.costBasis : null;
                const isGain = gainLoss != null && gainLoss >= 0;

                return (
                  <tr
                    key={h.id}
                    style={{
                      background: i % 2 === 0 ? '#2c2c2c' : '#2f2f2f',
                      borderTop: '1px solid #353535',
                    }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-white">{h.ticker}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate hidden sm:table-cell">
                      {h.name || '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: ac.color + '22', color: ac.color, border: `1px solid ${ac.color}44` }}
                      >
                        {ac.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      {h.currentValue != null ? fmt(h.currentValue) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 h-1.5 rounded-full overflow-hidden hidden sm:block" style={{ background: '#383838' }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct * 100 * 3)}%`, background: ac.color }} />
                        </div>
                        <span className="text-gray-400 text-xs">{(pct * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">
                      {h.shares != null ? h.shares.toLocaleString('en-US', { maximumFractionDigits: 4 }) : '—'}
                    </td>
                    {hasCostBasis && <>
                      <td className="px-4 py-3 text-right font-medium">
                        {gainLoss != null ? (
                          <span className={isGain ? 'text-green-400' : 'text-red-400'}>
                            {isGain ? '+' : ''}{fmt(gainLoss)}
                          </span>
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {gainPct != null ? (
                          <span className={isGain ? 'text-green-400' : 'text-red-400'}>
                            {isGain ? '+' : ''}{(gainPct * 100).toFixed(2)}%
                          </span>
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                    </>}
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500 text-sm">
                    No positions match "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────

function EmptyState({ onImport }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: '#2c2c2c', border: '1px solid #3a3a3a' }}>
        <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">No holdings yet</h2>
      <p className="text-gray-500 text-sm max-w-sm mb-6">
        Import a positions CSV from Fidelity, Schwab, Vanguard, or Robinhood to see your portfolio breakdown, allocation charts, and gain/loss analysis.
      </p>
      <button
        onClick={onImport}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Import Holdings
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────

export function PortfolioPage({ profile, onProfileUpdate }) {
  const [showImport, setShowImport] = useState(false);
  const holdings = profile.holdings || [];
  const riskTolerance = profile.riskTolerance || 'moderate';

  // Compute totals
  const totalValue = holdings.reduce((s, h) => s + (h.currentValue || 0), 0);
  const totalCost = holdings.every(h => h.costBasis == null)
    ? null
    : holdings.reduce((s, h) => s + (h.costBasis || 0), 0);
  const totalGainLoss = totalCost != null ? totalValue - totalCost : null;
  const totalGainPct = totalCost ? totalGainLoss / totalCost : null;
  const isGain = totalGainLoss != null && totalGainLoss >= 0;

  // Compute actual allocation by asset class
  const allocationByClass = useMemo(() => {
    const map = {};
    holdings.forEach(h => {
      const key = h.assetClass || 'other';
      map[key] = (map[key] || 0) + (h.currentValue || 0);
    });
    return map;
  }, [holdings]);

  // Build donut slices (only classes with > 0 value, sorted by value desc)
  const donutSlices = useMemo(() => {
    return Object.entries(allocationByClass)
      .map(([key, value]) => ({ key, value, label: getAssetClass(key).label, color: getAssetClass(key).color }))
      .sort((a, b) => b.value - a.value);
  }, [allocationByClass]);

  // Target allocations for current risk profile
  const targets = TARGET_ALLOCATIONS[riskTolerance] || TARGET_ALLOCATIONS.moderate;

  // Get all asset class keys that appear in either actual or target
  const targetBarKeys = useMemo(() => {
    const keys = new Set([...Object.keys(targets), ...Object.keys(allocationByClass)]);
    return [...keys].sort((a, b) => {
      const ta = targets[a] || 0;
      const tb = targets[b] || 0;
      return tb - ta;
    });
  }, [targets, allocationByClass]);

  function handleImport(newHoldings) {
    onProfileUpdate({ ...profile, holdings: newHoldings });
  }

  const importedDate = holdings[0]?.importedAt;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Investment Portfolio</h1>
          <p className="text-gray-500 text-sm mt-1">
            {holdings.length > 0
              ? `${holdings.length} positions${importedDate ? ` · Imported ${importedDate}` : ''}`
              : 'Import your holdings to get started'}
          </p>
        </div>
        {holdings.length > 0 && (
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-colors flex-shrink-0"
            style={{ border: '1px solid #3a3a3a', background: '#2c2c2c' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Re-import
          </button>
        )}
      </div>

      {holdings.length === 0 ? (
        <EmptyState onImport={() => setShowImport(true)} />
      ) : (
        <>
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="!p-4">
              <p className="text-xs text-gray-500 mb-1">Total Value</p>
              <p className="text-xl font-bold text-white">{fmt(totalValue)}</p>
            </Card>
            <Card className="!p-4">
              <p className="text-xs text-gray-500 mb-1">Positions</p>
              <p className="text-xl font-bold text-white">{holdings.length}</p>
            </Card>
            {totalGainLoss != null ? (
              <>
                <Card className="!p-4">
                  <p className="text-xs text-gray-500 mb-1">Total Gain/Loss</p>
                  <p className={`text-xl font-bold ${isGain ? 'text-green-400' : 'text-red-400'}`}>
                    {isGain ? '+' : ''}{fmt(totalGainLoss)}
                  </p>
                </Card>
                <Card className="!p-4">
                  <p className="text-xs text-gray-500 mb-1">Total Return</p>
                  <p className={`text-xl font-bold ${isGain ? 'text-green-400' : 'text-red-400'}`}>
                    {isGain ? '+' : ''}{(totalGainPct * 100).toFixed(2)}%
                  </p>
                </Card>
              </>
            ) : (
              <Card className="!p-4 col-span-2">
                <p className="text-xs text-gray-500 mb-1">Cost Basis</p>
                <p className="text-sm text-gray-600">Not available — import from a broker that exports cost basis (Fidelity, Schwab) to see gain/loss data.</p>
              </Card>
            )}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut chart */}
            <Card>
              <h2 className="text-base font-bold text-white mb-5">Asset Allocation</h2>
              <DonutChart slices={donutSlices} totalValue={totalValue} />
            </Card>

            {/* Target vs Actual */}
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Target vs. Actual</h2>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{riskTolerance} risk profile</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-1 rounded" style={{ background: '#9ca3af' }} />Target</span>
                </div>
              </div>
              <div className="space-y-4">
                {targetBarKeys.map(key => {
                  const actual = totalValue > 0 ? (allocationByClass[key] || 0) / totalValue : 0;
                  const target = targets[key] || 0;
                  if (actual < 0.001 && target < 0.001) return null;
                  const ac = getAssetClass(key);
                  return (
                    <TargetBar
                      key={key}
                      label={ac.label}
                      color={ac.color}
                      actual={actual}
                      target={target}
                    />
                  );
                })}
              </div>
              <div className="mt-4 pt-4 flex gap-4 text-xs" style={{ borderTop: '1px solid #3a3a3a' }}>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="font-bold">▲</span> Overweight
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="font-bold">▼</span> Underweight
                </span>
                <span className="flex items-center gap-1 text-green-400">
                  <span className="font-bold">●</span> On target (±2%)
                </span>
              </div>
            </Card>
          </div>

          {/* Holdings table */}
          <div>
            <h2 className="text-base font-bold text-white mb-3">All Holdings</h2>
            <HoldingsTable holdings={holdings} totalValue={totalValue} />
          </div>

          <p className="text-xs text-gray-600 text-center pb-4">
            Portfolio data is stored locally. Values reflect your last import — re-import to update prices.
          </p>
        </>
      )}

      {showImport && (
        <CsvImportModal
          onImport={handleImport}
          onClose={() => setShowImport(false)}
          existingCount={holdings.length}
        />
      )}
    </main>
  );
}
