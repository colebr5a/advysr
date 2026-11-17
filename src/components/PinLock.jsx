import { useState } from 'react';

export function PinLock({ onUnlock, onSignOut }) {
  const [entry, setEntry] = useState('');
  const [error, setError] = useState(null); // message string or null
  const [shake, setShake] = useState(false);
  const [busy, setBusy]   = useState(false);

  // onUnlock(pin) resolves to null on success, or an error message to show.
  async function submit(pin) {
    setBusy(true);
    const message = await onUnlock(pin);
    setBusy(false);
    if (message) {
      setError(message);
      setShake(true);
      setEntry('');
      setTimeout(() => setShake(false), 500);
    }
  }

  function press(k) {
    if (busy) return;
    if (k === '⌫') {
      setEntry(e => e.slice(0, -1));
      setError(null);
      return;
    }
    if (entry.length >= 4) return;
    const next = entry + k;
    setEntry(next);
    if (next.length === 4) submit(next);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#F5F3EE' }}
    >
      <div className="w-full max-w-xs flex flex-col items-center">

        {/* Brand */}
        <div className="mb-16 text-center">
          <p
            className="text-5xl tracking-tight mb-3"
            style={{ color: '#1B4332', letterSpacing: '-0.03em' }}
          >
            advysr
          </p>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            Enter your PIN to continue
          </p>
        </div>

        {/* PIN dots */}
        <div
          className={`flex gap-5 mb-10 ${shake ? 'animate-bounce' : ''}`}
          style={{ transition: 'all 0.1s' }}
        >
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-3.5 h-3.5 rounded-full transition-all duration-150"
              style={{
                background: entry.length > i
                  ? (error ? '#DC2626' : '#1B4332')
                  : 'transparent',
                border: `2px solid ${error ? '#DC2626' : entry.length > i ? '#1B4332' : '#C4CDC7'}`,
                transform: entry.length > i ? 'scale(1.1)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm mb-8" style={{ color: '#DC2626' }}>
            {error}
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[256px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k, i) => {
            const isEmpty = k === '';
            const isDelete = k === '⌫';
            return (
              <button
                key={i}
                onClick={() => !isEmpty && press(String(k))}
                disabled={isEmpty}
                className="h-[64px] rounded-2xl flex items-center justify-center transition-all press-effect select-none"
                style={{
                  background: isEmpty ? 'transparent' : '#FFFFFF',
                  border: isEmpty ? 'none' : '1px solid #E6E9E6',
                  color: isDelete ? '#9CA3AF' : '#111827',
                  fontSize: isDelete ? '18px' : '22px',
                  fontWeight: '500',
                  cursor: isEmpty ? 'default' : 'pointer',
                }}
              >
                {isDelete ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
                  </svg>
                ) : k}
              </button>
            );
          })}
        </div>

        {/* Sign out */}
        <button
          onClick={onSignOut}
          className="mt-10 text-sm press-effect"
          style={{ color: '#9CA3AF' }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
