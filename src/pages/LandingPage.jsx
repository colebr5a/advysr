export function LandingPage({ onGetStarted, onSignIn }) {
  return (
    <div style={{ background: '#1a1a1a', color: 'white', fontFamily: 'Manrope, sans-serif' }}>

      {/* Nav */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4" style={{ background: 'rgba(26,26,26,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2a2a2a' }}>
        <span className="text-xl font-bold tracking-tight" style={{ color: '#16a34a' }}>advysr</span>
        <div className="flex items-center gap-3">
          <button onClick={onSignIn} className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-3 py-1.5">Sign in</button>
          <button onClick={onGetStarted} className="text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90" style={{ background: '#16a34a', color: 'white' }}>Get started free</button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 flex flex-col lg:flex-row items-center gap-12">
        {/* Left */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: '#1a3a26', color: '#4ade80', border: '1px solid #16a34a33' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            Always free · No credit card required
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5" style={{ letterSpacing: '-0.02em' }}>
            Track your net worth,<br />
            <span style={{ color: '#16a34a' }}>plan your future,</span><br />
            and manage your money<br />
            — all in one place.
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto lg:mx-0">
            advysr is a personal wealth manager and financial planning tool built for real people — not Wall Street. Set goals, allocate your surplus, and get AI-powered investing guidance tailored to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <button onClick={onGetStarted} className="px-6 py-3.5 rounded-2xl text-base font-bold transition-all hover:opacity-90 hover:scale-[1.02]" style={{ background: '#16a34a', color: 'white' }}>
              Start for free →
            </button>
            <button onClick={onSignIn} className="px-6 py-3.5 rounded-2xl text-base font-semibold transition-all hover:bg-[#2a2a2a]" style={{ border: '1px solid #333', color: '#ccc' }}>
              Sign in
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-4">No ads. No data selling. Ever.</p>
        </div>

        {/* Dashboard Mockup */}
        <div className="flex-1 w-full max-w-md lg:max-w-none">
          <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ background: '#222', border: '1px solid #2e2e2e' }}>
            {/* Fake nav bar */}
            <div className="flex items-center justify-between px-4 py-3" style={{ background: '#222222', borderBottom: '1px solid #2e2e2e' }}>
              <span className="text-sm font-bold" style={{ color: '#16a34a' }}>advysr</span>
              <div className="flex gap-1">
                {['Home','Goals','Investing','Research'].map(t => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: t === 'Home' ? '#16a34a' : 'transparent', color: t === 'Home' ? 'white' : '#666' }}>{t}</span>
                ))}
              </div>
            </div>
            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Net worth card */}
              <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: '#2c2c2c', border: '1px solid #3a3a3a' }}>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Net Worth</p>
                  <p className="text-2xl font-extrabold" style={{ color: '#4ade80' }}>$47,832</p>
                  <p className="text-xs text-gray-500 mt-1">↑ $1,240 this month</p>
                </div>
                {/* Mini pie chart */}
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#333" strokeWidth="16" />
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#16a34a" strokeWidth="16"
                    strokeDasharray={`${0.43 * 175.9} ${175.9}`} strokeDashoffset="44" strokeLinecap="butt" />
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#22c55e" strokeWidth="16"
                    strokeDasharray={`${0.26 * 175.9} ${175.9}`} strokeDashoffset={`${-(0.43 * 175.9) + 44}`} strokeLinecap="butt" />
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#4ade80" strokeWidth="16"
                    strokeDasharray={`${0.19 * 175.9} ${175.9}`} strokeDashoffset={`${-(0.69 * 175.9) + 44}`} strokeLinecap="butt" />
                  <circle cx="40" cy="40" r="22" fill="#2c2c2c" />
                </svg>
              </div>
              {/* Accounts row */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Checking', val: '$8,200', color: '#16a34a' },
                  { label: 'HYSA', val: '$12,500', color: '#22c55e' },
                  { label: 'Roth IRA', val: '$18,400', color: '#4ade80' },
                  { label: 'Brokerage', val: '$8,732', color: '#a3e635' },
                ].map(a => (
                  <div key={a.label} className="rounded-xl p-3" style={{ background: '#2c2c2c', border: '1px solid #3a3a3a' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color }} />
                      <span className="text-xs text-gray-500">{a.label}</span>
                    </div>
                    <p className="text-sm font-bold text-white">{a.val}</p>
                  </div>
                ))}
              </div>
              {/* Allocation checklist */}
              <div className="rounded-2xl p-4" style={{ background: '#2c2c2c', border: '1px solid #3a3a3a' }}>
                <p className="text-xs font-semibold text-gray-400 mb-3">March Surplus Allocation</p>
                {[
                  { label: 'Emergency Fund', pct: 78, checked: true },
                  { label: 'Roth IRA Contribution', pct: 45, checked: true },
                  { label: 'Brokerage Investment', pct: 20, checked: false },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 mb-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: item.checked ? '#16a34a' : '#333', border: item.checked ? 'none' : '1px solid #555' }}>
                      {item.checked && <svg width="8" height="8" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-300">{item.label}</span>
                        <span style={{ color: '#4ade80' }}>{item.pct}%</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: '#3a3a3a' }}>
                        <div className="h-1 rounded-full" style={{ width: `${item.pct}%`, background: '#16a34a' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y py-8" style={{ borderColor: '#2a2a2a' }}>
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { val: '$0', label: 'Cost, forever' },
            { val: 'AI', label: 'Powered research' },
            { val: '4-digit', label: 'PIN protection' },
            { val: '100%', label: 'Private & encrypted' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold" style={{ color: '#16a34a' }}>{s.val}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold mb-3">Everything you need to build wealth</h2>
          <p className="text-gray-500">A complete picture of your finances, not just a spreadsheet.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: '📊',
              title: 'Net Worth Dashboard',
              desc: 'See all your accounts in one place with a live net worth total and visual pie chart breakdown.',
            },
            {
              icon: '🎯',
              title: 'Goal Tracking',
              desc: 'Set financial goals — emergency fund, car, vacation, home — and log contributions with progress rings.',
            },
            {
              icon: '📅',
              title: 'Monthly Surplus Allocation',
              desc: 'Know exactly where every extra dollar should go each month based on your income, expenses, and priorities.',
            },
            {
              icon: '🤖',
              title: 'AI Investment Research',
              desc: 'Chat with Claude AI to research stocks, ETFs, sectors, and strategies — tailored to your risk profile.',
            },
            {
              icon: '📈',
              title: 'Personalized Investing Plan',
              desc: 'Get sector-based investing recommendations matched to your risk tolerance — conservative, moderate, or aggressive.',
            },
            {
              icon: '🔒',
              title: 'PIN Lock & Privacy',
              desc: 'A 4-digit PIN protects your data every time you open the app. No ads, no data selling, no tracking.',
            },
          ].map(f => (
            <div key={f.title} className="rounded-2xl p-5" style={{ background: '#222', border: '1px solid #2e2e2e' }}>
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Section */}
      <section className="py-16" style={{ background: '#1e2e22', borderTop: '1px solid #1f3d28', borderBottom: '1px solid #1f3d28' }}>
        <div className="max-w-5xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1">
            <div className="text-xs font-semibold mb-3 px-3 py-1 rounded-full inline-block" style={{ background: '#16a34a22', color: '#4ade80', border: '1px solid #16a34a44' }}>Powered by Claude AI</div>
            <h2 className="text-3xl font-extrabold mb-4">Your personal AI financial advisor</h2>
            <p className="text-gray-400 leading-relaxed mb-6">
              Ask anything about investing, markets, or your financial strategy. advysr's AI research tab uses Anthropic's Claude to give you thoughtful, personalized answers — not generic advice.
            </p>
            <ul className="space-y-3">
              {[
                '"What ETFs match my moderate risk tolerance?"',
                '"How should I split my $800 monthly surplus?"',
                '"Explain the difference between a Roth IRA and a brokerage account."',
                '"Is now a good time to invest in tech stocks?"',
              ].map(q => (
                <li key={q} className="flex items-start gap-2 text-sm text-gray-300">
                  <span style={{ color: '#16a34a', marginTop: 2 }}>→</span>
                  <span className="italic">{q}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Chat mockup */}
          <div className="flex-1 w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#2c2c2c', border: '1px solid #3a3a3a' }}>
            <div className="px-4 py-3 text-xs font-semibold text-gray-400" style={{ borderBottom: '1px solid #3a3a3a' }}>Investment Research</div>
            <div className="p-4 space-y-3">
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-tr-sm px-3 py-2 text-sm max-w-[80%]" style={{ background: '#16a34a', color: 'white' }}>
                  What sectors should I focus on given my moderate risk?
                </div>
              </div>
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm px-3 py-2 text-sm max-w-[85%] text-gray-200" style={{ background: '#383838' }}>
                  Based on your profile, a diversified mix of large-cap growth, dividend stocks, and broad index ETFs works well. Consider allocating 40% to total market ETFs like VTI, 30% to international exposure, and 30% to dividend-focused holdings...
                </div>
              </div>
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-tr-sm px-3 py-2 text-sm max-w-[80%]" style={{ background: '#16a34a', color: 'white' }}>
                  What about VTI vs VOO?
                </div>
              </div>
              <div className="flex items-center gap-1 px-1">
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#16a34a', animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#16a34a', animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#16a34a', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold mb-3">Built with your privacy in mind</h2>
          <p className="text-gray-500">Your financial data is sensitive. We treat it that way.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              icon: '🔐',
              title: 'End-to-end encrypted storage',
              desc: 'All data is stored in Supabase with row-level security — only you can access your own records.',
            },
            {
              icon: '📱',
              title: 'PIN lock on every open',
              desc: 'Set a 4-digit PIN during signup. Every session requires it before any data is shown.',
            },
            {
              icon: '🚫',
              title: 'Zero data selling',
              desc: 'We don\'t sell your data, show you ads, or share your information with any third parties. Period.',
            },
            {
              icon: '🔑',
              title: 'Secure authentication',
              desc: 'Email and password authentication powered by Supabase Auth with industry-standard security practices.',
            },
          ].map(s => (
            <div key={s.title} className="flex gap-4 rounded-2xl p-5" style={{ background: '#222', border: '1px solid #2e2e2e' }}>
              <span className="text-2xl mt-0.5">{s.icon}</span>
              <div>
                <h3 className="font-bold text-white mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Free callout */}
      <section className="mx-4 sm:mx-auto max-w-4xl mb-16 rounded-3xl px-8 py-12 text-center" style={{ background: 'linear-gradient(135deg, #1a3a26, #1e2e22)', border: '1px solid #16a34a33' }}>
        <p className="text-xs font-semibold mb-3" style={{ color: '#4ade80' }}>PRICING</p>
        <h2 className="text-4xl font-extrabold mb-4">Free. Forever.</h2>
        <p className="text-gray-400 max-w-md mx-auto mb-8">
          No subscription. No freemium limits. No hidden fees. advysr is completely free — every feature, for every user, always.
        </p>
        <button onClick={onGetStarted} className="px-8 py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90 hover:scale-[1.02]" style={{ background: '#16a34a', color: 'white' }}>
          Create your free account →
        </button>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-600" style={{ borderTop: '1px solid #222' }}>
        <p className="font-bold mb-1" style={{ color: '#16a34a' }}>advysr</p>
        <p>Personal Finance Manager · Free · Private · AI-powered</p>
      </footer>

    </div>
  );
}
