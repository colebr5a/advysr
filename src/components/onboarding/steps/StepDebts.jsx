import { StepWrapper } from '../shared/StepWrapper.jsx';

const DEBT_TYPES = ['credit_card', 'student_loan', 'auto_loan', 'personal_loan', 'medical', 'other'];
const DEBT_LABELS = {
  credit_card: 'Credit Card', student_loan: 'Student Loan', auto_loan: 'Auto Loan',
  personal_loan: 'Personal Loan', medical: 'Medical', other: 'Other',
};

let idCounter = 0;
function newDebt() {
  return { id: `d${++idCounter}`, type: 'credit_card', label: 'Credit Card', balance: 0, interestRate: 0.19, minimumPayment: 0 };
}

const inputStyle = {
  width: '100%',
  background: '#F9F8F6',
  border: '1.5px solid #E6E9E6',
  borderRadius: '10px',
  padding: '6px 10px',
  fontSize: '13px',
  color: '#111827',
  outline: 'none',
};

export function StepDebts({ value = [], onChange, onNext, onBack }) {
  return (
    <StepWrapper title="Any debts?" subtitle="Enter each debt. Leave blank if you have none." onNext={onNext} onBack={onBack} canNext={true} step={6} total={9}>
      <div className="space-y-3">
        {value.map((debt, i) => (
          <div key={debt.id} className="rounded-2xl p-4 space-y-3" style={{ background: '#F9F8F6', border: '1px solid #E6E9E6' }}>
            <div className="flex justify-between items-center">
              <select
                value={debt.type}
                onChange={e => { const d = [...value]; d[i] = { ...d[i], type: e.target.value, label: DEBT_LABELS[e.target.value] }; onChange(d); }}
                className="text-sm font-semibold rounded-lg px-2 py-1"
                style={{ background: '#FFFFFF', border: '1px solid #E6E9E6', color: '#111827', outline: 'none' }}
              >
                {DEBT_TYPES.map(t => <option key={t} value={t}>{DEBT_LABELS[t]}</option>)}
              </select>
              <button
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="text-xs font-medium press-effect"
                style={{ color: '#DC2626' }}
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Balance ($)</p>
                <input
                  type="number" min="0"
                  value={debt.balance || ''}
                  onChange={e => { const d = [...value]; d[i] = { ...d[i], balance: Number(e.target.value) || 0 }; onChange(d); }}
                  style={inputStyle}
                  placeholder="5000"
                />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Rate (%)</p>
                <input
                  type="number" min="0" max="100" step="0.1"
                  value={debt.interestRate ? Math.round(debt.interestRate * 1000) / 10 : ''}
                  onChange={e => { const d = [...value]; d[i] = { ...d[i], interestRate: (Number(e.target.value) || 0) / 100 }; onChange(d); }}
                  style={inputStyle}
                  placeholder="19"
                />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Min Pmt ($)</p>
                <input
                  type="number" min="0"
                  value={debt.minimumPayment || ''}
                  onChange={e => { const d = [...value]; d[i] = { ...d[i], minimumPayment: Number(e.target.value) || 0 }; onChange(d); }}
                  style={inputStyle}
                  placeholder="150"
                />
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={() => onChange([...value, newDebt()])}
          className="w-full py-2.5 rounded-xl text-sm font-medium press-effect"
          style={{ border: '1.5px dashed #C4CDC7', background: 'transparent', color: '#9CA3AF' }}
        >
          + Add Debt
        </button>
        {value.length === 0 && (
          <p className="text-center text-xs" style={{ color: '#9CA3AF' }}>No debts? Just tap Continue!</p>
        )}
      </div>
    </StepWrapper>
  );
}
