import { StepWrapper } from '../shared/StepWrapper.jsx';
import { CurrencyInput } from '../shared/CurrencyInput.jsx';

export function StepVariableExpenses({ value, onChange, onNext, onBack }) {
  const total = value?.total || 0;
  return (
    <StepWrapper title="Monthly variable expenses?" subtitle="Groceries, dining, gas, entertainment, shopping — costs that vary each month." onNext={onNext} onBack={onBack} canNext={total >= 0} step={4} total={9}>
      <CurrencyInput value={total} onChange={v => onChange({ ...value, total: v })} placeholder="e.g. 1200" />
      <p className="text-sm text-gray-400">Include: food, gas, clothing, personal care, fun money</p>
    </StepWrapper>
  );
}
