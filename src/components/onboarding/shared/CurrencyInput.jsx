export function CurrencyInput({ value, onChange, placeholder = '0', label }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
        <input
          type="number"
          min="0"
          value={value === 0 ? '' : value}
          onChange={e => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder}
          className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
        />
      </div>
    </div>
  );
}
