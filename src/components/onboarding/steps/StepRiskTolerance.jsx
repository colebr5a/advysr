import { StepWrapper } from '../shared/StepWrapper.jsx';

const OPTIONS = [
  { value:'conservative', label:'Conservative', emoji:'🛡️', desc:'Prioritize safety. Smaller gains, smaller losses. Good for shorter horizons or low risk appetite.', range:'~4–6% historical annual return' },
  { value:'moderate', label:'Moderate', emoji:'⚖️', desc:'Balance growth and stability. The classic mix for most investors.', range:'~7–9% historical annual return' },
  { value:'aggressive', label:'Aggressive', emoji:'🚀', desc:'Maximize long-term growth. Higher volatility — comfortable with short-term swings.', range:'~9–12% historical annual return' },
];

export function StepRiskTolerance({ value, onChange, onNext, onBack }) {
  return (
    <StepWrapper title="Risk tolerance?" subtitle="How would you feel if your investments dropped 30% in a year?" onNext={onNext} onBack={onBack} canNext={!!value} step={8} total={9}>
      <div className="space-y-3">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${value===opt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'}`}
          >
            <div className="flex items-center gap-2 font-semibold text-gray-100 mb-1">
              <span>{opt.emoji}</span> {opt.label}
            </div>
            <p className="text-sm text-gray-500">{opt.desc}</p>
            <p className="text-xs text-gray-400 mt-1">{opt.range}</p>
          </button>
        ))}
      </div>
    </StepWrapper>
  );
}
