import { useMemo, useState } from 'react';
import {
  C, fmtCompact, niceTicks, addMonths, monthLabel, useElementWidth,
  useTweened, useReveal, linePath, areaPath,
} from './chartUtils.js';
import { fmt } from '../../utils/formatters.js';

const M = { top: 14, right: 14, bottom: 26, left: 50 };

function nearestIndex(xs, x) {
  let lo = 0, hi = xs.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= x) lo = mid; else hi = mid;
  }
  return Math.abs(xs[lo] - x) <= Math.abs(xs[hi] - x) ? lo : hi;
}

export function LegendItem({ kind, color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: C.text3 }}>
      {kind === 'line' && <span className="inline-block w-3.5 h-[2px] rounded-full" style={{ background: color }} />}
      {kind === 'band' && <span className="inline-block w-3.5 h-2.5 rounded-[3px]" style={{ background: color }} />}
      {kind === 'dot' && <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />}
      {label}
    </span>
  );
}

/**
 * Uncertainty fan over time.
 * @param result    { xs: months from now, bands: {p10..p90}, paths?: number[][] }
 * @param history   optional [{ x: months (≤ 0), y }] drawn as a solid line before "Today"
 * @param target    optional goal level
 * @param tooltipExtra (i) => [{label, value}] extra rows for a future column
 */
export function FanChart({
  result, history = null, target = null, targetLabel = 'Goal',
  height = 280, showPaths = true, tooltipExtra, valueLabel = 'Median',
  ariaLabel = 'Projection chart',
}) {
  const [ref, width] = useElementWidth();
  const [hover, setHover] = useState(null);

  const tweenTarget = useMemo(() => {
    if (!result) return null;
    const { xs, bands } = result;
    const histMax = history?.length ? Math.max(...history.map(h => h.y)) : -Infinity;
    const histMin = history?.length ? Math.min(...history.map(h => h.y)) : Infinity;
    const top = Math.max(...bands.p90, target != null ? target * 1.08 : -Infinity, histMax, 1);
    const bottom = Math.min(0, ...bands.p10, histMin);
    return {
      xs, ...bands,
      paths: showPaths ? (result.paths || []) : [],
      yMax: top * 1.04,
      yMin: bottom < 0 ? bottom * 1.08 : 0,
    };
  }, [result, history, target, showPaths]);

  const d = useTweened(tweenTarget);
  const reveal = useReveal(1100, !!d);

  const innerW = Math.max(10, width - M.left - M.right);
  const innerH = height - M.top - M.bottom;

  if (!d) {
    return (
      <div ref={ref} style={{ height }} className="relative w-full select-none" aria-busy="true">
        <div className="w-full h-full rounded-xl animate-pulse" style={{ background: '#F6F7F6' }} />
      </div>
    );
  }

  const xMin = history?.length ? Math.min(...history.map(h => h.x)) : 0;
  const xMax = d.xs[d.xs.length - 1] || 1;
  const sx = x => M.left + ((x - xMin) / (xMax - xMin || 1)) * innerW;
  const yTicks = niceTicks(d.yMin, d.yMax, 4);
  const yTop = Math.max(d.yMax, yTicks[yTicks.length - 1]);
  const sy = y => M.top + innerH - ((y - d.yMin) / (yTop - d.yMin || 1)) * innerH;

  // Calendar-year ticks
  const today = new Date();
  const totalYears = (xMax - xMin) / 12;
  const yearStep = totalYears <= 6 ? 1 : totalYears <= 15 ? 2 : totalYears <= 30 ? 5 : 10;
  const xTicks = [];
  const firstYear = addMonths(today, xMin).getFullYear();
  for (let y = Math.ceil(firstYear / yearStep) * yearStep; ; y += yearStep) {
    const mo = (y - today.getFullYear()) * 12 - today.getMonth();
    if (mo > xMax) break;
    if (mo >= xMin) xTicks.push({ mo, label: String(y) });
  }

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const x = xMin + ((px - M.left) / innerW) * (xMax - xMin);
    if (history?.length && x < 0) {
      let best = 0;
      history.forEach((h, i) => { if (Math.abs(h.x - x) < Math.abs(history[best].x - x)) best = i; });
      setHover({ kind: 'history', i: best });
    } else if (result) {
      setHover({ kind: 'future', i: nearestIndex(result.xs, Math.max(0, x)) });
    }
  }

  // Tooltip content always reads the settled result, not the tween.
  let tip = null;
  if (hover?.kind === 'future' && result) {
    const i = hover.i;
    const mo = result.xs[i];
    tip = {
      x: sx(mo),
      y: sy(result.bands.p50[i]),
      dots: [result.bands.p50[i]],
      title: mo === 0 ? 'Today' : monthLabel(addMonths(today, mo)),
      rows: [
        { label: valueLabel, value: fmt(result.bands.p50[i]), strong: true },
        { label: '50% range', value: `${fmtCompact(result.bands.p25[i])} – ${fmtCompact(result.bands.p75[i])}` },
        { label: '80% range', value: `${fmtCompact(result.bands.p10[i])} – ${fmtCompact(result.bands.p90[i])}` },
        ...(tooltipExtra ? tooltipExtra(i) : []),
      ],
    };
  } else if (hover?.kind === 'history' && history) {
    const h = history[hover.i];
    tip = {
      x: sx(h.x), y: sy(h.y), dots: [h.y],
      title: h.label || monthLabel(addMonths(today, h.x)),
      rows: [{ label: 'Net worth', value: fmt(h.y), strong: true }],
    };
  }

  const clipW = M.left + innerW * reveal + 1;
  const clipId = `fan-clip-${height}`;

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      <svg width={width} height={height} role="img" aria-label={ariaLabel} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={M.top} width={clipW} height={innerH} />
          </clipPath>
          <linearGradient id="fan-fade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={C.band} stopOpacity="0.20" />
            <stop offset="100%" stopColor={C.band} stopOpacity="0.10" />
          </linearGradient>
        </defs>

        {/* Grid + y axis */}
        {yTicks.map(t => (
          <g key={t}>
            <line x1={M.left} x2={M.left + innerW} y1={sy(t)} y2={sy(t)} stroke={C.grid} strokeWidth={1} />
            <text x={M.left - 8} y={sy(t)} dy="0.32em" textAnchor="end" fontSize="10.5" fill={C.axis}
              style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmtCompact(t)}
            </text>
          </g>
        ))}
        {xTicks.map(t => (
          <text key={t.mo} x={sx(t.mo)} y={height - 6} textAnchor="middle" fontSize="10.5" fill={C.axis}>
            {t.label}
          </text>
        ))}

        <g clipPath={`url(#${clipId})`}>
          {/* Bands: 10–90 outer, 25–75 inner */}
          <path d={areaPath(d.xs, d.p10, d.p90, sx, sy)} fill="url(#fan-fade)" />
          <path d={areaPath(d.xs, d.p25, d.p75, sx, sy)} fill={C.band} fillOpacity={0.22} />

          {/* Sample paths: individual simulated futures */}
          {d.paths.map((p, i) => (
            <path key={i} d={linePath(d.xs, p, sx, sy)} fill="none" stroke={C.band}
              strokeOpacity={0.16} strokeWidth={1} strokeLinejoin="round" />
          ))}

          <path d={linePath(d.xs, d.p50, sx, sy)} fill="none" stroke={C.median} strokeWidth={2.25}
            strokeLinejoin="round" strokeLinecap="round" />
        </g>

        {/* History */}
        {history?.length > 0 && (
          <>
            <path d={linePath(history.map(h => h.x), history.map(h => h.y), sx, sy)} fill="none"
              stroke={C.history} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <line x1={sx(0)} x2={sx(0)} y1={M.top} y2={M.top + innerH} stroke="#D1D5DB" strokeWidth={1} />
            <text x={sx(0) + 4} y={M.top + 9} fontSize="10" fill={C.text3}>Today</text>
          </>
        )}

        {/* Target */}
        {target != null && target <= yTop && (
          <g>
            <line x1={M.left} x2={M.left + innerW} y1={sy(target)} y2={sy(target)}
              stroke={C.target} strokeWidth={1.5} />
            <rect x={M.left + 6} y={sy(target) - 17} width={targetLabel.length * 5.6 + 58} height={14} rx={4} fill={C.surface} fillOpacity={0.9} />
            <circle cx={M.left + 12} cy={sy(target) - 10} r={3} fill={C.target} />
            <text x={M.left + 19} y={sy(target) - 10} dy="0.32em" fontSize="10.5" fill={C.text2}>
              {targetLabel} {fmtCompact(target)}
            </text>
          </g>
        )}

        {/* End label on the median */}
        {reveal > 0.98 && (
          <g>
            <circle cx={sx(xMax)} cy={sy(d.p50[d.p50.length - 1])} r={4.5} fill={C.median} stroke={C.surface} strokeWidth={2} />
          </g>
        )}

        {/* Crosshair */}
        {tip && (
          <g pointerEvents="none">
            <line x1={tip.x} x2={tip.x} y1={M.top} y2={M.top + innerH} stroke="#9CA3AF" strokeWidth={1} />
            {tip.dots.map((v, i) => (
              <circle key={i} cx={tip.x} cy={sy(v)} r={5} fill={hover.kind === 'history' ? C.history : C.median}
                stroke={C.surface} strokeWidth={2} />
            ))}
          </g>
        )}

        {/* Hit area */}
        <rect x={M.left} y={M.top} width={innerW} height={innerH} fill="transparent"
          style={{ touchAction: 'pan-y', cursor: 'crosshair' }}
          onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
      </svg>

      {tip && (
        <div
          className="absolute pointer-events-none rounded-xl px-3 py-2.5 text-xs"
          style={{
            top: Math.max(0, Math.min(tip.y - 20, height - 120)),
            left: tip.x > width * 0.58 ? undefined : tip.x + 12,
            right: tip.x > width * 0.58 ? width - tip.x + 12 : undefined,
            background: 'rgba(255,255,255,0.96)',
            border: '1px solid #E6E9E6',
            boxShadow: '0 8px 24px rgba(17,24,39,0.10)',
            backdropFilter: 'blur(6px)',
            minWidth: 168,
            zIndex: 5,
          }}
        >
          <p className="font-semibold mb-1.5" style={{ color: C.text1 }}>{tip.title}</p>
          {tip.rows.map(r => (
            <div key={r.label} className="flex justify-between gap-4 leading-5">
              <span style={{ color: C.text3 }}>{r.label}</span>
              <span className={r.strong ? 'font-semibold' : ''} style={{ color: r.strong ? C.text1 : C.text2, fontVariantNumeric: 'tabular-nums' }}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
