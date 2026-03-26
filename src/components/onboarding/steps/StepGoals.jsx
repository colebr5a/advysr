import { StepWrapper } from '../shared/StepWrapper.jsx';

const GOAL_TYPES = [
  { type:'emergency_fund', label:'Emergency Fund', defaultAmount:15000 },
  { type:'home_purchase', label:'Home Purchase', defaultAmount:50000 },
  { type:'retirement', label:'Retirement', defaultAmount:500000 },
  { type:'vacation', label:'Vacation', defaultAmount:5000 },
  { type:'vehicle', label:'New Vehicle', defaultAmount:30000 },
  { type:'education', label:'Education', defaultAmount:20000 },
  { type:'other', label:'Other', defaultAmount:10000 },
];

let idCounter = 0;
function newGoal(type) {
  const t = GOAL_TYPES.find(g=>g.type===type) || GOAL_TYPES[0];
  return { id:`g${++idCounter}`, type:t.type, label:t.label, targetAmount:t.defaultAmount, targetMonths:24, currentSaved:0 };
}

export function StepGoals({ value = [], onChange, onNext, onBack }) {
  return (
    <StepWrapper title="Financial goals?" subtitle="What are you saving toward? Add as many as you like." onNext={onNext} onBack={onBack} canNext={true} nextLabel="Finish" step={9} total={9}>
      <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
        {value.map((goal, i) => (
          <div key={goal.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <select
                value={goal.type}
                onChange={e => { const d=[...value]; const t=GOAL_TYPES.find(g=>g.type===e.target.value); d[i]={...d[i],type:e.target.value,label:t?.label||e.target.value}; onChange(d); }}
                className="text-sm font-medium border-0 bg-transparent focus:outline-none text-gray-300"
              >
                {GOAL_TYPES.map(t=><option key={t.type} value={t.type}>{t.label}</option>)}
              </select>
              <button onClick={()=>onChange(value.filter((_,j)=>j!==i))} className="text-xs text-danger-500 hover:underline">Remove</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500">Target ($)</label>
                <input type="number" min="0" value={goal.targetAmount||''} onChange={e=>{const d=[...value];d[i]={...d[i],targetAmount:Number(e.target.value)||0};onChange(d);}} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white text-gray-900"/>
              </div>
              <div>
                <label className="text-xs text-gray-500">Months</label>
                <input type="number" min="1" value={goal.targetMonths||''} onChange={e=>{const d=[...value];d[i]={...d[i],targetMonths:Number(e.target.value)||1};onChange(d);}} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white text-gray-900"/>
              </div>
              <div>
                <label className="text-xs text-gray-500">Saved ($)</label>
                <input type="number" min="0" value={goal.currentSaved||''} onChange={e=>{const d=[...value];d[i]={...d[i],currentSaved:Number(e.target.value)||0};onChange(d);}} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white text-gray-900"/>
              </div>
            </div>
          </div>
        ))}
        <button onClick={()=>{ const t=GOAL_TYPES.find(g=>!value.find(v=>v.type===g.type))||GOAL_TYPES[6]; onChange([...value, newGoal(t.type)]); }} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-primary-300 hover:text-primary-500 text-sm font-medium transition-colors">
          + Add Goal
        </button>
        {value.length===0 && <p className="text-center text-sm text-gray-400">No goals yet? That's okay — click Finish!</p>}
      </div>
    </StepWrapper>
  );
}
