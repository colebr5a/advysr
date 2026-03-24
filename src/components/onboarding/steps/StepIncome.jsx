import { StepWrapper } from '../shared/StepWrapper.jsx';
import { CurrencyInput } from '../shared/CurrencyInput.jsx';

export function StepIncome({ value, onChange, onNext, onBack }) {
  return (
    <StepWrapper title="Monthly take-home income?" subtitle="After taxes and deductions — what hits your bank account each month." onNext={onNext} onBack={onBack} canNext={value >= 0} step={2} total={9}>
      <CurrencyInput value={value} onChange={onChange} placeholder="e.g. 5000" />
    </StepWrapper>
  );
}
