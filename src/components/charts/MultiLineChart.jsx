import { useMemo, useState } from 'react';
import {
  C, fmtCompact, niceTicks, addMonths, monthLabel, useElementWidth,
  useTweened, useReveal, linePath,
} from './chartUtils.js';
import { fmt } from '../../utils/formatters.js';

const M = { top: 12, right: 14, bottom: 26, left: 50 };

/**
 * Several series over months-from-now (e.g. debt balance by strategy).
 * series: [{ id, label, color, values: number[] (index = month) }]
 * Series are padded with their last value so they can tween to any length.
 */
export function MultiLineChart({ series, height = 240, ariaLabel = 'Line chart' }) {
  const [ref, width] = useElementWidth();
  const [hover, setHover] = useState(null);

  const months = Math.max(1, ...series.map(s => s.values.length - 1));
  const tweenTarget = useMemo(() => {
    const out = { yMax: Math.max(1, ...series.flatMap(s => s.values)) };
    for (const s of series) {
      const v = s.values.slice();
      while (v.length < months + 1) v.push(v[v.length - 1] ?? 0);
      out[s.id] = v;
    }
    out.months = months;
    return out;
  }, [series, months]);

  const d = useTweened(tweenTarget, 600);
  const reveal = useReveal(1000, !!d);

  if (!d) return <div ref={ref} style={{ height }} />;

  const innerW = Math.max(10, width - M.left - M.right);
  const innerH = height - M.top - M.bottom;
  const xMax = d.months;
  const sx = m => M.left + (m / (xMax || 1)) * innerW;
  const yTicks = niceTicks(0, d.yMax, 4);
  const yTop = Math.max(d.yMax, yTicks[yTicks.length - 1]);
  const sy = v => M.top + innerH - (v / (yTop || 1)) * innerH;

  const today = new Date();
  const years = xMax / 12;
  const yearStep = years <= 5 ? 1 : years <= 12 ? 2 : 5;
  const xTicks = [];
  for (let y = today.getFullYear() + 1; ; y += 1) {
    const mo = (y - today.getFullYear()) * 12 - today.getMonth();
    if (mo > xMax) break;
    if ((y - today.getFullYear()) % yearStep === 0) xTicks.push({ mo, label: String(y) });
  }

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const m = Math.round(((e.clientX - rect.left - M.left) / innerW) * xMax);
    setHover(Math.max(0, Math.min(months, m)));
  }

  const clipId = 'mlc-clip';

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      <svg width={width} height={height} role="img" aria-label={ariaLabel} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <clipPath id={clipId}><rect x={0} y={0} width={M.left + innerW * reveal + 6} height={height} /></clipPath>
        </defs>
        {yTicks.map(t => (
          <g key={t}>
            <line x1={M.left} x2={M.left + innerW} y1={sy(t)} y2={sy(t)} stroke={C.grid} />
            <text x={M.left - 8} y={sy(t)} dy="0.32em" textAnchor="end" fontSize="10.5" fill={C.axis}
              style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(t)}</text>
          </g>
        ))}
        {xTicks.map(t => (
          <text key={t.mo} x={sx(t.mo)} y={height - 6} textAnchor="middle" fontSize="10.5" fill={C.axis}>{t.label}</text>
        ))}
        <g clipPath={`url(#${clipId})`}>
          {series.map(s => {
            const ys = d[s.id];
            const xs = ys.map((_, i) => i * (xMax / (ys.length - 1 || 1)));
            return (
              <path key={s.id} d={linePath(xs, ys, sx, sy)} fill="none" stroke={s.color}
                strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            );
          })}
        </g>
        {/* Payoff markers where each series reaches zero */}
        {reveal > 0.98 && series.map(s => {
          const end = s.values.length - 1;
          if (s.values[end] > 0) return null;
          return <circle key={`end-${s.id}`} cx={sx(end)} cy={sy(0)} r={4.5} fill={s.color} stroke={C.surface} strokeWidth={2} />;
        })}
        {hover != null && (
          <g pointerEvents="none">
            <line x1={sx(hover)} x2={sx(hover)} y1={M.top} y2={M.top + innerH} stroke="#9CA3AF" />
            {series.map(s => {
              const v = s.values[Math.min(hover, s.values.length - 1)];
              return <circle key={s.id} cx={sx(hover)} cy={sy(v)} r={4.5} fill={s.color} stroke={C.surface} strokeWidth={2} />;
            })}
          </g>
        )}
        <rect x={M.left} y={M.top} width={innerW} height={innerH} fill="transparent"
          style={{ touchAction: 'pan-y', cursor: 'crosshair' }}
          onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      {hover != null && (
        <div className="absolute pointer-events-none rounded-xl px-3 py-2.5 text-xs"
          style={{
            top: 4,
            left: sx(hover) > width * 0.58 ? undefined : sx(hover) + 12,
            right: sx(hover) > width * 0.58 ? width - sx(hover) + 12 : undefined,
            background: 'rgba(255,255,255,0.96)', border: '1px solid #E6E9E6',
            boxShadow: '0 8px 24px rgba(17,24,39,0.10)', minWidth: 170,
          }}>
          <p className="font-semibold mb-1.5" style={{ color: C.text1 }}>
            {hover === 0 ? 'Today' : monthLabel(addMonths(today, hover))}
          </p>
          {series.map(s => (
            <div key={s.id} className="flex items-center justify-between gap-4 leading-5">
              <span className="inline-flex items-center gap-1.5" style={{ color: C.text3 }}>
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{s.label}
              </span>
              <span style={{ color: C.text1, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(s.values[Math.min(hover, s.values.length - 1)])}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
