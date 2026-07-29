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
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#f8fafc' }}>
      <div className="w-full max-w-xs">
        <div className="text-center mb-14 -mt-16">
          <h1 className="text-6xl text-gray-900 tracking-tight mb-2">advysr</h1>
          <p className="text-gray-500 text-sm">Enter your PIN to continue</p>
        </div>

        {/* PIN dots */}
        <div className={`flex gap-4 justify-center mb-8 ${shake ? 'animate-bounce' : ''}`}>
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className="w-4 h-4 rounded-full border-2 transition-all"
              style={{
                borderColor: error ? '#ef4444' : '#2D6A4F',
                background: entry.length > i ? (error ? '#ef4444' : '#2D6A4F') : 'transparent',
              }}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">Incorrect PIN. Try again.</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
            <button
              key={i}
              onClick={() => k !== '' && press(String(k))}
              className={`h-16 rounded-2xl text-xl font-semibold transition-all active:scale-95 ${
                k === '' ? 'invisible' : 'text-gray-900 hover:bg-gray-100'
              }`}
              style={{ background: k === '' ? 'transparent' : '#ffffff', border: k === '' ? 'none' : '1px solid #e2e8f0' }}
            >
              {k}
            </button>
          ))}
        </div>

        <button
          onClick={onSignOut}
          className="w-full mt-8 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
