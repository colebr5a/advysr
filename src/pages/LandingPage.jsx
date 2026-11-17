export function LandingPage({ onGetStarted, onSignIn }) {
  const features = [
    { icon: '📊', title: 'Net Worth Dashboard', desc: 'See all your accounts, assets, and debts in one clean view.' },
    { icon: '🎯', title: 'Goal Tracking', desc: 'Set milestones, log contributions, and watch your progress.' },
    { icon: '💰', title: 'Monthly Allocation', desc: 'Turn your surplus into a structured monthly investing plan.' },
    { icon: '🤖', title: 'AI Research', desc: 'Ask Claude anything about investing — personalized to your profile.' },
    { icon: '📈', title: 'Portfolio Analysis', desc: 'Import holdings, track gains, and compare to benchmarks.' },
    { icon: '🔒', title: 'PIN Lock', desc: 'Keep your financial data private with a secure PIN lock.' },
  ];

  return (
    <div style={{ background: '#F5F3EE', color: '#111827', minHeight: '100vh' }}>

      {/* Nav */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-5 py-4"
        style={{ background: 'rgba(245,243,238,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #E6E9E6' }}
      >
        <span className="text-xl tracking-tight" style={{ color: '#1B4332', letterSpacing: '-0.02em' }}>advysr</span>
        <div className="flex items-center gap-3">
          <button
            onClick={onSignIn}
            className="text-sm font-medium press-effect"
            style={{ color: '#6B7280' }}
          >
            Sign in
          </button>
          <button
            onClick={onGetStarted}
            className="text-sm font-semibold px-4 py-2 rounded-xl press-effect"
            style={{ background: '#1B4332', color: '#FFFFFF' }}
          >
            Get started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-5 pt-16 pb-14 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-7"
          style={{ background: '#F0FAF4', border: '1px solid #B7E4C7', color: '#1B4332' }}
        >
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#40916C' }} />
          Always free · No credit card required
        </div>
        <h1
          className="text-5xl mb-5 leading-tight"
          style={{ color: '#111827', letterSpacing: '-0.03em' }}
        >
          Your wealth,<br />
          <em style={{ color: '#1B4332', fontStyle: 'italic' }}>made clear.</em>
        </h1>
        <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: '#6B7280', lineHeight: '1.6' }}>
          A personal wealth manager for real people — not Wall Street. Set goals, allocate your surplus, and get AI-powered guidance tailored to you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onGetStarted}
            className="px-6 py-3.5 rounded-2xl text-base font-bold press-effect"
            style={{ background: '#1B4332', color: '#FFFFFF' }}
          >
            Start for free →
          </button>
          <button
            onClick={onSignIn}
            className="px-6 py-3.5 rounded-2xl text-base font-medium press-effect"
            style={{ background: '#FFFFFF', border: '1px solid #E6E9E6', color: '#374151' }}
          >
            Sign in
          </button>
        </div>
        <p className="text-xs mt-4" style={{ color: '#C4CDC7' }}>No ads. No data selling. Ever.</p>
      </section>

      {/* Mock app card */}
      <section className="max-w-sm mx-auto px-5 mb-16">
        <div className="rounded-3xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E6E9E6', boxShadow: '0 20px 60px rgba(27,67,50,0.12)' }}>
          {/* Mock header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: '#F5F3EE', borderBottom: '1px solid #E6E9E6' }}>
            <span className="text-sm" style={{ color: '#1B4332', letterSpacing: '-0.02em' }}>advysr</span>
            <div className="w-7 h-7 rounded-full" style={{ background: '#E6F4EC' }} />
          </div>
          {/* Mock net worth */}
          <div className="p-5" style={{ background: '#1B4332' }}>
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Net Worth</p>
            <p className="text-3xl font-bold mb-3" style={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}>$47,832</p>
            <div className="flex gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '10px' }}>
              <div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Assets</p>
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>$52,400</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Debt</p>
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>$4,568</p>
              </div>
            </div>
          </div>
          {/* Mock accounts */}
          <div className="p-4 space-y-2">
            {[
              { label: 'Checking', amount: '$4,200', pct: '8%' },
              { label: 'Roth IRA', amount: '$24,800', pct: '47%' },
              { label: 'Brokerage', amount: '$23,400', pct: '45%' },
            ].map(a => (
              <div key={a.label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#F9F8F6' }}>
                <span className="text-sm font-medium" style={{ color: '#374151' }}>{a.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{a.pct}</span>
                  <span className="text-sm font-bold" style={{ color: '#111827' }}>{a.amount}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Mock bottom nav */}
          <div className="flex items-center justify-around px-4 py-3" style={{ borderTop: '1px solid #E6E9E6' }}>
            {['Home', 'Goals', 'Portfolio', 'Invest', 'AI'].map((t, i) => (
              <div key={t} className="flex flex-col items-center gap-0.5">
                <div className="w-5 h-5 rounded" style={{ background: i === 0 ? '#1B4332' : '#E6E9E6' }} />
                <span className="text-xs" style={{ color: i === 0 ? '#1B4332' : '#9CA3AF', fontSize: '9px' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-2xl mx-auto px-5 pb-16">
        <p
          className="text-2xl text-center mb-8"
          style={{ color: '#111827', letterSpacing: '-0.02em' }}
        >
          Everything you need,<br />
          <em style={{ color: '#1B4332' }}>nothing you don't.</em>
        </p>
        <div className="grid grid-cols-2 gap-3">
          {features.map(f => (
            <div
              key={f.title}
              className="rounded-2xl p-4"
              style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}
            >
              <span className="text-2xl block mb-2">{f.icon}</span>
              <p className="font-semibold text-sm mb-1" style={{ color: '#111827' }}>{f.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="mx-4 mb-8 rounded-3xl p-8 text-center"
        style={{ background: '#1B4332' }}
      >
        <p className="text-2xl mb-2" style={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          Start building wealth today
        </p>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Free forever. No credit card. No ads. No nonsense.
        </p>
        <button
          onClick={onGetStarted}
          className="px-6 py-3.5 rounded-2xl font-bold text-sm press-effect"
          style={{ background: '#FFFFFF', color: '#1B4332' }}
        >
          Get started free →
        </button>
      </section>

      {/* Footer */}
      <footer className="px-5 pb-8 text-center">
        <p className="text-xs" style={{ color: '#C4CDC7' }}>
          advysr · Personal Finance Manager · Free forever
        </p>
      </footer>
    </div>
  );
}
