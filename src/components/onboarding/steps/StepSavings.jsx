import { StepWrapper } from '../shared/StepWrapper.jsx';
import { CurrencyInput } from '../shared/CurrencyInput.jsx';

export function StepSavings({ value, onChange, onNext, onBack }) {
  return (
    <StepWrapper title="Total liquid savings?" subtitle="Checking + savings accounts (not retirement accounts or emergency fund)." onNext={onNext} onBack={onBack} canNext={value >= 0} step={5} total={9}>
      <CurrencyInput value={value} onChange={onChange} placeholder="e.g. 8000" />
    </StepWrapper>
  );
}
