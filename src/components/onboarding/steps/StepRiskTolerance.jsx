import { StepWrapper } from '../shared/StepWrapper.jsx';
import { RISK_ASSUMPTIONS } from '../../../utils/riskAssumptions.js';

const OPTIONS = [
  {
    value: 'conservative', label: 'Conservative', emoji: '🛡️',
    desc: 'Prioritize safety. Smaller gains, smaller losses. Good for shorter horizons or low risk appetite.',
    range: RISK_ASSUMPTIONS.conservative.label,
  },
  {
    value: 'moderate', label: 'Moderate', emoji: '⚖️',
    desc: 'Balance growth and stability. The classic mix for most investors.',
    range: RISK_ASSUMPTIONS.moderate.label,
  },
  {
    value: 'aggressive', label: 'Aggressive', emoji: '🚀',
    desc: 'Maximize long-term growth. Higher volatility — comfortable with short-term swings.',
    range: RISK_ASSUMPTIONS.aggressive.label,
  },
];

export function StepRiskTolerance({ value, onChange, onNext, onBack }) {
  return (
    <StepWrapper title="Risk tolerance?" subtitle="How would you feel if your investments dropped 30% in a year?" onNext={onNext} onBack={onBack} canNext={!!value} step={8} total={9}>
      <div className="space-y-2.5">
        {OPTIONS.map(opt => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="w-full text-left p-4 rounded-2xl press-effect"
              style={{
                background: active ? '#F0FAF4' : '#F9F8F6',
                border: active ? '1.5px solid #52B788' : '1.5px solid #E6E9E6',
              }}
            >
              <div className="flex items-center gap-2 font-semibold text-sm mb-1" style={{ color: '#111827' }}>
                <span>{opt.emoji}</span>
                {opt.label}
                {active && (
                  <span className="ml-auto">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#1B4332" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{opt.desc}</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{opt.range}</p>
            </button>
          );
        })}
      </div>
    </StepWrapper>
  );
}
