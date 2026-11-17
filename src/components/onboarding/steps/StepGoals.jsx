import { StepWrapper } from '../shared/StepWrapper.jsx';

const GOAL_TYPES = [
  { type: 'emergency_fund', label: 'Emergency Fund', defaultAmount: 15000 },
  { type: 'home_purchase',  label: 'Home Purchase',  defaultAmount: 50000 },
  { type: 'retirement',     label: 'Retirement',     defaultAmount: 500000 },
  { type: 'vacation',       label: 'Vacation',       defaultAmount: 5000 },
  { type: 'vehicle',        label: 'New Vehicle',    defaultAmount: 30000 },
  { type: 'education',      label: 'Education',      defaultAmount: 20000 },
  { type: 'other',          label: 'Other',          defaultAmount: 10000 },
];

let idCounter = 0;
function newGoal(type) {
  const t = GOAL_TYPES.find(g => g.type === type) || GOAL_TYPES[0];
  return { id: `g${++idCounter}`, type: t.type, label: t.label, targetAmount: t.defaultAmount, targetMonths: 24, currentSaved: 0 };
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

export function StepGoals({ value = [], onChange, onNext, onBack }) {
  return (
    <StepWrapper title="Financial goals?" subtitle="What are you saving toward? Add as many as you like." onNext={onNext} onBack={onBack} canNext={true} step={10} total={11}>
      <div className="space-y-3 max-h-72 overflow-y-auto pr-0.5 no-scrollbar">
        {value.map((goal, i) => (
          <div key={goal.id} className="rounded-2xl p-4 space-y-3" style={{ background: '#F9F8F6', border: '1px solid #E6E9E6' }}>
            <div className="flex justify-between items-center">
              <select
                value={goal.type}
                onChange={e => {
                  const d = [...value];
                  const t = GOAL_TYPES.find(g => g.type === e.target.value);
                  d[i] = { ...d[i], type: e.target.value, label: t?.label || e.target.value };
                  onChange(d);
                }}
                className="text-sm font-semibold rounded-lg px-2 py-1"
                style={{ background: '#FFFFFF', border: '1px solid #E6E9E6', color: '#111827', outline: 'none' }}
              >
                {GOAL_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
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
                <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Target ($)</p>
                <input
                  type="number" min="0"
                  value={goal.targetAmount || ''}
                  onChange={e => { const d = [...value]; d[i] = { ...d[i], targetAmount: Number(e.target.value) || 0 }; onChange(d); }}
                  style={inputStyle}
                />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Months</p>
                <input
                  type="number" min="1"
                  value={goal.targetMonths || ''}
                  onChange={e => { const d = [...value]; d[i] = { ...d[i], targetMonths: Number(e.target.value) || 1 }; onChange(d); }}
                  style={inputStyle}
                />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Saved ($)</p>
                <input
                  type="number" min="0"
                  value={goal.currentSaved || ''}
                  onChange={e => { const d = [...value]; d[i] = { ...d[i], currentSaved: Number(e.target.value) || 0 }; onChange(d); }}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={() => {
            const t = GOAL_TYPES.find(g => !value.find(v => v.type === g.type)) || GOAL_TYPES[6];
            onChange([...value, newGoal(t.type)]);
          }}
          className="w-full py-2.5 rounded-xl text-sm font-medium press-effect"
          style={{ border: '1.5px dashed #C4CDC7', background: 'transparent', color: '#9CA3AF' }}
        >
          + Add Goal
        </button>
        {value.length === 0 && (
          <p className="text-center text-xs" style={{ color: '#9CA3AF' }}>No goals yet? That's okay — click Finish!</p>
        )}
      </div>
    </StepWrapper>
  );
}
