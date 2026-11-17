export function StepWrapper({ title, subtitle, children, onNext, onBack, nextLabel = 'Continue', canNext = true, step, total }) {
  function handleKey(e) {
    if (e.key === 'Enter' && canNext) onNext();
  }
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: '#F5F3EE' }}
      onKeyDown={handleKey}
    >
      <div className="w-full max-w-sm">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-2" style={{ color: '#9CA3AF' }}>
            <span>Step {step} of {total}</span>
            <span style={{ color: '#1B4332' }}>{Math.round((step / total) * 100)}%</span>
          </div>
          <div className="w-full rounded-full h-1" style={{ background: '#E6E9E6' }}>
            <div
              className="h-1 rounded-full transition-all duration-500"
              style={{ width: `${(step / total) * 100}%`, background: '#1B4332' }}
            />
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-6"
          style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}
        >
          <p
            className="text-2xl mb-1"
            style={{ color: '#111827', letterSpacing: '-0.01em' }}
          >
            {title}
          </p>
          {subtitle && (
            <p className="text-sm mb-5" style={{ color: '#9CA3AF' }}>{subtitle}</p>
          )}
          <div className="space-y-4">{children}</div>

          <div className="flex gap-3 mt-6">
            {onBack && (
              <button
                onClick={onBack}
                className="flex-1 py-3 rounded-xl font-medium press-effect"
                style={{ border: '1.5px solid #E6E9E6', background: 'transparent', color: '#374151' }}
              >
                Back
              </button>
            )}
            <button
              onClick={onNext}
              disabled={!canNext}
              className="flex-1 py-3 rounded-xl font-semibold press-effect disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#1B4332', color: '#FFFFFF' }}
            >
              {nextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
