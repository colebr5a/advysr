import { StepWrapper } from '../shared/StepWrapper.jsx';

export function StepAge({ value, onChange, onNext, onBack }) {
  return (
    <StepWrapper title="How old are you?" subtitle="This helps tailor your investment horizon." onNext={onNext} onBack={onBack} canNext={value >= 18 && value <= 100} step={1} total={9}>
      <input
        type="number" min="18" max="100"
        value={value || ''}
        onChange={e => onChange(Number(e.target.value))}
        placeholder="e.g. 32"
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
        autoFocus
      />
    </StepWrapper>
  );
}
