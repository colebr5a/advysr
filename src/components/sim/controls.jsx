import { useAnimatedNumber } from '../charts/chartUtils.js';

export function Card({ children, className = '', style }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: '#FFFFFF', border: '1px solid #E6E9E6', boxShadow: '0 1px 2px rgba(17,24,39,0.03)', ...style }}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <p className="font-semibold" style={{ color: '#111827' }}>{title}</p>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, format = v => v, hint }) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-medium" style={{ color: '#6B7280' }}>{label}</span>
        <span className="text-sm font-semibold" style={{ color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        className="sim-range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ '--fill': `${pct}%` }}
        aria-label={label}
      />
      {hint && <p className="text-[11px] mt-1" style={{ color: '#9CA3AF' }}>{hint}</p>}
    </label>
  );
}

/** Pill segmented control with a sliding indicator. */
export function Segmented({ options, value, onChange, size = 'md', ariaLabel }) {
  const idx = Math.max(0, options.findIndex(o => o.value === value));
  const pad = size === 'sm' ? 'py-1.5 text-xs' : 'py-2 text-sm';
  return (
    <div role="tablist" aria-label={ariaLabel} className="relative flex p-1 rounded-xl"
      style={{ background: '#EEF0EC' }}>
      <div aria-hidden className="absolute top-1 bottom-1 rounded-[10px]"
        style={{
          left: `calc(${(idx / options.length) * 100}% + 4px)`,
          width: `calc(${100 / options.length}% - 8px)`,
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(17,24,39,0.12)',
          transition: 'left 320ms cubic-bezier(.2,.8,.2,1)',
        }} />
      {options.map(o => (
        <button key={o.value} role="tab" aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`relative z-[1] flex-1 ${pad} font-medium rounded-[10px] press-effect`}
          style={{ color: o.value === value ? '#111827' : '#6B7280', transition: 'color 200ms' }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium press-effect whitespace-nowrap"
      style={{
        background: active ? '#1B4332' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#374151',
        border: `1px solid ${active ? '#1B4332' : '#E6E9E6'}`,
        transition: 'background 200ms, color 200ms',
      }}>
      {children}
    </button>
  );
}

export function AnimatedValue({ value, format }) {
  const v = useAnimatedNumber(value);
  return <>{format(v)}</>;
}

export function StatTile({ label, value, format, sub, tone }) {
  return (
    <div className="rounded-xl px-3.5 py-3" style={{ background: '#F7F8F6' }}>
      <p className="text-[11px] font-medium" style={{ color: '#6B7280' }}>{label}</p>
      <p className="text-lg font-semibold mt-0.5 leading-tight" style={{ color: tone || '#111827' }}>
        {value == null ? '—' : typeof value === 'number' && format ? <AnimatedValue value={value} format={format} /> : value}
      </p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>{sub}</p>}
    </div>
  );
}

export function Disclosure({ title, children }) {
  return (
    <details className="group rounded-xl" style={{ background: '#F7F8F6' }}>
      <summary className="flex items-center justify-between cursor-pointer list-none px-4 py-3 text-sm font-medium"
        style={{ color: '#374151' }}>
        {title}
        <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </summary>
      <div className="px-4 pb-4 text-xs leading-relaxed space-y-2" style={{ color: '#6B7280' }}>{children}</div>
    </details>
  );
}

export function TableToggle({ open, onToggle }) {
  return (
    <button onClick={onToggle} className="text-xs font-medium press-effect" style={{ color: '#2D6A4F' }}>
      {open ? 'Hide table' : 'View as table'}
    </button>
  );
}
