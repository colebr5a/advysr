import { useState, useRef, useEffect } from 'react';
import { API_BASE } from '../utils/api.js';
import { fmt } from '../utils/formatters.js';
import { monthlySurplus, totalExpenses } from '../utils/calculations.js';
import { runAdviceEngine } from '../engine/adviceEngine.js';
import { Disclaimer } from '../components/ui/Disclaimer.jsx';

const SUGGESTED_QUESTIONS = [
  'What are the risks of QQQ vs VOO?',
  'Should I prioritize paying debt or investing?',
  'Explain dollar-cost averaging',
  'What is a good bond allocation for my risk level?',
  'How do I evaluate an ETF?',
];

function ResearchPanel({ profile, surplus }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function ask(question) {
    if (!question.trim() || loading) return;
    setMessages(m => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question, history: messages,
          context: { riskTolerance: profile.riskTolerance, monthlyIncome: profile.monthlyIncome, surplus, accounts: profile.accounts || [], goals: profile.goals || [] },
        }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'assistant', text: data.answer || data.error || 'No response.' }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Error reaching research assistant. Try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#1B4332' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="#FFFFFF" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: '#111827' }}>Ask about this plan</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Claude · personalized to your profile</p>
        </div>
      </div>
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {SUGGESTED_QUESTIONS.map(q => (
            <button key={q} onClick={() => ask(q)}
              className="text-xs px-2.5 py-1.5 rounded-full press-effect"
              style={{ background: '#F9F8F6', border: '1px solid #E6E9E6', color: '#374151' }}>
              {q}
            </button>
          ))}
        </div>
      )}
      {messages.length > 0 && (
        <div className="space-y-3 mb-3 max-h-72 overflow-y-auto no-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#1B4332' }}>
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#FFFFFF" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
              )}
              <div className="max-w-[82%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap"
                style={m.role === 'user' ? { background: '#1B4332', color: '#FFFFFF' } : { background: '#F9F8F6', color: '#374151', border: '1px solid #E6E9E6' }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: '#1B4332' }}>
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#FFFFFF" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="px-3 py-2 rounded-xl flex items-center gap-1" style={{ background: '#F9F8F6', border: '1px solid #E6E9E6' }}>
                <span className="w-1.5 h-1.5 rounded-full dot-1" style={{ background: '#9CA3AF' }} />
                <span className="w-1.5 h-1.5 rounded-full dot-2" style={{ background: '#9CA3AF' }} />
                <span className="w-1.5 h-1.5 rounded-full dot-3" style={{ background: '#9CA3AF' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && ask(input)}
          placeholder="Ask about a stock, ETF, or strategy…" disabled={loading}
          className="flex-1 px-3 py-2.5 rounded-xl text-xs"
          style={{ background: '#F9F8F6', border: '1.5px solid #E6E9E6', color: '#111827' }} />
        <button onClick={() => ask(input)} disabled={!input.trim() || loading}
          className="px-3 py-2.5 rounded-xl text-xs font-medium press-effect disabled:opacity-40"
          style={{ background: '#1B4332', color: '#FFFFFF' }}>
          Ask
        </button>
      </div>
    </div>
  );
}

const RISK_DESCRIPTIONS = {
  conservative: { label: 'Conservative', emoji: '🛡️', desc: 'Capital preservation. Lower volatility, steady income.' },
  moderate:     { label: 'Moderate',     emoji: '⚖️', desc: 'Balanced growth and stability. Classic diversification.' },
  aggressive:   { label: 'Aggressive',   emoji: '🚀', desc: 'Maximize long-term growth. High volatility, high horizon.' },
};

function getSectorAllocations(riskTolerance, investingBudget) {
  const plans = {
    conservative: [
      { sector: 'US Treasury Bonds',              type: 'bonds',       pct: 0.30, examples: 'TLT, BND, VGSH',         reason: 'Safest fixed income, government-backed',               color: '#6366f1' },
      { sector: 'Investment-Grade Bonds',          type: 'bonds',       pct: 0.20, examples: 'LQD, VCIT, AGG',          reason: 'Corporate bonds with low default risk',                color: '#818cf8' },
      { sector: 'Dividend Stocks / ETFs',          type: 'stocks',      pct: 0.20, examples: 'VYM, SCHD, DVY',          reason: 'Stable companies with regular income',                 color: '#3b82f6' },
      { sector: 'US Large-Cap ETFs',               type: 'stocks',      pct: 0.15, examples: 'VOO, SPY, IVV',           reason: 'Broad US market exposure',                             color: '#60a5fa' },
      { sector: 'High-Yield Savings / Money Mkt',  type: 'cash',        pct: 0.10, examples: 'SGOV, SHV, Marcus/Ally',  reason: 'Liquid, near-risk-free yield',                         color: '#40916C' },
      { sector: 'REITs',                           type: 'alternatives', pct: 0.05, examples: 'VNQ, SCHH, O',            reason: 'Real estate income without owning property',           color: '#a78bfa' },
    ],
    moderate: [
      { sector: 'US Large-Cap ETFs',               type: 'stocks',      pct: 0.30, examples: 'VOO, SPY, QQQ',           reason: 'Core holding — broad US market',                       color: '#3b82f6' },
      { sector: 'International ETFs',              type: 'stocks',      pct: 0.15, examples: 'VXUS, EFA, VEA',          reason: 'Geographic diversification outside the US',            color: '#60a5fa' },
      { sector: 'US Total Bond Market',            type: 'bonds',       pct: 0.15, examples: 'BND, AGG, FXNAX',         reason: 'Ballast against stock volatility',                     color: '#6366f1' },
      { sector: 'Small/Mid-Cap ETFs',              type: 'stocks',      pct: 0.10, examples: 'VB, IJR, IWM',            reason: 'Higher growth potential vs large-cap',                 color: '#8b5cf6' },
      { sector: 'Sector ETFs (Tech/Healthcare)',   type: 'stocks',      pct: 0.10, examples: 'XLK, XLV, VHT',          reason: 'Targeted exposure to high-growth sectors',             color: '#f59e0b' },
      { sector: 'REITs',                           type: 'alternatives', pct: 0.08, examples: 'VNQ, SCHH, AMT',         reason: 'Inflation hedge + income',                             color: '#a78bfa' },
      { sector: 'High-Yield Savings / Money Mkt',  type: 'cash',        pct: 0.07, examples: 'SGOV, SHV, Online HYSA',  reason: 'Liquid reserves for opportunities',                    color: '#40916C' },
      { sector: 'Commodity ETFs',                  type: 'alternatives', pct: 0.05, examples: 'GLD, SLV, DJP',          reason: 'Inflation protection and diversification',             color: '#f97316' },
    ],
    aggressive: [
      { sector: 'US Growth ETFs / S&P 500',        type: 'stocks',      pct: 0.30, examples: 'QQQ, VUG, ARKK',         reason: 'High-growth US equities — core position',              color: '#3b82f6' },
      { sector: 'Individual Growth Stocks',        type: 'stocks',      pct: 0.20, examples: 'NVDA, TSLA, AMZN',       reason: 'High-conviction concentrated bets',                    color: '#1d4ed8' },
      { sector: 'International Emerging Markets',  type: 'stocks',      pct: 0.15, examples: 'VWO, EEM, IEMG',         reason: 'Higher growth potential in developing economies',       color: '#7c3aed' },
      { sector: 'Small-Cap / Micro-Cap ETFs',      type: 'stocks',      pct: 0.10, examples: 'VB, VIOO, IWC',          reason: 'Higher risk/reward vs large-cap equities',             color: '#8b5cf6' },
      { sector: 'Sector ETFs (Tech, Biotech)',     type: 'stocks',      pct: 0.10, examples: 'SOXX, XBI, XLE',         reason: 'Concentrated sector upside',                           color: '#f59e0b' },
      { sector: 'Futures / Leveraged ETFs',        type: 'futures',     pct: 0.05, examples: 'TQQQ, UPRO, SPXL',       reason: 'Amplified returns — experienced investors only',       color: '#ef4444' },
      { sector: 'Crypto ETFs',                     type: 'alternatives', pct: 0.05, examples: 'IBIT, FBTC, GBTC',      reason: 'High-risk digital asset exposure',                     color: '#f97316' },
      { sector: 'Commodity / Inflation Hedge',     type: 'alternatives', pct: 0.05, examples: 'GLD, IAU, PDBC',        reason: 'Hedge against inflation and dollar weakness',          color: '#40916C' },
    ],
  };
  const plan = plans[riskTolerance] || plans.moderate;
  return plan.map(s => ({ ...s, monthlyAmount: Math.round(investingBudget * s.pct) }));
}

function classifyAccount(label) {
  const l = label.toLowerCase();
  if (l.includes('roth') || l.includes('ira')) return 'retirement';
  if (l.includes('401') || l.includes('403') || l.includes('457')) return 'retirement';
  if (l.includes('brokerage') || l.includes('fidelity') || l.includes('schwab') || l.includes('vanguard') || l.includes('etrade') || l.includes('robinhood')) return 'brokerage';
  if (l.includes('high-yield') || l.includes('hysa') || l.includes('savings') || l.includes('marcus') || l.includes('ally') || l.includes('amex')) return 'hysa';
  if (l.includes('checking') || l.includes('chase') || l.includes('bank of america') || l.includes('wells fargo') || l.includes('citi')) return 'checking';
  if (l.includes('money market') || l.includes('mmf')) return 'money_market';
  if (l.includes('hsa')) return 'hsa';
  return 'other';
}

function getAccountAdvice(acc, monthlyExpenses, efBalance) {
  const type = classifyAccount(acc.label);
  const bal = acc.balance || 0;
  const idealChecking = monthlyExpenses * 2;

  switch (type) {
    case 'checking':
      if (bal > idealChecking * 1.5) {
        const excess = bal - idealChecking;
        return { status: 'over', message: `${fmt(excess)} above your ideal 2-month buffer (${fmt(idealChecking)}). Move excess to a HYSA to earn interest.`, action: `Transfer ~${fmt(excess)} to HYSA` };
      } else if (bal < monthlyExpenses) {
        return { status: 'under', message: `Below one month of expenses. Keep at least ${fmt(idealChecking)} here as a buffer.`, action: 'Build up to 2 months of expenses' };
      }
      return { status: 'ok', message: `Healthy balance covering ~${Math.round(bal / Math.max(monthlyExpenses, 1))} months of expenses.`, action: null };
    case 'hysa':
      return { status: 'ok', message: `High-yield savings earns ~4–5% APY. Perfect for emergency fund and short-term goals.`, action: null };
    case 'brokerage':
      return { status: 'invest', message: `Taxable brokerage with ${fmt(bal)}. Fully investable based on your risk profile.`, action: `Allocate ${fmt(bal)} across sectors below` };
    case 'retirement':
      return { status: 'ok', message: `Maximize tax-advantaged contributions ($7,000/yr Roth IRA, $23,500/yr 401k in 2025). Keep invested long-term.`, action: null };
    case 'hsa':
      return { status: 'invest', message: `Triple tax advantage. If not needed for medical expenses soon, invest it.`, action: 'Invest HSA in low-cost index funds' };
    case 'money_market':
      return { status: 'ok', message: `Near-risk-free yield. Good for emergency fund or short-term reserves.`, action: null };
    default:
      return { status: 'ok', message: `Balance: ${fmt(bal)}.`, action: null };
  }
}

const TYPE_BADGE = {
  stocks:       { bg: '#EFF6FF', color: '#1D4ED8' },
  bonds:        { bg: '#EEF2FF', color: '#4338CA' },
  cash:         { bg: '#F0FAF4', color: '#1B4332' },
  alternatives: { bg: '#F5F3FF', color: '#6D28D9' },
  futures:      { bg: '#FEF2F2', color: '#DC2626' },
};

const STATUS_STYLE = {
  ok:     { border: '#B7E4C7', bg: '#F0FAF4' },
  over:   { border: '#FCD34D', bg: '#FFFBEB' },
  under:  { border: '#FCA5A5', bg: '#FEF2F2' },
  invest: { border: '#93C5FD', bg: '#EFF6FF' },
};

export function InvestingPage({ profile }) {
  const result        = runAdviceEngine(profile);
  const investAlloc   = result.allocations.filter(a => ['stocks', 'bonds', 'cash_savings'].includes(a.ruleId));
  const investingBudget = investAlloc.reduce((s, a) => s + a.monthlyAmount, 0);
  const surplus       = Math.max(0, monthlySurplus(profile));
  const monthlyExpenses = totalExpenses(profile);
  const risk          = profile.riskTolerance || 'moderate';
  const rd            = RISK_DESCRIPTIONS[risk];
  const sectors       = getSectorAllocations(risk, Math.max(investingBudget, surplus * 0.5));
  const accounts      = profile.accounts || [];
  const brokerageAccts = accounts.filter(a => classifyAccount(a.label) === 'brokerage');
  const totalInvestable = brokerageAccts.reduce((s, a) => s + (a.balance || 0), 0);
  const monthlyBudget = sectors.reduce((s, a) => s + a.monthlyAmount, 0);

  const typeBreakdown = sectors.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + s.monthlyAmount;
    return acc;
  }, {});

  return (
    <main className="px-4 pt-3 space-y-4 max-w-2xl mx-auto">

      {/* Risk profile hero */}
      <div
        className="rounded-3xl p-6"
        style={{ background: '#1B4332' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Risk Profile</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{rd.emoji}</span>
              <p className="text-2xl font-bold" style={{ color: '#FFFFFF', letterSpacing: '-0.01em' }}>{rd.label}</p>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{rd.desc}</p>
          </div>
          <div className="text-right">
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Monthly Budget</p>
            <p className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>{fmt(monthlyBudget)}</p>
          </div>
        </div>
        {/* Type breakdown pills */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          {Object.entries(typeBreakdown).map(([type, amt]) => (
            <span key={type} className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
              {type} · {fmt(amt)}/mo
            </span>
          ))}
        </div>
      </div>

      {/* Account analysis */}
      {accounts.length > 0 && (
        <div>
          <p className="font-semibold mb-3" style={{ color: '#111827' }}>Account Analysis</p>
          <div className="space-y-2.5">
            {accounts.map(acc => {
              const advice = getAccountAdvice(acc, monthlyExpenses, profile.emergencyFundBalance || 0);
              const st     = STATUS_STYLE[advice.status] || STATUS_STYLE.ok;
              return (
                <div key={acc.id} className="rounded-2xl p-4"
                  style={{ background: st.bg, border: `1.5px solid ${st.border}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="font-semibold text-sm" style={{ color: '#111827' }}>{acc.label}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                          style={{ background: 'rgba(255,255,255,0.7)', color: '#6B7280' }}>
                          {classifyAccount(acc.label).replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>{advice.message}</p>
                      {advice.action && (
                        <p className="text-xs font-semibold mt-1.5" style={{ color: '#1B4332' }}>→ {advice.action}</p>
                      )}
                    </div>
                    <p className="text-lg font-bold flex-shrink-0" style={{ color: '#111827' }}>{fmt(acc.balance || 0)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Investable assets summary */}
      {totalInvestable > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold" style={{ color: '#111827' }}>Investable Brokerage Assets</p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Apply your {rd.label} allocation</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#111827' }}>{fmt(totalInvestable)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sectors.slice(0, 4).map((s, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: '#F9F8F6' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
                  <p className="text-xs truncate" style={{ color: '#6B7280' }}>{s.sector.split('/')[0].trim()}</p>
                </div>
                <p className="font-bold text-sm" style={{ color: '#111827' }}>{fmt(Math.round(totalInvestable * s.pct))}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{Math.round(s.pct * 100)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sector allocation */}
      <div>
        <p className="font-semibold mb-3" style={{ color: '#111827' }}>Monthly Sector Plan</p>
        <div className="space-y-2.5">
          {sectors.map((s, i) => {
            const badge = TYPE_BADGE[s.type] || { bg: '#F3F4F6', color: '#374151' };
            return (
              <div key={i} className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0 mt-0.5" style={{ background: s.color }} />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#111827' }}>{s.sector}</p>
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full mt-0.5"
                        style={{ background: badge.bg, color: badge.color }}>
                        {s.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold" style={{ color: '#111827' }}>{fmt(s.monthlyAmount)}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{Math.round(s.pct * 100)}%</p>
                  </div>
                </div>
                <p className="text-xs mb-2.5" style={{ color: '#6B7280' }}>{s.reason}</p>
                <div className="rounded-xl px-3 py-2" style={{ background: '#F9F8F6' }}>
                  <p className="text-xs font-medium mb-0.5" style={{ color: '#9CA3AF' }}>Examples</p>
                  <p className="text-xs" style={{ color: '#374151' }}>{s.examples}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Research panel */}
      <ResearchPanel profile={profile} surplus={surplus} />

      <Disclaimer className="pb-2" />
    </main>
  );
}
