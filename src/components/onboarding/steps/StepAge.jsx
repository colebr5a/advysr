import { StepWrapper } from '../shared/StepWrapper.jsx';

export function StepAge({ value, onChange, onNext, onBack }) {
  return (
    <StepWrapper title="How old are you?" subtitle="This helps tailor your investment horizon." onNext={onNext} onBack={onBack} canNext={value >= 18 && value <= 100} step={1} total={11}>
      <input
        type="number"
        min="18"
        max="100"
        value={value || ''}
        onChange={e => onChange(Number(e.target.value))}
        placeholder="e.g. 32"
        className="w-full px-4 py-3 rounded-xl text-lg"
        style={{
          background: '#F9F8F6',
          border: '1.5px solid #E6E9E6',
          color: '#111827',
          outline: 'none',
        }}
        onFocus={e => { e.target.style.borderColor = '#1B4332'; }}
        onBlur={e => { e.target.style.borderColor = '#E6E9E6'; }}
        autoFocus
      />
    </StepWrapper>
  );
}
