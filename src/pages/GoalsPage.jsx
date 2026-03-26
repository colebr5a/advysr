import { useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { CircularProgress } from '../components/ui/CircularProgress.jsx';
import { fmt } from '../utils/formatters.js';

const GOAL_TYPES = [
  { type: 'emergency_fund', label: 'Emergency Fund', icon: '🛡️', defaultAmount: 15000, color: '#6366f1' },
  { type: 'home_purchase', label: 'Home Purchase', icon: '🏠', defaultAmount: 50000, color: '#f59e0b' },
  { type: 'retirement', label: 'Retirement', icon: '🌴', defaultAmount: 500000, color: '#10b981' },
  { type: 'vacation', label: 'Vacation', icon: '✈️', defaultAmount: 5000, color: '#3b82f6' },
  { type: 'vehicle', label: 'New Vehicle', icon: '🚗', defaultAmount: 30000, color: '#8b5cf6' },
  { type: 'education', label: 'Education', icon: '🎓', defaultAmount: 20000, color: '#f97316' },
  { type: 'other', label: 'Other', icon: '⭐', defaultAmount: 10000, color: '#ec4899' },
];

let idCtr = 100;
let entryCtr = 1000;

function goalSaved(g) {
  return (g.contributions || []).reduce((s, c) => s + (c.amount || 0), 0);
}

export function GoalsPage({ profile, onProfileUpdate }) {
  const goals = profile.goals || [];
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState('other');
  // per-goal entry form state: { [goalId]: { amount: '', note: '' } }
  const [entryForms, setEntryForms] = useState({});

  function updateGoals(updated) {
    onProfileUpdate({ ...profile, goals: updated });
  }

  function addGoal() {
    const t = GOAL_TYPES.find(g => g.type === newType) || GOAL_TYPES[6];
    const goal = {
      id: `g${++idCtr}`,
      type: t.type,
      label: t.label,
      targetAmount: t.defaultAmount,
      targetMonths: 24,
      contributions: [],
      color: t.color,
      icon: t.icon,
    };
    updateGoals([...goals, goal]);
    setShowAdd(false);
  }

  function updateGoal(id, field, value) {
    updateGoals(goals.map(g => g.id === id ? { ...g, [field]: value } : g));
  }

  function deleteGoal(id) {
    updateGoals(goals.filter(g => g.id !== id));
  }

  function addContribution(goalId) {
    const form = entryForms[goalId] || {};
    const amount = Number(form.amount) || 0;
    if (amount <= 0) return;
    const entry = {
      id: `e${++entryCtr}`,
      amount,
      note: form.note || '',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    updateGoals(goals.map(g =>
      g.id === goalId
        ? { ...g, contributions: [...(g.contributions || []), entry] }
        : g
    ));
    setEntryForms(f => ({ ...f, [goalId]: { amount: '', note: '' } }));
  }

  function deleteContribution(goalId, entryId) {
    updateGoals(goals.map(g =>
      g.id === goalId
        ? { ...g, contributions: (g.contributions || []).filter(c => c.id !== entryId) }
        : g
    ));
  }

  const totalTargeted = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + goalSaved(g), 0);
  const overallPct = totalTargeted > 0 ? Math.min(1, totalSaved / totalTargeted) : 0;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Goals</h1>
          <p className="text-gray-500 text-sm mt-1">Track your financial milestones</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-colors"
        >
          + Add Goal
        </button>
      </div>

      {/* Summary bar */}
      {goals.length > 0 && (
        <Card className="flex items-center gap-6">
          <CircularProgress value={overallPct} size={80} strokeWidth={8} color="#2563eb">
            <div className="text-center">
              <p className="text-sm font-bold text-white">{Math.round(overallPct * 100)}%</p>
            </div>
          </CircularProgress>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-gray-300">Overall Progress</p>
            <div className="flex gap-6 text-sm flex-wrap">
              <span className="text-gray-500">Saved: <span className="font-semibold text-white">{fmt(totalSaved)}</span></span>
              <span className="text-gray-500">Target: <span className="font-semibold text-white">{fmt(totalTargeted)}</span></span>
              <span className="text-gray-500">Remaining: <span className="font-semibold text-white">{fmt(Math.max(0, totalTargeted - totalSaved))}</span></span>
            </div>
          </div>
        </Card>
      )}

      {/* Add Goal Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ background: '#2c2c2c', border: '1px solid #3a3a3a' }}>
            <h3 className="text-lg font-bold text-white mb-4">New Goal</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {GOAL_TYPES.map(t => (
                <button
                  key={t.type}
                  onClick={() => setNewType(t.type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${newType === t.type ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}
                >
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={addGoal} className="flex-1 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Goals */}
      {goals.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-semibold text-gray-300">No goals yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first financial goal to get started</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(g => {
            const saved = goalSaved(g);
            const pct = g.targetAmount > 0 ? Math.min(1, saved / g.targetAmount) : 0;
            const needed = Math.max(0, g.targetAmount - saved);
            const monthlyNeeded = g.targetMonths > 0 ? needed / g.targetMonths : 0;
            const goalType = GOAL_TYPES.find(t => t.type === g.type) || GOAL_TYPES[6];
            const color = g.color || goalType.color;
            const icon = g.icon || goalType.icon;
            const form = entryForms[g.id] || {};

            return (
              <Card key={g.id} className="relative group flex flex-col">
                {/* Delete goal */}
                <button
                  onClick={() => deleteGoal(g.id)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >✕</button>

                {/* Icon + editable label */}
                <div className="flex flex-col items-center text-center mb-3">
                  <p className="text-2xl mb-1">{icon}</p>
                  <input
                    value={g.label}
                    onChange={e => updateGoal(g.id, 'label', e.target.value)}
                    className="text-base font-semibold text-white text-center border-0 bg-transparent focus:outline-none focus:bg-gray-50 rounded px-1 w-full"
                  />
                </div>

                {/* Circular progress */}
                <div className="flex justify-center mb-4">
                  <CircularProgress value={pct} size={100} strokeWidth={9} color={color}>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{Math.round(pct * 100)}%</p>
                      <p className="text-xs text-gray-400">saved</p>
                    </div>
                  </CircularProgress>
                </div>

                {/* Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Saved</span>
                    <span className="font-semibold text-white">{fmt(saved)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Target</span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-xs">$</span>
                      <input
                        type="number" min="0"
                        value={g.targetAmount || ''}
                        onChange={e => updateGoal(g.id, 'targetAmount', Number(e.target.value) || 0)}
                        className="w-20 text-right font-semibold border border-gray-200 rounded-lg px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Timeline</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number" min="1"
                        value={g.targetMonths || ''}
                        onChange={e => updateGoal(g.id, 'targetMonths', Number(e.target.value) || 1)}
                        className="w-16 text-right font-semibold border border-gray-200 rounded-lg px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                      />
                      <span className="text-gray-400 text-xs">mo</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                    <span className="text-gray-500">Need/mo</span>
                    <span className="font-semibold" style={{ color }}>{fmt(monthlyNeeded)}</span>
                  </div>
                </div>

                {/* Journal entries */}
                {(g.contributions || []).length > 0 && (
                  <div className="border-t border-gray-100 pt-3 mb-3 space-y-1.5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Contributions</p>
                    {[...(g.contributions || [])].reverse().map(c => (
                      <div key={c.id} className="flex items-center justify-between group/entry">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-100">{fmt(c.amount)}</span>
                          {c.note && <span className="text-xs text-gray-400 ml-1">— {c.note}</span>}
                          <span className="text-xs text-gray-300 ml-1">{c.date}</span>
                        </div>
                        <button
                          onClick={() => deleteContribution(g.id, c.id)}
                          className="text-gray-200 hover:text-red-400 opacity-0 group-hover/entry:opacity-100 transition-opacity text-xs ml-1 flex-shrink-0"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Log contribution form */}
                <div className="mt-auto border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-400 mb-2">Log Contribution</p>
                  <div className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                      <input
                        type="number" min="0"
                        value={form.amount || ''}
                        onChange={e => setEntryForms(f => ({ ...f, [g.id]: { ...f[g.id], amount: e.target.value } }))}
                        placeholder="Amount"
                        className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400"
                      />
                    </div>
                    <button
                      onClick={() => addContribution(g.id)}
                      disabled={!form.amount || Number(form.amount) <= 0}
                      className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >Add</button>
                  </div>
                  <input
                    value={form.note || ''}
                    onChange={e => setEntryForms(f => ({ ...f, [g.id]: { ...f[g.id], note: e.target.value } }))}
                    placeholder="Note (optional)"
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400 text-gray-600"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
