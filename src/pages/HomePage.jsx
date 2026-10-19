import { useState } from 'react';
import { CircularProgress } from '../components/ui/CircularProgress.jsx';
import { fmt } from '../utils/formatters.js';
import { totalExpenses, monthlySurplus } from '../utils/calculations.js';
import { runAdviceEngine } from '../engine/adviceEngine.js';
import { FREE_LIMITS } from '../lib/premiumService.js';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DEFAULT_ACCOUNTS = [
  { id: 'checking', label: 'Checking', balance: 0 },
  { id: 'savings', label: 'High-Yield Savings', balance: 0 },
  { id: 'roth', label: 'Roth IRA', balance: 0 },
  { id: 'brokerage', label: 'Brokerage', balance: 0 },
];

let accId = 10;
let entryCtr = 5000;

const FOREST_PALETTE = ['#1B4332','#2D6A4F','#40916C','#52B788','#74C69D','#95D5B2'];

function classifyAccount(label) {
  const l = label.toLowerCase();
  if (l.includes('hsa')) return 'hsa';
  if (l.includes('check')) return 'checking';
  if (l.includes('hysa') || l.includes('high-yield') || l.includes('high yield') || l.includes('savings') || l.includes('emergency')) return 'savings';
  if (l.includes('roth') || l.includes('ira') || l.includes('401') || l.includes('403') || l.includes('retirement')) return 'retirement';
  if (l.includes('brokerage') || l.includes('invest') || l.includes('taxable')) return 'brokerage';
  return 'other';
}

const ALLOCATION_TARGETS = {
  conservative: { checking: 10, savings: 30, retirement: 40, brokerage: 15, hsa: 5 },
  moderate:     { checking: 8,  savings: 20, retirement: 40, brokerage: 27, hsa: 5 },
  aggressive:   { checking: 5,  savings: 10, retirement: 35, brokerage: 45, hsa: 5 },
};

function NetWorthDonut({ accounts, totalAssets }) {
  const size = 160;
  const cx = size / 2, cy = size / 2;
  const outerR = 68, innerR = 44;
  const filtered = accounts.filter(a => (a.balance || 0) > 0);

  if (!filtered.length || !totalAssets) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="#E6E9E6" strokeWidth={outerR - innerR} />
      </svg>
    );
  }

  let cum = -Math.PI / 2;
  const slices = filtered.map((acc, i) => {
    const pct = acc.balance / totalAssets;
    const angle = pct * 2 * Math.PI;
    const start = cum;
    cum += angle;
    return { acc, pct, startAngle: start, endAngle: cum, color: FOREST_PALETTE[i % FOREST_PALETTE.length] };
  });

  function arc(s, e, oR, iR) {
    const x1 = cx + oR * Math.cos(s), y1 = cy + oR * Math.sin(s);
    const x2 = cx + oR * Math.cos(e), y2 = cy + oR * Math.sin(e);
    const x3 = cx + iR * Math.cos(e), y3 = cy + iR * Math.sin(e);
    const x4 = cx + iR * Math.cos(s), y4 = cy + iR * Math.sin(s);
    const large = e - s > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${oR} ${oR} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${iR} ${iR} 0 ${large} 0 ${x4} ${y4} Z`;
  }

  return (
    <svg width={size} height={size}>
      {slices.map((s, i) => (
        <path key={i} d={arc(s.startAngle, s.endAngle, outerR, innerR)} fill={s.color} stroke="#F5F3EE" strokeWidth={2} />
      ))}
    </svg>
  );
}

function GettingStartedCard({ profile, onProfileUpdate, onNavigate }) {
  const hasAccounts = (profile.accounts || []).some(a => (a.balance || 0) > 0);
  const hasHoldings = (profile.holdings || []).length > 0;
  const hasGoals    = (profile.goals || []).length > 0;
  const allDone     = hasAccounts && hasHoldings && hasGoals;

  if (allDone || profile.gettingStartedDismissed) return null;

  const steps = [
    { done: hasAccounts, label: 'Add account balances', sub: 'Checking, savings, investments', action: null },
    { done: hasHoldings, label: 'Import your portfolio', sub: 'Upload a CSV from your brokerage', action: () => onNavigate('portfolio') },
    { done: hasGoals, label: 'Set a financial goal', sub: 'Emergency fund, home, retirement', action: () => onNavigate('goals') },
  ];
  const doneCount = steps.filter(s => s.done).length;

  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium mb-0.5" style={{ color: '#52B788' }}>
            Getting Started · {doneCount}/{steps.length}
          </p>
          <p className="font-semibold" style={{ color: '#111827' }}>Set up your dashboard</p>
        </div>
        <button
          onClick={() => onProfileUpdate({ ...profile, gettingStartedDismissed: true })}
          className="press-effect"
          style={{ color: '#9CA3AF' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="h-1 rounded-full mb-4" style={{ background: '#E6E9E6' }}>
        <div
          className="h-1 rounded-full transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%`, background: '#1B4332' }}
        />
      </div>
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: s.done ? '#1B4332' : '#F5F3EE',
                border: `1.5px solid ${s.done ? '#1B4332' : '#C4CDC7'}`,
              }}
            >
              {s.done && (
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#FFFFFF" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm" style={{ color: s.done ? '#9CA3AF' : '#111827', textDecoration: s.done ? 'line-through' : 'none' }}>
                {s.label}
              </p>
            </div>
            {!s.done && s.action && (
              <button onClick={s.action} className="text-xs font-medium press-effect" style={{ color: '#1B4332' }}>
                Go →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomePage({ profile, onProfileUpdate, onNavigate, isPremium, onShowUpgrade }) {
  const currentMonthIndex = new Date().getMonth();
  const [activeMonth, setActiveMonth] = useState(currentMonthIndex);
  const [entryForms, setEntryForms]   = useState({});
  const [netWorthVisible, setNetWorthVisible] = useState(false);

  const accounts = profile.accounts || DEFAULT_ACCOUNTS;
  function updateAccounts(updated) { onProfileUpdate({ ...profile, accounts: updated }); }

  const totalAssets = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const totalDebt   = (profile.debts || []).reduce((s, d) => s + d.balance, 0);
  const netWorth    = totalAssets - totalDebt;

  const monthlyData = profile.monthlyData || {};
  const monthKey    = `${new Date().getFullYear()}-${String(activeMonth + 1).padStart(2, '0')}`;
  const result      = runAdviceEngine(profile);
  const surplus     = Math.max(0, monthlySurplus(profile));

  const allocationItems = result.allocations
    .filter(a => a.monthlyAmount > 0 && a.ruleId !== 'buffer')
    .map(a => ({ id: a.ruleId, label: a.label, suggested: Math.round(a.monthlyAmount), color: a.color }));

  const monthChecks = monthlyData[monthKey] || {};

  function itemEntries(ruleId) { return monthChecks[ruleId]?.entries || []; }
  function itemTotal(ruleId)   { return itemEntries(ruleId).reduce((s, e) => s + (e.amount || 0), 0); }

  function updateMonthItem(ruleId, updates) {
    onProfileUpdate({
      ...profile,
      monthlyData: {
        ...monthlyData,
        [monthKey]: {
          ...monthChecks,
          [ruleId]: { ...(monthChecks[ruleId] || { entries: [] }), ...updates }
        }
      }
    });
  }

  function toggleCheck(ruleId) {
    updateMonthItem(ruleId, { checked: !(monthChecks[ruleId]?.checked || false) });
  }

  function addEntry(ruleId) {
    const formKey = `${monthKey}_${ruleId}`;
    const form = entryForms[formKey] || {};
    const amount = Number(form.amount) || 0;
    if (amount <= 0) return;
    const entry = {
      id: `e${++entryCtr}`,
      amount,
      note: form.note || '',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
    const existing = monthChecks[ruleId] || { entries: [] };
    const newEntries = [...(existing.entries || []), entry];
    const newTotal   = newEntries.reduce((s, e) => s + e.amount, 0);
    const suggested  = allocationItems.find(i => i.id === ruleId)?.suggested || 0;
    updateMonthItem(ruleId, { entries: newEntries, checked: newTotal >= suggested });
    setEntryForms(f => ({ ...f, [formKey]: { amount: '', note: '' } }));
  }

  function deleteEntry(ruleId, entryId) {
    const existing  = monthChecks[ruleId] || { entries: [] };
    const newEntries = (existing.entries || []).filter(e => e.id !== entryId);
    const newTotal   = newEntries.reduce((s, e) => s + e.amount, 0);
    const suggested  = allocationItems.find(i => i.id === ruleId)?.suggested || 0;
    updateMonthItem(ruleId, { entries: newEntries, checked: newTotal >= suggested });
  }

  const totalLogged      = allocationItems.reduce((s, item) => s + itemTotal(item.id), 0);
  const allocationProg   = surplus > 0 ? Math.min(1, totalLogged / surplus) : 0;
  const checkedCount     = allocationItems.filter(i => monthChecks[i.id]?.checked).length;

  return (
    <main className="px-4 pt-3 space-y-4 max-w-2xl mx-auto">
      <GettingStartedCard profile={profile} onProfileUpdate={onProfileUpdate} onNavigate={onNavigate} />

      {/* Net Worth Hero */}
      <div
        className="rounded-3xl p-6"
        style={{ background: '#1B4332' }}
      >
        <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Total Net Worth
        </p>
        <div className="flex items-center gap-2 mb-1">
          <p
            className="text-4xl font-bold tracking-tight"
            style={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}
          >
            {netWorthVisible ? fmt(netWorth) : '— — —'}
          </p>
          <button
            onClick={() => setNetWorthVisible(v => !v)}
            className="press-effect flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            aria-label={netWorthVisible ? 'Hide net worth' : 'Show net worth'}
          >
            {netWorthVisible ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
        <div className="flex gap-4 mt-3 mb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '12px' }}>
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Assets</p>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{fmt(totalAssets)}</p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Debt</p>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{fmt(totalDebt)}</p>
          </div>
        </div>

        {/* Donut + legend */}
        <div className="flex items-center gap-5">
          <div className="flex-shrink-0 relative">
            <NetWorthDonut accounts={accounts} totalAssets={totalAssets} />
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            {accounts.filter(a => (a.balance || 0) > 0).slice(0, 5).map((acc, i) => {
              const pct = totalAssets > 0 ? Math.round((acc.balance / totalAssets) * 100) : 0;
              return (
                <div key={acc.id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: FOREST_PALETTE[i % FOREST_PALETTE.length] }} />
                  <span className="text-xs truncate flex-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{acc.label}</span>
                  <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'rgba(255,255,255,0.85)' }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Accounts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold" style={{ color: '#111827' }}>Accounts</p>
          <button
            onClick={() => {
              if (!isPremium && accounts.length >= FREE_LIMITS.accounts) {
                onShowUpgrade('accounts');
              } else {
                updateAccounts([...accounts, { id: `acc${++accId}`, label: 'New Account', balance: 0 }]);
              }
            }}
            className="text-xs font-medium press-effect"
            style={{ color: '#2D6A4F' }}
          >
            + Add
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {accounts.map((acc, i) => {
            const risk      = profile.riskTolerance?.toLowerCase();
            const targets   = ALLOCATION_TARGETS[risk];
            const accType   = classifyAccount(acc.label);
            const goalPct   = targets?.[accType];
            const curPct    = totalAssets > 0 ? Math.round((acc.balance || 0) / totalAssets * 100) : 0;
            const onTarget  = goalPct != null && curPct >= goalPct;

            return (
              <div
                key={acc.id}
                className="rounded-2xl p-4 relative group"
                style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}
              >
                <button
                  onClick={() => updateAccounts(accounts.filter((_, j) => j !== i))}
                  className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity press-effect"
                  style={{ color: '#C4CDC7' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div
                  className="w-2 h-2 rounded-sm mb-2"
                  style={{ background: FOREST_PALETTE[i % FOREST_PALETTE.length] }}
                />
                <input
                  value={acc.label}
                  onChange={e => { const a = [...accounts]; a[i] = { ...a[i], label: e.target.value }; updateAccounts(a); }}
                  className="text-xs w-full border-0 bg-transparent p-0 mb-1 truncate"
                  style={{ color: '#6B7280', outline: 'none' }}
                />
                {goalPct != null && (
                  <p className="text-xs mb-2" style={{ color: onTarget ? '#52B788' : '#D97706' }}>
                    {onTarget ? `✓ ${goalPct}% target` : `${curPct}% / ${goalPct}%`}
                  </p>
                )}
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9CA3AF' }}>$</span>
                  <input
                    type="number"
                    value={acc.balance || ''}
                    onChange={e => { const a = [...accounts]; a[i] = { ...a[i], balance: Number(e.target.value) || 0 }; updateAccounts(a); }}
                    placeholder="0"
                    className="w-full pl-4 text-xl font-bold border-0 bg-transparent"
                    style={{ color: '#111827', outline: 'none' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Allocation */}
      <div>
        {/* Month selector */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-4">
          {MONTHS.map((m, idx) => (
            <button
              key={m}
              onClick={() => setActiveMonth(idx)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all press-effect"
              style={{
                background: idx === activeMonth ? '#1B4332' : idx === currentMonthIndex ? '#F0FAF4' : 'transparent',
                color: idx === activeMonth ? '#FFFFFF' : idx === currentMonthIndex ? '#1B4332' : '#9CA3AF',
                border: idx === activeMonth ? 'none' : idx === currentMonthIndex ? '1px solid #B7E4C7' : '1px solid transparent',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold" style={{ color: '#111827' }}>
              {MONTHS_FULL[activeMonth]}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Monthly surplus allocation</p>
          </div>
          {surplus > 0 && (
            <div className="text-right">
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Surplus</p>
              <p className="text-sm font-semibold" style={{ color: '#111827' }}>{fmt(surplus)}</p>
            </div>
          )}
        </div>

        {surplus <= 0 ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: '#111827' }}>No surplus to allocate</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Your expenses equal or exceed your income.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Progress overview */}
            <div
              className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}
            >
              <CircularProgress value={allocationProg} size={64} strokeWidth={6} color="#1B4332">
                <p className="text-xs font-bold" style={{ color: '#111827' }}>
                  {Math.round(allocationProg * 100)}%
                </p>
              </CircularProgress>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: '#6B7280' }}>Logged</span>
                  <span className="font-semibold" style={{ color: '#1B4332' }}>{fmt(totalLogged)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: '#6B7280' }}>Remaining</span>
                  <span className="font-semibold" style={{ color: surplus - totalLogged < 0 ? '#DC2626' : '#111827' }}>
                    {fmt(Math.max(0, surplus - totalLogged))}
                  </span>
                </div>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{checkedCount} of {allocationItems.length} complete</p>
              </div>
            </div>

            {/* Allocation items */}
            {allocationItems.map(item => {
              const check    = monthChecks[item.id] || {};
              const entries  = itemEntries(item.id);
              const logged   = itemTotal(item.id);
              const isChecked = check.checked || false;
              const formKey  = `${monthKey}_${item.id}`;
              const form     = entryForms[formKey] || {};
              const logPct   = item.suggested > 0 ? Math.min(1, logged / item.suggested) : 0;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl overflow-hidden transition-all"
                  style={{
                    background: '#FFFFFF',
                    border: `1.5px solid ${isChecked ? '#B7E4C7' : '#E6E9E6'}`,
                  }}
                >
                  <div className="flex items-center gap-3 p-4">
                    <button
                      onClick={() => toggleCheck(item.id)}
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all press-effect"
                      style={{
                        background: isChecked ? '#1B4332' : 'transparent',
                        border: `2px solid ${isChecked ? '#1B4332' : '#C4CDC7'}`,
                      }}
                    >
                      {isChecked && (
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#FFFFFF" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium" style={{ color: isChecked ? '#52B788' : '#111827' }}>
                          {item.label}
                        </p>
                        <p className="text-xs flex-shrink-0 ml-2" style={{ color: '#9CA3AF' }}>
                          {fmt(logged)} / {fmt(item.suggested)}
                        </p>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: '#F0F0EE' }}>
                        <div
                          className="h-1 rounded-full transition-all duration-500"
                          style={{ width: `${logPct * 100}%`, background: item.color || '#1B4332' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Entries */}
                  {entries.length > 0 && (
                    <div className="px-4 pb-2 pl-12 space-y-1">
                      {entries.map(e => (
                        <div key={e.id} className="flex items-center justify-between group/entry">
                          <div className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                            <span className="font-semibold" style={{ color: '#374151' }}>{fmt(e.amount)}</span>
                            {e.note && <span>— {e.note}</span>}
                            <span>{e.date}</span>
                          </div>
                          <button
                            onClick={() => deleteEntry(item.id, e.id)}
                            className="opacity-0 group-hover/entry:opacity-100 transition-opacity press-effect"
                            style={{ color: '#C4CDC7' }}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add entry form */}
                  <div className="px-4 pb-4 pl-12">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9CA3AF' }}>$</span>
                        <input
                          type="number" min="0"
                          value={form.amount || ''}
                          onChange={e => setEntryForms(f => ({ ...f, [formKey]: { ...f[formKey], amount: e.target.value } }))}
                          placeholder={`${Math.round(item.suggested / 2)}`}
                          className="w-full pl-6 pr-2 py-1.5 text-xs rounded-lg"
                          style={{ background: '#F9F8F6', border: '1.5px solid #E6E9E6', color: '#111827' }}
                        />
                      </div>
                      <input
                        value={form.note || ''}
                        onChange={e => setEntryForms(f => ({ ...f, [formKey]: { ...f[formKey], note: e.target.value } }))}
                        placeholder="Note"
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg"
                        style={{ background: '#F9F8F6', border: '1.5px solid #E6E9E6', color: '#111827' }}
                      />
                      <button
                        onClick={() => addEntry(item.id)}
                        disabled={!form.amount || Number(form.amount) <= 0}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium press-effect disabled:opacity-40"
                        style={{ background: '#1B4332', color: '#FFFFFF' }}
                      >
                        Log
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
