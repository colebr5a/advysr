import { StepWrapper } from '../shared/StepWrapper.jsx';
import { CurrencyInput } from '../shared/CurrencyInput.jsx';

export function StepFixedExpenses({ value, onChange, onNext, onBack }) {
  const total = value?.total || 0;
  return (
    <StepWrapper title="Monthly fixed expenses?" subtitle="Rent/mortgage, car payment, insurance, subscriptions — costs that don't change month to month." onNext={onNext} onBack={onBack} canNext={total >= 0} step={3} total={9}>
      <CurrencyInput value={total} onChange={v => onChange({ ...value, total: v })} placeholder="e.g. 2200" />
      <p className="text-sm text-gray-400">Include: rent, utilities, car, insurance, streaming, loan minimums</p>
    </StepWrapper>
  );
}
