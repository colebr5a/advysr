import { useMemo, useState } from 'react';
import { C, fmtCompact, useElementWidth, useTweened } from './chartUtils.js';

const M = { top: 8, right: 8, bottom: 24, left: 8 };

/** Distribution of simulated ending values; bins at/above the target are highlighted. */
export function Histogram({ histogram, target = null, height = 150 }) {
  const [ref, width] = useElementWidth();
  const [hover, setHover] = useState(null);

  const tweenTarget = useMemo(
    () => (histogram ? { shares: histogram.bins.map(b => b.share) } : null),
    [histogram],
  );
  const t = useTweened(tweenTarget, 450);

  if (!histogram || !t) return <div ref={ref} style={{ height }} />;

  const bins = histogram.bins;
  const n = bins.length;
  const innerW = Math.max(10, width - M.left - M.right);
  const innerH = height - M.top - M.bottom;
  const slot = innerW / n;
  const barW = Math.min(24, Math.max(2, slot - 2)); // 2px surface gap between bars
  const maxShare = Math.max(...bins.map(b => b.share), 0.0001);
  const sx = v => M.left + ((v - histogram.lo) / (histogram.hi - histogram.lo)) * innerW;

  const ticks = [histogram.lo, (histogram.lo + histogram.hi) / 2, histogram.hi];

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      <svg width={width} height={height} role="img" aria-label="Distribution of simulated outcomes" style={{ display: 'block' }}>
        <line x1={M.left} x2={M.left + innerW} y1={M.top + innerH} y2={M.top + innerH} stroke={C.grid} />
        {bins.map((b, i) => {
          const h = (t.shares[i] ?? 0) / maxShare * innerH;
          const x = M.left + i * slot + (slot - barW) / 2;
          const y = M.top + innerH - h;
          const r = Math.min(4, barW / 2, h);
          // Rounded data-end, square at the baseline.
          const d = h <= 0 ? '' :
            `M${x},${M.top + innerH} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + barW - r},${y} Q${x + barW},${y} ${x + barW},${y + r} L${x + barW},${M.top + innerH} Z`;
          return (
            <path key={i} d={d} fill={b.hit ? C.catA : C.miss}
              opacity={hover == null || hover === i ? 1 : 0.55} />
          );
        })}
        {target != null && target >= histogram.lo && target <= histogram.hi && (
          <line x1={sx(target)} x2={sx(target)} y1={M.top} y2={M.top + innerH} stroke={C.target} strokeWidth={1.5} />
        )}
        {ticks.map((v, i) => (
          <text key={i} x={sx(v)} y={height - 6} fontSize="10.5" fill={C.axis}
            textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}>
            {fmtCompact(v)}
          </text>
        ))}
        {bins.map((b, i) => (
          <rect key={`hit-${i}`} x={M.left + i * slot} y={M.top} width={slot} height={innerH}
            fill="transparent" onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)}
            onPointerLeave={() => setHover(null)} />
        ))}
      </svg>
      {hover != null && (
        <div className="absolute pointer-events-none rounded-lg px-2.5 py-1.5 text-xs"
          style={{
            top: 0,
            left: Math.min(Math.max(0, M.left + hover * slot - 50), width - 150),
            background: 'rgba(255,255,255,0.96)', border: '1px solid #E6E9E6',
            boxShadow: '0 6px 18px rgba(17,24,39,0.10)', whiteSpace: 'nowrap',
          }}>
          <span style={{ color: C.text2 }}>{fmtCompact(bins[hover].x0)} – {fmtCompact(bins[hover].x1)}</span>
          <span className="font-semibold ml-2" style={{ color: C.text1 }}>{(bins[hover].share * 100).toFixed(1)}% of outcomes</span>
        </div>
      )}
    </div>
  );
}
