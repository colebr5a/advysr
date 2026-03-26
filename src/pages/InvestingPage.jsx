import { Card } from '../components/ui/Card.jsx';
import { fmt } from '../utils/formatters.js';
import { monthlySurplus, totalExpenses } from '../utils/calculations.js';
import { runAdviceEngine } from '../engine/adviceEngine.js';

const RISK_DESCRIPTIONS = {
  conservative: { label: 'Conservative', bg: 'bg-indigo-50', text: 'text-indigo-700', desc: 'Capital preservation with steady income. Lower volatility, lower long-term growth.' },
  moderate: { label: 'Moderate', bg: 'bg-amber-50', text: 'text-amber-700', desc: 'Balanced growth and stability. A classic diversified portfolio for most investors.' },
  aggressive: { label: 'Aggressive', bg: 'bg-red-50', text: 'text-red-700', desc: 'Maximize long-term growth. High volatility — suited for long time horizons.' },
};

function getSectorAllocations(riskTolerance, investingBudget) {
  const plans = {
    conservative: [
      { sector: 'US Treasury Bonds', type: 'bonds', pct: 0.30, examples: 'TLT, BND, VGSH', reason: 'Safest fixed income, government-backed', color: '#6366f1' },
      { sector: 'Investment-Grade Bonds', type: 'bonds', pct: 0.20, examples: 'LQD, VCIT, AGG', reason: 'Corporate bonds with low default risk', color: '#818cf8' },
      { sector: 'Dividend Stocks / ETFs', type: 'stocks', pct: 0.20, examples: 'VYM, SCHD, DVY', reason: 'Stable companies with regular income', color: '#3b82f6' },
      { sector: 'US Large-Cap ETFs', type: 'stocks', pct: 0.15, examples: 'VOO, SPY, IVV', reason: 'Broad US market exposure', color: '#60a5fa' },
      { sector: 'High-Yield Savings / Money Market', type: 'cash', pct: 0.10, examples: 'SGOV, SHV, Marcus/Ally', reason: 'Liquid, near-risk-free yield', color: '#84cc16' },
      { sector: 'REITs', type: 'alternatives', pct: 0.05, examples: 'VNQ, SCHH, O', reason: 'Real estate income without owning property', color: '#a78bfa' },
    ],
    moderate: [
      { sector: 'US Large-Cap ETFs', type: 'stocks', pct: 0.30, examples: 'VOO, SPY, QQQ', reason: 'Core holding — broad US market', color: '#3b82f6' },
      { sector: 'International ETFs', type: 'stocks', pct: 0.15, examples: 'VXUS, EFA, VEA', reason: 'Geographic diversification outside the US', color: '#60a5fa' },
      { sector: 'US Total Bond Market', type: 'bonds', pct: 0.15, examples: 'BND, AGG, FXNAX', reason: 'Ballast against stock volatility', color: '#6366f1' },
      { sector: 'Small/Mid-Cap ETFs', type: 'stocks', pct: 0.10, examples: 'VB, IJR, IWM', reason: 'Higher growth potential vs large-cap', color: '#8b5cf6' },
      { sector: 'Sector ETFs (Tech/Healthcare)', type: 'stocks', pct: 0.10, examples: 'XLK, XLV, VHT', reason: 'Targeted exposure to high-growth sectors', color: '#f59e0b' },
      { sector: 'REITs', type: 'alternatives', pct: 0.08, examples: 'VNQ, SCHH, AMT', reason: 'Inflation hedge + income', color: '#a78bfa' },
      { sector: 'High-Yield Savings / Money Market', type: 'cash', pct: 0.07, examples: 'SGOV, SHV, Online HYSA', reason: 'Liquid reserves for opportunities', color: '#84cc16' },
      { sector: 'Commodity ETFs', type: 'alternatives', pct: 0.05, examples: 'GLD, SLV, DJP', reason: 'Inflation protection and diversification', color: '#f97316' },
    ],
    aggressive: [
      { sector: 'US Growth ETFs / S&P 500', type: 'stocks', pct: 0.30, examples: 'QQQ, VUG, ARKK', reason: 'High-growth US equities — core position', color: '#3b82f6' },
      { sector: 'Individual Growth Stocks', type: 'stocks', pct: 0.20, examples: 'NVDA, TSLA, AMZN (research first)', reason: 'Concentrated bets on high-conviction names', color: '#1d4ed8' },
      { sector: 'International Emerging Markets', type: 'stocks', pct: 0.15, examples: 'VWO, EEM, IEMG', reason: 'Higher growth potential in developing economies', color: '#7c3aed' },
      { sector: 'Small-Cap / Micro-Cap ETFs', type: 'stocks', pct: 0.10, examples: 'VB, VIOO, IWC', reason: 'Higher risk/reward vs large-cap equities', color: '#8b5cf6' },
      { sector: 'Sector ETFs (Tech, Biotech, Energy)', type: 'stocks', pct: 0.10, examples: 'SOXX, XBI, XLE', reason: 'Concentrated sector upside', color: '#f59e0b' },
      { sector: 'Futures / Leveraged ETFs', type: 'futures', pct: 0.05, examples: 'TQQQ, UPRO, SPXL (risky)', reason: 'Amplified returns — only for experienced investors', color: '#ef4444' },
      { sector: 'Crypto ETFs', type: 'alternatives', pct: 0.05, examples: 'IBIT, FBTC, GBTC', reason: 'High-risk digital asset exposure', color: '#f97316' },
      { sector: 'Commodity / Inflation Hedge', type: 'alternatives', pct: 0.05, examples: 'GLD, IAU, PDBC', reason: 'Hedge against inflation and dollar weakness', color: '#84cc16' },
    ],
  };
  const plan = plans[riskTolerance] || plans.moderate;
  return plan.map(s => ({ ...s, monthlyAmount: Math.round(investingBudget * s.pct) }));
}

// Classify an account label into a type for advice
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
        return { status: 'over', message: `You have ${fmt(excess)} above your ideal 2-month buffer (${fmt(idealChecking)}). Move the excess to a high-yield savings account to earn interest.`, action: `Transfer ~${fmt(excess)} to HYSA` };
      } else if (bal < monthlyExpenses) {
        return { status: 'under', message: `Balance is below one month of expenses. Keep at least ${fmt(idealChecking)} here as a buffer.`, action: 'Build up to 2 months of expenses' };
      }
      return { status: 'ok', message: `Healthy checking balance covering ~${Math.round(bal / Math.max(monthlyExpenses, 1))} months of expenses.`, action: null };

    case 'hysa':
      return { status: 'ok', message: `High-yield savings earns ~4–5% APY. This is a great place for your emergency fund and short-term goals. Current balance: ${fmt(bal)}.`, action: null };

    case 'brokerage': {
      const investable = Math.max(0, bal);
      return {
        status: 'invest',
        message: `Taxable brokerage account with ${fmt(investable)}. This money can be fully invested based on your risk profile.`,
        action: `Allocate ${fmt(investable)} across sectors below`,
        investable,
      };
    }

    case 'retirement':
      return { status: 'ok', message: `Retirement account with ${fmt(bal)}. Maximize tax-advantaged contributions ($7,000/yr Roth IRA, $23,500/yr 401k in 2025). Keep this invested long-term.`, action: null };

    case 'hsa':
      return { status: 'invest', message: `HSA (Health Savings Account) with ${fmt(bal)}. If you don't need it for medical expenses soon, invest it — triple tax advantage.`, action: 'Invest HSA in low-cost index funds' };

    case 'money_market':
      return { status: 'ok', message: `Money market fund earning near-risk-free yield. Good for emergency fund or short-term reserves.`, action: null };

    default:
      return { status: 'ok', message: `Balance: ${fmt(bal)}.`, action: null };
  }
}

const TYPE_COLORS = {
  stocks: 'bg-blue-100 text-blue-700',
  bonds: 'bg-indigo-100 text-indigo-700',
  cash: 'bg-green-100 text-green-700',
  alternatives: 'bg-purple-100 text-purple-700',
  futures: 'bg-red-100 text-red-700',
};

const STATUS_STYLES = {
  ok: 'border-green-100 bg-green-50',
  over: 'border-amber-100 bg-amber-50',
  under: 'border-red-100 bg-red-50',
  invest: 'border-blue-100 bg-blue-50',
};

export function InvestingPage({ profile }) {
  const result = runAdviceEngine(profile);
  const investAlloc = result.allocations.filter(a => ['stocks', 'bonds', 'cash_savings'].includes(a.ruleId));
  const investingBudget = investAlloc.reduce((s, a) => s + a.monthlyAmount, 0);
  const surplus = Math.max(0, monthlySurplus(profile));
  const monthlyExpenses = totalExpenses(profile);
  const efBalance = profile.emergencyFundBalance || 0;
  const risk = profile.riskTolerance || 'moderate';
  const rd = RISK_DESCRIPTIONS[risk];
  const sectors = getSectorAllocations(risk, Math.max(investingBudget, surplus * 0.5));

  const accounts = profile.accounts || [];
  const totalByType = sectors.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + s.monthlyAmount;
    return acc;
  }, {});

  // Total investable liquid assets from accounts
  const totalLiquid = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const brokerageAccounts = accounts.filter(a => classifyAccount(a.label) === 'brokerage');
  const totalInvestable = brokerageAccounts.reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investing</h1>
          <p className="text-gray-500 text-sm mt-1">Personalized allocation based on your profile</p>
        </div>
        <div className={`px-4 py-2 rounded-xl ${rd.bg}`}>
          <p className="text-xs font-medium text-gray-500">Risk Profile</p>
          <p className={`font-bold ${rd.text}`}>{rd.label}</p>
        </div>
      </div>

      {/* Account Analysis */}
      {accounts.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Your Account Analysis</h2>
          <div className="space-y-3">
            {accounts.map(acc => {
              const advice = getAccountAdvice(acc, monthlyExpenses, efBalance);
              return (
                <div key={acc.id} className={`rounded-2xl border-2 p-4 ${STATUS_STYLES[advice.status] || STATUS_STYLES.ok}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{acc.label}</p>
                        <span className="text-xs px-2 py-0.5 bg-white/70 rounded-full text-gray-500 font-medium capitalize">{classifyAccount(acc.label).replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm text-gray-600">{advice.message}</p>
                      {advice.action && (
                        <p className="text-xs font-semibold mt-1.5 text-primary-700">→ {advice.action}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-gray-900">{fmt(acc.balance || 0)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Investable asset summary */}
          {totalInvestable > 0 && (
            <Card className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">Investable Assets in Brokerage</p>
                  <p className="text-sm text-gray-500">Apply your {rd.label} allocation plan to these funds</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{fmt(totalInvestable)}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sectors.slice(0, 4).map((s, i) => (
                  <div key={i} className="rounded-xl p-3 text-center" style={{ background: '#383838' }}>
                    <div className="w-2 h-2 rounded-sm mx-auto mb-1" style={{ background: s.color }} />
                    <p className="text-xs text-gray-500 truncate">{s.sector.split('/')[0].trim()}</p>
                    <p className="font-bold text-gray-900">{fmt(Math.round(totalInvestable * s.pct))}</p>
                    <p className="text-xs text-gray-400">{Math.round(s.pct * 100)}%</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Monthly investing plan */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Monthly Investing Plan</h2>
        <Card className="mb-4">
          <div className="flex items-start gap-4">
            <div className="text-2xl">{risk === 'conservative' ? '🛡️' : risk === 'moderate' ? '⚖️' : '🚀'}</div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{rd.label} Portfolio</p>
              <p className="text-sm text-gray-500 mt-0.5">{rd.desc}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Monthly Budget</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(sectors.reduce((s, a) => s + a.monthlyAmount, 0))}</p>
            </div>
          </div>
        </Card>

        {/* Type summary pills */}
        <div className="flex flex-wrap gap-3 mb-4">
          {Object.entries(totalByType).map(([type, amt]) => (
            <div key={type} className={`px-4 py-2 rounded-xl ${TYPE_COLORS[type] || 'bg-gray-100 text-gray-700'}`}>
              <span className="text-xs font-medium capitalize">{type}</span>
              <span className="ml-2 font-bold">{fmt(amt)}/mo</span>
            </div>
          ))}
        </div>

        {/* Sector cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sectors.map((s, i) => (
            <Card key={i} className="!p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                    <p className="font-semibold text-gray-900 text-sm">{s.sector}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[s.type] || 'bg-gray-100 text-gray-600'}`}>{s.type}</span>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className="text-xl font-bold text-gray-900">{fmt(s.monthlyAmount)}</p>
                  <p className="text-xs text-gray-400">{Math.round(s.pct * 100)}% of budget</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-2">{s.reason}</p>
              <div className="rounded-lg px-3 py-2" style={{ background: '#383838' }}>
                <p className="text-xs text-gray-400 font-medium">Examples</p>
                <p className="text-xs text-gray-700 font-mono mt-0.5">{s.examples}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center pb-4">
        Educational guidance only — not financial advice. Consult a licensed financial advisor before investing.
      </p>
    </main>
  );
}
