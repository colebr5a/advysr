export function CurrencyInput({ value, onChange, placeholder = '0', label }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>{label}</label>
      )}
      <div className="relative">
        <span
          className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-base"
          style={{ color: '#9CA3AF' }}
        >
          $
        </span>
        <input
          type="number"
          min="0"
          value={value === 0 ? '' : value}
          onChange={e => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder}
          className="w-full pl-8 pr-4 py-3 rounded-xl text-lg"
          style={{
            background: '#F9F8F6',
            border: '1.5px solid #E6E9E6',
            color: '#111827',
            outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = '#1B4332'; }}
          onBlur={e => { e.target.style.borderColor = '#E6E9E6'; }}
        />
      </div>
    </div>
  );
}
