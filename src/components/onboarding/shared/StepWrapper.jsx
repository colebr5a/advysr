export function StepWrapper({ title, subtitle, children, onNext, onBack, nextLabel = 'Continue', canNext = true, step, total }) {
  function handleKey(e) {
    if (e.key === 'Enter' && canNext) onNext();
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#1a1a1a' }} onKeyDown={handleKey}>
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Step {step} of {total}</span>
            <span>{Math.round((step/total)*100)}%</span>
          </div>
          <div className="w-full rounded-full h-1.5" style={{ background: '#333' }}>
            <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${(step/total)*100}%` }} />
          </div>
        </div>
        <div className="rounded-3xl shadow-lg p-8" style={{ background: '#2c2c2c', border: '1px solid #3a3a3a' }}>
          <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
          {subtitle && <p className="text-gray-400 mb-6">{subtitle}</p>}
          <div className="space-y-4">{children}</div>
          <div className="flex gap-3 mt-8">
            {onBack && (
              <button onClick={onBack} className="flex-1 py-3 rounded-xl font-medium transition-colors text-gray-400 hover:text-white" style={{ border: '1px solid #444', background: 'transparent' }}>
                Back
              </button>
            )}
            <button
              onClick={onNext}
              disabled={!canNext}
              className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {nextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
