import { useState } from 'react';
import { StepWrapper } from '../shared/StepWrapper.jsx';

function PinDots({ pin, error }) {
  return (
    <div className="flex gap-4 justify-center">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className="w-11 h-14 rounded-xl flex items-center justify-center text-2xl transition-all"
          style={{
            background: '#FFFFFF',
            border: `1.5px solid ${error ? '#EF4444' : pin.length > i ? '#1B4332' : '#E6E9E6'}`,
          }}
        >
          {pin.length > i && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: error ? '#EF4444' : '#1B4332' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Keypad({ onKey }) {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'];
  return (
    <div className="grid grid-cols-3 gap-2 max-w-[210px] mx-auto">
      {keys.map((k, i) => {
        if (k === '') return <div key={i} />;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onKey(k)}
            className="h-14 rounded-2xl flex items-center justify-center press-effect"
            style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}
          >
            {k === 'del' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#374151" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.374-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
              </svg>
            ) : (
              <span className="text-xl font-semibold" style={{ color: '#111827' }}>{k}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function StepPin({ value, onChange, onNext, onBack }) {
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [active, setActive] = useState('pin'); // 'pin' | 'confirm'

  function handleKey(k) {
    setError('');
    if (active === 'pin') {
      if (k === 'del') { onChange(value.slice(0, -1)); return; }
      if (value.length < 4) {
        const next = value + k;
        onChange(next);
        if (next.length === 4) setActive('confirm');
      }
    } else {
      if (k === 'del') { setConfirm(c => c.slice(0, -1)); return; }
      if (confirm.length < 4) setConfirm(c => c + k);
    }
  }

  function handleNext() {
    if (value.length !== 4) { setError('PIN must be exactly 4 digits.'); return; }
    if (value !== confirm) { setError('PINs do not match. Try again.'); setConfirm(''); setActive('pin'); onChange(''); return; }
    setError('');
    onNext();
  }

  return (
    <StepWrapper
      title="Set a PIN"
      subtitle="You'll enter this every time you open advysr."
      onNext={handleNext}
      onBack={onBack}
      canNext={value.length === 4 && confirm.length === 4}
      step={9}
      total={10}
    >
      <div className="space-y-5">
        {/* PIN entry */}
        <div>
          <p className="text-xs font-medium text-center mb-3" style={{ color: active === 'pin' ? '#1B4332' : '#9CA3AF' }}>
            {active === 'pin' ? 'Choose a 4-digit PIN' : 'PIN set ✓'}
          </p>
          <PinDots pin={value} error={!!error} />
        </div>

        {/* Confirm entry */}
        <div>
          <p className="text-xs font-medium text-center mb-3" style={{ color: active === 'confirm' ? '#1B4332' : '#9CA3AF' }}>
            Confirm PIN
          </p>
          <PinDots pin={confirm} error={!!error} />
        </div>

        {error && (
          <p className="text-xs text-center font-medium" style={{ color: '#EF4444' }}>{error}</p>
        )}

        <Keypad onKey={handleKey} />
      </div>
    </StepWrapper>
  );
}
