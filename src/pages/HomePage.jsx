import { useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { CircularProgress } from '../components/ui/CircularProgress.jsx';
import { fmt } from '../utils/formatters.js';
import { totalExpenses, monthlySurplus } from '../utils/calculations.js';
import { runAdviceEngine } from '../engine/adviceEngine.js';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DEFAULT_ACCOUNTS = [
  { id: 'checking', label: 'Checking Account', balance: 0 },
  { id: 'savings', label: 'High-Yield Savings', balance: 0 },
  { id: 'roth', label: 'Roth IRA', balance: 0 },
  { id: 'brokerage', label: 'Brokerage Account', balance: 0 },
];

let accId = 10;
let entryCtr = 5000;

export function HomePage({ profile, onProfileUpdate }) {
  const currentMonthIndex = new Date().getMonth();
  const [activeMonth, setActiveMonth] = useState(currentMonthIndex);
  // per-item entry forms: { [monthKey_ruleId]: { amount: '', note: '' } }
  const [entryForms, setEntryForms] = useState({});

  const accounts = profile.accounts || DEFAULT_ACCOUNTS;
  function updateAccounts(updated) {
    onProfileUpdate({ ...profile, accounts: updated });
  }

  const totalAssets = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const totalDebt = (profile.debts || []).reduce((s, d) => s + d.balance, 0);
  const netWorth = totalAssets - totalDebt;

  const monthlyData = profile.monthlyData || {};
  const monthKey = `${new Date().getFullYear()}-${String(activeMonth + 1).padStart(2, '0')}`;

  const result = runAdviceEngine(profile);
  const surplus = Math.max(0, monthlySurplus(profile));

  const allocationItems = result.allocations
    .filter(a => a.monthlyAmount > 0 && a.ruleId !== 'buffer')
    .map(a => ({ id: a.ruleId, label: a.label, suggested: Math.round(a.monthlyAmount), color: a.color }));

  // monthlyData[monthKey][ruleId] = { checked: bool, entries: [{ id, amount, note, date }] }
  const monthChecks = monthlyData[monthKey] || {};

  function itemEntries(ruleId) {
    return monthChecks[ruleId]?.entries || [];
  }
  function itemTotal(ruleId) {
    return itemEntries(ruleId).reduce((s, e) => s + (e.amount || 0), 0);
  }

  function updateMonthItem(ruleId, updates) {
    const updated = {
      ...monthlyData,
      [monthKey]: {
        ...monthChecks,
        [ruleId]: { ...(monthChecks[ruleId] || { entries: [] }), ...updates }
      }
    };
    onProfileUpdate({ ...profile, monthlyData: updated });
  }

  function toggleCheck(ruleId) {
    const current = monthChecks[ruleId]?.checked || false;
    updateMonthItem(ruleId, { checked: !current });
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
    const newTotal = newEntries.reduce((s, e) => s + e.amount, 0);
    const suggested = allocationItems.find(i => i.id === ruleId)?.suggested || 0;
    updateMonthItem(ruleId, {
      entries: newEntries,
      checked: newTotal >= suggested,
    });
    setEntryForms(f => ({ ...f, [formKey]: { amount: '', note: '' } }));
  }

  function deleteEntry(ruleId, entryId) {
    const existing = monthChecks[ruleId] || { entries: [] };
    const newEntries = (existing.entries || []).filter(e => e.id !== entryId);
    const newTotal = newEntries.reduce((s, e) => s + e.amount, 0);
    const suggested = allocationItems.find(i => i.id === ruleId)?.suggested || 0;
    updateMonthItem(ruleId, {
      entries: newEntries,
      checked: newTotal >= suggested,
    });
  }

  const totalAllocated = allocationItems.reduce((s, item) => {
    return s + (monthChecks[item.id]?.checked ? itemTotal(item.id) : 0);
  }, 0);
  const totalLogged = allocationItems.reduce((s, item) => s + itemTotal(item.id), 0);
  const allocationProgress = surplus > 0 ? Math.min(1, totalLogged / surplus) : 0;
  const checkedCount = allocationItems.filter(i => monthChecks[i.id]?.checked).length;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Net Worth Hero */}
      <Card className="bg-gradient-to-br from-primary-600 to-primary-700 !border-0 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-200 text-sm font-medium mb-1">Total Net Worth</p>
            <p className={`text-5xl font-bold ${netWorth < 0 ? 'text-red-300' : 'text-white'}`}>{fmt(netWorth)}</p>
            <div className="flex gap-6 mt-3 text-sm text-primary-200">
              <span>Assets: <span className="text-white font-semibold">{fmt(totalAssets)}</span></span>
              <span>Debt: <span className="text-white font-semibold">{fmt(totalDebt)}</span></span>
            </div>
          </div>
          <div className="text-right text-primary-200 text-sm">
            <p>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </Card>

      {/* Account Buckets */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-900">Accounts</h2>
          <button
            onClick={() => updateAccounts([...accounts, { id: `acc${++accId}`, label: 'New Account', balance: 0 }])}
            className="text-sm text-primary-600 hover:underline font-medium"
          >+ Add Account</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {accounts.map((acc, i) => (
            <Card key={acc.id} className="!p-4 relative group">
              <button
                onClick={() => updateAccounts(accounts.filter((_, j) => j !== i))}
                className="absolute top-2 right-2 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >✕</button>
              <input
                value={acc.label}
                onChange={e => { const a = [...accounts]; a[i] = { ...a[i], label: e.target.value }; updateAccounts(a); }}
                className="text-xs font-medium text-gray-500 w-full border-0 bg-transparent focus:outline-none focus:bg-gray-50 rounded px-0 mb-2 truncate"
              />
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={acc.balance || ''}
                  onChange={e => { const a = [...accounts]; a[i] = { ...a[i], balance: Number(e.target.value) || 0 }; updateAccounts(a); }}
                  placeholder="0"
                  className="w-full pl-4 text-xl font-bold text-gray-900 border-0 bg-transparent focus:outline-none focus:bg-gray-50 rounded"
                />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Month Tabs + Allocation */}
      <div>
        <div className="flex gap-1 overflow-x-auto pb-1 mb-4">
          {MONTHS.map((m, idx) => (
            <button
              key={m}
              onClick={() => setActiveMonth(idx)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                idx === activeMonth
                  ? 'bg-primary-600 text-white'
                  : idx === currentMonthIndex
                  ? 'border-2 border-primary-300 text-primary-600'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {m.slice(0, 3)}
            </button>
          ))}
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {MONTHS[activeMonth]} — Monthly Surplus Allocation
          {activeMonth === currentMonthIndex && (
            <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-medium">Current Month</span>
          )}
        </h2>

        {surplus <= 0 ? (
          <Card className="text-center py-8 text-gray-400">
            <p className="font-medium">No surplus to allocate</p>
            <p className="text-sm mt-1">Your expenses equal or exceed your income. Reduce expenses to free up money.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Checklist */}
            <div className="lg:col-span-2 space-y-3">
              {allocationItems.map(item => {
                const check = monthChecks[item.id] || {};
                const entries = itemEntries(item.id);
                const logged = itemTotal(item.id);
                const isChecked = check.checked || false;
                const formKey = `${monthKey}_${item.id}`;
                const form = entryForms[formKey] || {};
                const logPct = item.suggested > 0 ? Math.min(1, logged / item.suggested) : 0;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border-2 transition-all overflow-hidden ${isChecked ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white'}`}
                  >
                    {/* Main row */}
                    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                      <button
                        onClick={() => toggleCheck(item.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'}`}
                      >
                        {isChecked && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                          </svg>
                        )}
                      </button>
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${isChecked ? 'text-green-800' : 'text-gray-800'}`}>{item.label}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all"
                              style={{ width: `${logPct * 100}%`, background: item.color }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {fmt(logged)} / {fmt(item.suggested)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Journal entries */}
                    {entries.length > 0 && (
                      <div className="px-4 pb-2 space-y-1">
                        {entries.map(e => (
                          <div key={e.id} className="flex items-center justify-between group/entry pl-9">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="font-semibold text-gray-700">{fmt(e.amount)}</span>
                              {e.note && <span className="text-gray-400">— {e.note}</span>}
                              <span className="text-gray-300">{e.date}</span>
                            </div>
                            <button
                              onClick={() => deleteEntry(item.id, e.id)}
                              className="text-gray-200 hover:text-red-400 opacity-0 group-hover/entry:opacity-100 transition-opacity text-xs"
                            >✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add entry form */}
                    <div className="px-4 pb-4 pl-13">
                      <div className="flex gap-2 pl-9">
                        <div className="relative flex-1">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                          <input
                            type="number" min="0"
                            value={form.amount || ''}
                            onChange={e => setEntryForms(f => ({ ...f, [formKey]: { ...f[formKey], amount: e.target.value } }))}
                            placeholder={`e.g. ${Math.round(item.suggested / 2)}`}
                            className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400"
                          />
                        </div>
                        <input
                          value={form.note || ''}
                          onChange={e => setEntryForms(f => ({ ...f, [formKey]: { ...f[formKey], note: e.target.value } }))}
                          placeholder="Note"
                          className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400"
                        />
                        <button
                          onClick={() => addEntry(item.id)}
                          disabled={!form.amount || Number(form.amount) <= 0}
                          className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                        >Log</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress sidebar */}
            <div className="space-y-4">
              <Card className="flex flex-col items-center py-6">
                <p className="text-sm font-medium text-gray-500 mb-4">Monthly Progress</p>
                <CircularProgress value={allocationProgress} size={120} strokeWidth={10} color="#2563eb">
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">{Math.round(allocationProgress * 100)}%</p>
                    <p className="text-xs text-gray-400">logged</p>
                  </div>
                </CircularProgress>
                <div className="mt-4 w-full space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Surplus</span>
                    <span className="font-semibold">{fmt(surplus)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Logged</span>
                    <span className="font-semibold text-primary-600">{fmt(totalLogged)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2">
                    <span className="text-gray-500">Remaining</span>
                    <span className={`font-semibold ${surplus - totalLogged < 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {fmt(Math.max(0, surplus - totalLogged))}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">{checkedCount} of {allocationItems.length} complete</p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
