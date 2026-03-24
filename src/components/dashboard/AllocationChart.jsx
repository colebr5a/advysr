import { fmt } from '../../utils/formatters.js';

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
}

export function AllocationChart({ allocations }) {
  const total = allocations.reduce((s, a) => s + a.monthlyAmount, 0);
  if (total === 0) return null;

  const cx = 100, cy = 100, r = 80;
  let angle = 0;
  const slices = allocations.map(a => {
    const sweep = (a.monthlyAmount / total) * 360;
    const slice = { ...a, startAngle: angle, endAngle: angle + sweep };
    angle += sweep;
    return slice;
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        {slices.map(s => (
          <path key={s.ruleId} d={arcPath(cx, cy, r, s.startAngle, s.endAngle)} fill={s.color} stroke="white" strokeWidth="2" />
        ))}
        <circle cx={cx} cy={cy} r={30} fill="white" />
        <text x={cx} y={cy-6} textAnchor="middle" className="text-xs" fontSize="10" fill="#6b7280">Total</text>
        <text x={cx} y={cy+8} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#111827">{fmt(total)}</text>
        <text x={cx} y={cy+20} textAnchor="middle" fontSize="8" fill="#9ca3af">/mo</text>
      </svg>
      <div className="w-full space-y-1">
        {slices.map(s => (
          <div key={s.ruleId} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: s.color }} />
              <span className="text-gray-600 truncate max-w-[160px]">{s.label}</span>
            </div>
            <span className="font-medium text-gray-800 ml-2">{fmt(s.monthlyAmount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
