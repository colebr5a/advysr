import { StepWrapper } from '../shared/StepWrapper.jsx';
import { CurrencyInput } from '../shared/CurrencyInput.jsx';
import { fmt } from '../../../utils/formatters.js';

export function StepEmergencyFund({ value, onChange, onNext, onBack, profile }) {
  const expenses = (profile?.fixedExpenses?.total || 0) + (profile?.variableExpenses?.total || 0);
  return (
    <StepWrapper title="Emergency fund balance?" subtitle="Money set aside specifically for emergencies, separate from regular savings." onNext={onNext} onBack={onBack} canNext={value >= 0} step={8} total={11}>
      <CurrencyInput value={value} onChange={onChange} placeholder="e.g. 3000" />
      {expenses > 0 && (
        <div className="grid grid-cols-2 gap-2.5 mt-1">
          <div className="rounded-xl p-3 text-center" style={{ background: '#F0FAF4', border: '1px solid #B7E4C7' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#2D6A4F' }}>3-month target</p>
            <p className="text-lg font-bold" style={{ color: '#1B4332' }}>{fmt(expenses * 3)}</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: '#F0FAF4', border: '1px solid #B7E4C7' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#2D6A4F' }}>6-month target</p>
            <p className="text-lg font-bold" style={{ color: '#1B4332' }}>{fmt(expenses * 6)}</p>
          </div>
        </div>
      )}
    </StepWrapper>
  );
}
