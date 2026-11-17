import { FILING_STATUSES } from '../../constants/taxYears.js';

const MATCH_PRESETS = [
  { label: '50% up to 6%', matchPercent: 50, matchLimitPercent: 6 },
  { label: '100% up to 3%', matchPercent: 100, matchLimitPercent: 3 },
  { label: '100% up to 4%', matchPercent: 100, matchLimitPercent: 4 },
  { label: '100% up to 6%', matchPercent: 100, matchLimitPercent: 6 },
];

const inputStyle = { background: '#F9F8F6', border: '1.5px solid #E6E9E6', color: '#111827', outline: 'none' };

function NumberField({ label, value, onChange, prefix, suffix, placeholder }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>{label}</span>
      <div className="relative">
        {prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9CA3AF' }}>{prefix}</span>}
        <input
          inputMode="decimal"
          value={value ? String(value) : ''}
          placeholder={placeholder}
          onChange={e => onChange(Number(e.target.value.replace(/[^0-9.]/g, '')) || 0)}
          className={`w-full py-2.5 rounded-xl text-base ${prefix ? 'pl-7' : 'pl-3.5'} ${suffix ? 'pr-8' : 'pr-3.5'}`}
          style={inputStyle}
        />
        {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9CA3AF' }}>{suffix}</span>}
      </div>
    </label>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium press-effect"
      style={{
        background: active ? '#1B4332' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#374151',
        border: `1px solid ${active ? '#1B4332' : '#E6E9E6'}`,
      }}>
      {children}
    </button>
  );
}

/**
 * value: { taxes: { filingStatus, grossAnnualIncome }, retirement401k: { available, matchPercent, matchLimitPercent, contributionPercent } }
 */
export function TaxDetailsForm({ value, onChange }) {
  const taxes = value.taxes || { filingStatus: 'single', grossAnnualIncome: 0 };
  const k = value.retirement401k || {};
  const setTaxes = patch => onChange({ ...value, taxes: { ...taxes, ...patch } });
  const setK = patch => onChange({ ...value, retirement401k: { ...k, ...patch } });

  return (
    <div className="space-y-5">
      <div>
        <span className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Filing status</span>
        <div className="flex flex-wrap gap-2">
          {FILING_STATUSES.map(s => (
            <Pill key={s.value} active={(taxes.filingStatus || 'single') === s.value}
              onClick={() => setTaxes({ filingStatus: s.value })}>{s.label}</Pill>
          ))}
        </div>
      </div>

      <NumberField label="Gross annual salary (before tax)" prefix="$" placeholder="e.g. 85000"
        value={taxes.grossAnnualIncome} onChange={v => setTaxes({ grossAnnualIncome: Math.round(v) })} />

      <div>
        <span className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Does your employer offer a 401(k) or similar plan?</span>
        <div className="flex gap-2">
          <Pill active={k.available === true} onClick={() => setK({ available: true, matchPercent: k.matchPercent ?? 50, matchLimitPercent: k.matchLimitPercent ?? 6, contributionPercent: k.contributionPercent ?? 0 })}>Yes</Pill>
          <Pill active={k.available === false} onClick={() => setK({ available: false })}>No</Pill>
        </div>
      </div>

      {k.available === true && (
        <div className="space-y-4 rounded-2xl p-4" style={{ background: '#F7F8F6' }}>
          <div>
            <span className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Employer match</span>
            <div className="flex flex-wrap gap-2">
              {MATCH_PRESETS.map(p => (
                <Pill key={p.label}
                  active={k.matchPercent === p.matchPercent && k.matchLimitPercent === p.matchLimitPercent}
                  onClick={() => setK({ matchPercent: p.matchPercent, matchLimitPercent: p.matchLimitPercent })}>
                  {p.label}
                </Pill>
              ))}
              <Pill active={k.matchPercent === 0} onClick={() => setK({ matchPercent: 0, matchLimitPercent: 0 })}>No match</Pill>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Matches" suffix="%" value={k.matchPercent} onChange={v => setK({ matchPercent: Math.min(200, v) })} />
            <NumberField label="Up to (of salary)" suffix="%" value={k.matchLimitPercent} onChange={v => setK({ matchLimitPercent: Math.min(100, v) })} />
          </div>
          <NumberField label="You currently contribute" suffix="% of salary" value={k.contributionPercent}
            onChange={v => setK({ contributionPercent: Math.min(100, v) })} placeholder="0" />
        </div>
      )}

      <p className="text-[11px] leading-relaxed" style={{ color: '#9CA3AF' }}>
        Used for federal tax brackets, your 401(k) match, and Roth vs traditional. State taxes aren't included.
      </p>
    </div>
  );
}
