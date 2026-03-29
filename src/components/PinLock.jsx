import { useState } from 'react';

export function PinLock({ onUnlock, onSignOut }) {
  const [entry, setEntry] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function press(k) {
    if (k === '⌫') { setEntry(e => e.slice(0,-1)); setError(false); return; }
    if (entry.length >= 4) return;
    const next = entry + k;
    setEntry(next);
    if (next.length === 4) {
      setTimeout(() => onUnlock(next, () => {
        setError(true);
        setShake(true);
        setEntry('');
        setTimeout(() => setShake(false), 500);
      }), 100);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#1a1a1a' }}>
      <div className="w-full max-w-xs">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">advysr</h1>
          <p className="text-gray-500 text-sm">Enter your PIN to continue</p>
        </div>

        {/* PIN dots */}
        <div className={`flex gap-4 justify-center mb-8 ${shake ? 'animate-bounce' : ''}`}>
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className="w-4 h-4 rounded-full border-2 transition-all"
              style={{
                borderColor: error ? '#ef4444' : '#16a34a',
                background: entry.length > i ? (error ? '#ef4444' : '#16a34a') : 'transparent',
              }}
            />
          ))}
        </div>

        {error && <p className="text-red-400 text-sm text-center mb-4">Incorrect PIN. Try again.</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
            <button
              key={i}
              onClick={() => k !== '' && press(String(k))}
              className={`h-16 rounded-2xl text-xl font-semibold transition-all active:scale-95 ${
                k === '' ? 'invisible' : 'text-white'
              }`}
              style={{ background: k === '' ? 'transparent' : '#2c2c2c', border: k === '' ? 'none' : '1px solid #3a3a3a' }}
            >
              {k}
            </button>
          ))}
        </div>

        <button
          onClick={onSignOut}
          className="w-full mt-8 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
