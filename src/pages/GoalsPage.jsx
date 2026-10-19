import { useState, useMemo } from 'react';
import { CircularProgress } from '../components/ui/CircularProgress.jsx';
import { fmt } from '../utils/formatters.js';
import { FREE_LIMITS } from '../lib/premiumService.js';
import { Disclaimer } from '../components/ui/Disclaimer.jsx';
import { runMonteCarlo } from '../utils/monteCarlo.js';
import { getRiskAssumptions } from '../utils/riskAssumptions.js';

const GOAL_TYPES = [
  { type: 'emergency_fund', label: 'Emergency Fund', icon: '🛡️', defaultAmount: 15000, color: '#1B4332' },
  { type: 'home_purchase',  label: 'Home Purchase',  icon: '🏠', defaultAmount: 50000, color: '#2D6A4F' },
  { type: 'retirement',     label: 'Retirement',     icon: '🌴', defaultAmount: 500000, color: '#40916C' },
  { type: 'vacation',       label: 'Vacation',       icon: '✈️', defaultAmount: 5000,  color: '#52B788' },
  { type: 'vehicle',        label: 'New Vehicle',    icon: '🚗', defaultAmount: 30000, color: '#6366f1' },
  { type: 'education',      label: 'Education',      icon: '🎓', defaultAmount: 20000, color: '#f59e0b' },
  { type: 'other',          label: 'Other',          icon: '⭐', defaultAmount: 10000, color: '#9CA3AF' },
];

let idCtr = 100;
let entryCtr = 1000;

function goalSaved(g) {
  return (g.contributions || []).reduce((s, c) => s + (c.amount || 0), 0);
}

export function GoalsPage({ profile, onProfileUpdate, isPremium, onShowUpgrade }) {
  const goals = useMemo(() => profile.goals || [], [profile.goals]);
  const [showAdd, setShowAdd]     = useState(false);
  const [newType, setNewType]     = useState('emergency_fund');
  const [entryForms, setEntryForms] = useState({});

  const { meanReturn, stdDev } = getRiskAssumptions(profile.riskTolerance);

  // Projects each goal forward with a Monte Carlo simulation: assumed monthly
  // contribution is the user's actual recent average (or, with no history yet,
  // the pace required to hit the target on schedule), run through `months` of
  // randomly-drawn returns at the user's risk-tolerance assumptions.
  const projections = useMemo(() => {
    const map = {};
    for (const g of goals) {
      if (!(g.targetMonths > 0)) continue;
      const saved = goalSaved(g);
      const contributions = g.contributions || [];
      const monthlyContribution = contributions.length > 0
        ? saved / contributions.length
        : Math.max(0, (g.targetAmount - saved) / g.targetMonths);
      map[g.id] = {
        ...runMonteCarlo({
          startingAmount: saved,
          monthlyContribution,
          months: g.targetMonths,
          meanReturn,
          stdDev,
          targetAmount: g.targetAmount,
        }),
        monthlyContribution,
      };
    }
    return map;
  }, [goals, meanReturn, stdDev]);

  function updateGoals(updated) { onProfileUpdate({ ...profile, goals: updated }); }

  function addGoal() {
    const t = GOAL_TYPES.find(g => g.type === newType) || GOAL_TYPES[6];
    updateGoals([...goals, {
      id: `g${++idCtr}`,
      type: t.type,
      label: t.label,
      targetAmount: t.defaultAmount,
      targetMonths: 24,
      contributions: [],
      color: t.color,
      icon: t.icon,
    }]);
    setShowAdd(false);
  }

  function updateGoal(id, field, value) {
    updateGoals(goals.map(g => g.id === id ? { ...g, [field]: value } : g));
  }

  function deleteGoal(id) { updateGoals(goals.filter(g => g.id !== id)); }

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
      g.id === goalId ? { ...g, contributions: [...(g.contributions || []), entry] } : g
    ));
    setEntryForms(f => ({ ...f, [goalId]: { amount: '', note: '' } }));
  }

  function deleteContribution(goalId, entryId) {
    updateGoals(goals.map(g =>
      g.id === goalId ? { ...g, contributions: (g.contributions || []).filter(c => c.id !== entryId) } : g
    ));
  }

  const totalTargeted = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved    = goals.reduce((s, g) => s + goalSaved(g), 0);
  const overallPct    = totalTargeted > 0 ? Math.min(1, totalSaved / totalTargeted) : 0;

  return (
    <main className="px-4 pt-3 space-y-4 max-w-2xl mx-auto">

      {/* Add Goal FAB */}
      <button
        onClick={() => {
          if (!isPremium && goals.length >= FREE_LIMITS.goals) {
            onShowUpgrade('goals');
          } else {
            setShowAdd(true);
          }
        }}
        className="fixed right-4 z-10 w-12 h-12 rounded-full flex items-center justify-center press-effect"
        style={{
          bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)',
          background: '#1B4332',
          color: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(27,67,50,0.35)',
        }}
        aria-label="Add Goal"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {/* Free tier notice */}
      {!isPremium && goals.length >= FREE_LIMITS.goals && (
        <div
          className="flex items-center justify-between px-3 py-2 rounded-xl"
          style={{ background: '#F9F8F6', border: '1px solid #E6E9E6' }}
        >
          <p className="text-xs" style={{ color: '#6B7280' }}>
            Free plan: {FREE_LIMITS.goals} goals max
          </p>
          <button onClick={() => onShowUpgrade('goals')} className="text-xs font-semibold press-effect" style={{ color: '#1B4332' }}>
            Upgrade →
          </button>
        </div>
      )}

      {/* Overall progress */}
      {goals.length > 0 && (
        <div
          className="rounded-2xl p-5 flex items-center gap-5"
          style={{ background: '#1B4332' }}
        >
          <CircularProgress value={overallPct} size={72} strokeWidth={6} color="#74C69D">
            <p className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
              {Math.round(overallPct * 100)}%
            </p>
          </CircularProgress>
          <div className="flex-1">
            <p className="text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Overall Progress</p>
            <div className="flex gap-4 flex-wrap">
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Saved</p>
                <p className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>{fmt(totalSaved)}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Target</p>
                <p className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>{fmt(totalTargeted)}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Remaining</p>
                <p className="text-sm font-semibold" style={{ color: '#74C69D' }}>{fmt(Math.max(0, totalTargeted - totalSaved))}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(13,31,23,0.4)' }}>
          <div
            className="w-full rounded-t-3xl p-6"
            style={{ background: '#FFFFFF', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="flex justify-center mb-5">
              <div className="w-10 h-1 rounded-full" style={{ background: '#E6E9E6' }} />
            </div>
            <p className="font-semibold text-lg mb-4" style={{ color: '#111827' }}>New Goal</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {GOAL_TYPES.map(t => (
                <button
                  key={t.type}
                  onClick={() => setNewType(t.type)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left press-effect"
                  style={{
                    background: newType === t.type ? '#F0FAF4' : '#F9F8F6',
                    border: `1.5px solid ${newType === t.type ? '#1B4332' : '#E6E9E6'}`,
                    color: newType === t.type ? '#1B4332' : '#374151',
                  }}
                >
                  <span className="text-base">{t.icon}</span>
                  <span className="font-medium">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium press-effect"
                style={{ background: '#F9F8F6', border: '1.5px solid #E6E9E6', color: '#374151' }}
              >
                Cancel
              </button>
              <button
                onClick={addGoal}
                className="flex-1 py-3 rounded-xl text-sm font-semibold press-effect"
                style={{ background: '#1B4332', color: '#FFFFFF' }}
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals list */}
      {goals.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}
        >
          <p className="text-3xl mb-3">🎯</p>
          <p className="font-semibold mb-1" style={{ color: '#111827' }}>No goals yet</p>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Tap "Add Goal" to start tracking your milestones</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map(g => {
            const saved    = goalSaved(g);
            const pct      = g.targetAmount > 0 ? Math.min(1, saved / g.targetAmount) : 0;
            const needed   = Math.max(0, g.targetAmount - saved);
            const monthlyN = g.targetMonths > 0 ? needed / g.targetMonths : 0;
            const gType    = GOAL_TYPES.find(t => t.type === g.type) || GOAL_TYPES[6];
            const color    = g.color || gType.color;
            const icon     = g.icon || gType.icon;
            const form     = entryForms[g.id] || {};
            const proj     = projections[g.id];

            return (
              <div
                key={g.id}
                className="rounded-2xl p-5 relative group flex flex-col"
                style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}
              >
                <button
                  onClick={() => deleteGoal(g.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity press-effect"
                  style={{ color: '#C4CDC7' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Icon + label */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: color + '18' }}
                  >
                    {icon}
                  </div>
                  <input
                    value={g.label}
                    onChange={e => updateGoal(g.id, 'label', e.target.value)}
                    className="font-semibold bg-transparent border-0 flex-1 min-w-0"
                    style={{ color: '#111827', outline: 'none', fontSize: '15px' }}
                  />
                </div>

                {/* Circular progress */}
                <div className="flex items-center gap-4 mb-4">
                  <CircularProgress value={pct} size={72} strokeWidth={6} color={color}>
                    <p className="text-sm font-bold" style={{ color: '#111827' }}>{Math.round(pct * 100)}%</p>
                  </CircularProgress>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#9CA3AF' }}>Saved</span>
                      <span className="font-semibold" style={{ color: '#111827' }}>{fmt(saved)}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span style={{ color: '#9CA3AF' }}>Target</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>$</span>
                        <input
                          type="number" min="0"
                          value={g.targetAmount || ''}
                          onChange={e => updateGoal(g.id, 'targetAmount', Number(e.target.value) || 0)}
                          className="w-20 text-right font-semibold rounded-lg px-2 py-0.5 text-sm"
                          style={{ border: '1.5px solid #E6E9E6', color: '#111827', background: '#F9F8F6', outline: 'none' }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span style={{ color: '#9CA3AF' }}>Timeline</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number" min="1"
                          value={g.targetMonths || ''}
                          onChange={e => updateGoal(g.id, 'targetMonths', Number(e.target.value) || 1)}
                          className="w-14 text-right font-semibold rounded-lg px-2 py-0.5 text-sm"
                          style={{ border: '1.5px solid #E6E9E6', color: '#111827', background: '#F9F8F6', outline: 'none' }}
                        />
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>mo</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm pt-1" style={{ borderTop: '1px solid #F3F4F3' }}>
                      <span style={{ color: '#9CA3AF' }}>Need/mo</span>
                      <span className="font-semibold" style={{ color }}>{fmt(monthlyN)}</span>
                    </div>
                  </div>
                </div>

                {/* Monte Carlo projection */}
                {proj && (() => {
                  const chance = proj.probabilityOfSuccess;
                  const tone = chance >= 0.66
                    ? { bg: '#F0FAF4', fg: '#1B4332' }
                    : chance >= 0.33
                    ? { bg: '#FFFBEB', fg: '#B45309' }
                    : { bg: '#FEF2F2', fg: '#B91C1C' };
                  return (
                    <div className="rounded-xl px-3 py-2.5 mb-3" style={{ background: tone.bg }}>
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: '#6B7280' }}>Est. chance of hitting goal</span>
                        <span className="font-semibold" style={{ color: tone.fg }}>{Math.round(chance * 100)}%</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                        Simulated from {fmt(proj.monthlyContribution)}/mo at {Math.round(meanReturn * 100)}% avg. return — median outcome {fmt(proj.p50)}
                      </p>
                    </div>
                  );
                })()}

                {/* Contributions */}
                {(g.contributions || []).length > 0 && (
                  <div className="mb-3 space-y-1" style={{ borderTop: '1px solid #F3F4F3', paddingTop: '12px' }}>
                    <p className="text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>Contributions</p>
                    {[...(g.contributions || [])].reverse().map(c => (
                      <div key={c.id} className="flex items-center justify-between group/entry">
                        <div className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                          <span className="font-semibold" style={{ color: '#374151' }}>{fmt(c.amount)}</span>
                          {c.note && <span>— {c.note}</span>}
                          <span>{c.date}</span>
                        </div>
                        <button
                          onClick={() => deleteContribution(g.id, c.id)}
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

                {/* Add contribution */}
                <div className="mt-auto pt-3" style={{ borderTop: '1px solid #F3F4F3' }}>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9CA3AF' }}>$</span>
                      <input
                        type="number" min="0"
                        value={form.amount || ''}
                        onChange={e => setEntryForms(f => ({ ...f, [g.id]: { ...f[g.id], amount: e.target.value } }))}
                        placeholder="Amount"
                        className="w-full pl-6 pr-2 py-2 text-sm rounded-xl"
                        style={{ background: '#F9F8F6', border: '1.5px solid #E6E9E6', color: '#111827' }}
                      />
                    </div>
                    <input
                      value={form.note || ''}
                      onChange={e => setEntryForms(f => ({ ...f, [g.id]: { ...f[g.id], note: e.target.value } }))}
                      placeholder="Note"
                      className="flex-1 px-3 py-2 text-sm rounded-xl"
                      style={{ background: '#F9F8F6', border: '1.5px solid #E6E9E6', color: '#111827' }}
                    />
                    <button
                      onClick={() => addContribution(g.id)}
                      disabled={!form.amount || Number(form.amount) <= 0}
                      className="px-3 py-2 rounded-xl text-sm font-medium press-effect disabled:opacity-40"
                      style={{ background: '#1B4332', color: '#FFFFFF' }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {goals.length > 0 && <Disclaimer className="pt-1 pb-2" />}
    </main>
  );
}
