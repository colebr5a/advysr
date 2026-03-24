import { StepWrapper } from '../shared/StepWrapper.jsx';
import { CurrencyInput } from '../shared/CurrencyInput.jsx';
import { fmt } from '../../../utils/formatters.js';

export function StepEmergencyFund({ value, onChange, onNext, onBack, profile }) {
  const expenses = (profile?.fixedExpenses?.total || 0) + (profile?.variableExpenses?.total || 0);
  return (
    <StepWrapper title="Emergency fund balance?" subtitle="Money set aside specifically for emergencies (separate from regular savings)." onNext={onNext} onBack={onBack} canNext={value >= 0} step={7} total={9}>
      <CurrencyInput value={value} onChange={onChange} placeholder="e.g. 3000" />
      {expenses > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="bg-primary-50 rounded-xl p-3 text-center">
            <div className="text-xs text-primary-600 font-medium">3-month target</div>
            <div className="text-lg font-bold text-primary-700">{fmt(expenses * 3)}</div>
          </div>
          <div className="bg-primary-50 rounded-xl p-3 text-center">
            <div className="text-xs text-primary-600 font-medium">6-month target</div>
            <div className="text-lg font-bold text-primary-700">{fmt(expenses * 6)}</div>
          </div>
        </div>
      )}
    </StepWrapper>
  );
}
