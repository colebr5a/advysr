import { StepWrapper } from '../shared/StepWrapper.jsx';

const DEBT_TYPES = ['credit_card','student_loan','auto_loan','personal_loan','medical','other'];
const DEBT_LABELS = { credit_card:'Credit Card', student_loan:'Student Loan', auto_loan:'Auto Loan', personal_loan:'Personal Loan', medical:'Medical', other:'Other' };

let idCounter = 0;
function newDebt() { return { id: `d${++idCounter}`, type:'credit_card', label:'Credit Card', balance:0, interestRate:0.19, minimumPayment:0 }; }

export function StepDebts({ value = [], onChange, onNext, onBack }) {
  return (
    <StepWrapper title="Any debts?" subtitle="Enter each debt. Leave blank if you have none." onNext={onNext} onBack={onBack} canNext={true} step={6} total={9}>
      <div className="space-y-4">
        {value.map((debt, i) => (
          <div key={debt.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <select
                value={debt.type}
                onChange={e => { const d=[...value]; d[i]={...d[i], type:e.target.value, label:DEBT_LABELS[e.target.value]}; onChange(d); }}
                className="text-sm font-medium border-0 bg-transparent focus:outline-none text-gray-300"
              >
                {DEBT_TYPES.map(t => <option key={t} value={t}>{DEBT_LABELS[t]}</option>)}
              </select>
              <button onClick={() => onChange(value.filter((_,j)=>j!==i))} className="text-xs text-danger-500 hover:underline">Remove</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500">Balance ($)</label>
                <input type="number" min="0" value={debt.balance||''} onChange={e=>{const d=[...value];d[i]={...d[i],balance:Number(e.target.value)||0};onChange(d);}} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="5000"/>
              </div>
              <div>
                <label className="text-xs text-gray-500">Rate (%)</label>
                <input type="number" min="0" max="100" step="0.1" value={debt.interestRate?Math.round(debt.interestRate*1000)/10:''} onChange={e=>{const d=[...value];d[i]={...d[i],interestRate:(Number(e.target.value)||0)/100};onChange(d);}} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="19"/>
              </div>
              <div>
                <label className="text-xs text-gray-500">Min Pmt ($)</label>
                <input type="number" min="0" value={debt.minimumPayment||''} onChange={e=>{const d=[...value];d[i]={...d[i],minimumPayment:Number(e.target.value)||0};onChange(d);}} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="150"/>
              </div>
            </div>
          </div>
        ))}
        <button onClick={() => onChange([...value, newDebt()])} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-primary-300 hover:text-primary-500 text-sm font-medium transition-colors">
          + Add Debt
        </button>
        {value.length === 0 && <p className="text-center text-sm text-gray-400">No debts? Click Continue!</p>}
      </div>
    </StepWrapper>
  );
}
