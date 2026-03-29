import { useState } from 'react';
import { StepWrapper } from '../shared/StepWrapper.jsx';

export function StepPin({ value, onChange, onNext, onBack }) {
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  function handleNext() {
    if (value.length !== 4) { setError('PIN must be exactly 4 digits.'); return; }
    if (value !== confirm) { setError('PINs do not match. Try again.'); setConfirm(''); return; }
    setError('');
    onNext();
  }

  return (
    <StepWrapper
      title="Set a PIN"
      subtitle="You'll enter this every time you open Advysr to protect your financial data."
      onNext={handleNext}
      onBack={onBack}
      canNext={value.length === 4 && confirm.length === 4}
      step={9}
      total={10}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-400 block mb-2">Choose a 4-digit PIN</label>
          <div className="flex gap-3 justify-center">
            {[0,1,2,3].map(i => (
              <div
                key={i}
                className="w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-bold border-2 transition-colors"
                style={{ background: '#2c2c2c', borderColor: value.length > i ? '#16a34a' : '#3a3a3a', color: 'white' }}
              >
                {value.length > i ? '●' : ''}
              </div>
            ))}
          </div>
          <input
            type="number"
            maxLength={4}
            value={value}
            onChange={e => { const v = e.target.value.slice(0,4).replace(/\D/g,''); onChange(v); setError(''); }}
            className="sr-only"
            autoFocus
            id="pin-input"
          />
          <label htmlFor="pin-input" className="block text-center mt-3">
            <span className="text-xs text-gray-500 cursor-pointer underline">Tap to type PIN</span>
          </label>
          {/* Visual keypad */}
          <div className="grid grid-cols-3 gap-2 mt-4 max-w-[220px] mx-auto">
            {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (k === '⌫') { onChange(value.slice(0,-1)); }
                  else if (k !== '' && value.length < 4) { onChange(value + k); }
                  setError('');
                }}
                className={`h-12 rounded-xl text-lg font-semibold transition-colors ${k === '' ? 'invisible' : 'text-white hover:bg-primary-700'}`}
                style={{ background: k === '' ? 'transparent' : '#383838' }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-400 block mb-2">Confirm PIN</label>
          <div className="flex gap-3 justify-center">
            {[0,1,2,3].map(i => (
              <div
                key={i}
                className="w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-bold border-2 transition-colors"
                style={{ background: '#2c2c2c', borderColor: confirm.length > i ? '#16a34a' : '#3a3a3a', color: 'white' }}
              >
                {confirm.length > i ? '●' : ''}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 max-w-[220px] mx-auto">
            {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (k === '⌫') { setConfirm(c => c.slice(0,-1)); }
                  else if (k !== '' && confirm.length < 4) { setConfirm(c => c + k); }
                  setError('');
                }}
                className={`h-12 rounded-xl text-lg font-semibold transition-colors ${k === '' ? 'invisible' : 'text-white hover:bg-primary-700'}`}
                style={{ background: k === '' ? 'transparent' : '#383838' }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
    </StepWrapper>
  );
}
