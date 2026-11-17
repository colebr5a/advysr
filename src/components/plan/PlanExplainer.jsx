import { useState } from 'react';
import { fmt } from '../../utils/formatters.js';
import { TaxDetailsForm } from './TaxDetailsForm.jsx';

const CHOICE_LABEL = { roth: 'Roth', traditional: 'Traditional', split: 'Split Roth / traditional' };

function TaxDetailsSheet({ profile, onSave, onClose }) {
  const [value, setValue] = useState({ taxes: profile.taxes, retirement401k: profile.retirement401k });
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(13,31,23,0.4)' }} onClick={onClose} />
      <div role="dialog" aria-label="Taxes and retirement"
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl sim-enter max-h-[88vh] overflow-y-auto md:max-w-lg md:mx-auto"
        style={{ background: '#FFFFFF', padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: '#E6E9E6' }} />
        <p className="font-semibold text-lg mb-1" style={{ color: '#111827' }}>Taxes & retirement</p>
        <p className="text-sm mb-5" style={{ color: '#6B7280' }}>Sharpens your 401(k), IRA, and Roth vs traditional advice.</p>
        <TaxDetailsForm value={value} onChange={setValue} />
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium press-effect"
            style={{ border: '1.5px solid #E6E9E6', color: '#374151' }}>Cancel</button>
          <button onClick={() => onSave(value)} className="flex-1 py-3 rounded-xl text-sm font-semibold press-effect"
            style={{ background: '#1B4332', color: '#FFFFFF' }}>Save</button>
        </div>
      </div>
    </>
  );
}

function StatusChip({ status }) {
  if (status === 'needs_info') {
    return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FEF3E2', color: '#92400E' }}>Needs info</span>;
  }
  if (status === 'complete') {
    return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#E8F5EE', color: '#1B4332' }}>✓ Done</span>;
  }
  return null;
}

function Step({ item, index, open, onToggle, onAddInfo }) {
  return (
    <li className="rounded-xl" style={{ background: open ? '#F7F8F6' : 'transparent', transition: 'background 200ms' }}>
      <button onClick={onToggle} aria-expanded={open}
        className="w-full flex items-center gap-3 px-3 py-3 text-left press-effect">
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
          style={item.status === 'complete'
            ? { background: '#E8F5EE', color: '#1B4332' }
            : { background: '#1B4332', color: '#FFFFFF' }}>
          {item.status === 'complete' ? '✓' : index}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: '#111827' }}>{item.title}</p>
          {!open && <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{item.rationale}</p>}
        </div>
        <StatusChip status={item.status} />
        {item.monthlyAmount > 0 && (
          <span className="text-sm font-semibold flex-shrink-0" style={{ color: '#111827' }}>{fmt(item.monthlyAmount)}<span className="text-xs font-normal" style={{ color: '#9CA3AF' }}>/mo</span></span>
        )}
        <svg className="w-4 h-4 flex-shrink-0 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <div className="px-3 pb-4 pl-12 space-y-3">
            <p className="text-sm" style={{ color: '#374151' }}>{item.detail}</p>
            {item.why?.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#9CA3AF' }}>Why</p>
                <ul className="space-y-1.5">
                  {item.why.map((w, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: '#4B5563' }}>
                      <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#52B788' }} />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {item.facts?.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg p-3" style={{ background: '#FFFFFF', border: '1px solid #EEF0EE' }}>
                {item.facts.map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <p className="text-[10.5px]" style={{ color: '#9CA3AF' }}>{k}</p>
                    <p className="text-xs font-medium truncate" style={{ color: '#111827' }}>{v}</p>
                  </div>
                ))}
              </div>
            )}
            {item.status === 'needs_info' && (
              <button onClick={onAddInfo} className="text-xs font-semibold press-effect" style={{ color: '#2D6A4F' }}>
                Add your 401(k) details →
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/** "Why this plan": the advice engine's steps and decision trace, explained. */
export function PlanExplainer({ result, profile, onProfileUpdate }) {
  const [openId, setOpenId] = useState(null);
  const [sheet, setSheet] = useState(false);
  const [showSkipped, setShowSkipped] = useState(false);

  const active = result.advice.filter(a => a.status !== 'complete');
  const done = result.advice.filter(a => a.status === 'complete');
  const adviceIds = new Set(result.advice.map(a => a.ruleId));
  const skipped = result.trace.filter(t => !t.fired && !adviceIds.has(t.ruleId));
  const tax = result.tax;

  function save(value) {
    onProfileUpdate({ ...profile, taxes: value.taxes, retirement401k: value.retirement401k });
    setSheet(false);
  }

  return (
    <section className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <p className="font-semibold" style={{ color: '#111827' }}>Your plan, explained</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Each step, in priority order, and why it's there. Tap one for the reasoning.</p>
        </div>
      </div>

      {/* Tax snapshot */}
      {tax ? (
        <div className="flex flex-wrap items-center gap-2 mt-3 mb-2">
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#F0FAF4', color: '#1B4332' }}>
            {Math.round(tax.marginalRate * 100)}% federal bracket
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#F7F8F6', color: '#374151' }}>
            {(tax.effectiveRate * 100).toFixed(1)}% effective
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#F7F8F6', color: '#374151' }}
            title={tax.accountReason}>
            Leans {CHOICE_LABEL[tax.accountChoice]}
          </span>
          <button onClick={() => setSheet(true)} className="text-xs font-medium ml-auto press-effect" style={{ color: '#2D6A4F' }}>Edit</button>
        </div>
      ) : (
        <button onClick={() => setSheet(true)}
          className="w-full flex items-center justify-between gap-3 mt-3 mb-2 px-3.5 py-3 rounded-xl text-left press-effect"
          style={{ background: '#FEF8EC', border: '1px solid #FDE7C2' }}>
          <span>
            <span className="block text-sm font-medium" style={{ color: '#92400E' }}>Add salary & 401(k) details</span>
            <span className="block text-xs mt-0.5" style={{ color: '#B45309' }}>Unlocks your employer match, tax bracket, and Roth vs traditional</span>
          </span>
          <span className="text-sm" style={{ color: '#92400E' }}>→</span>
        </button>
      )}
      {tax && <p className="text-xs leading-relaxed mb-2" style={{ color: '#6B7280' }}>{tax.accountReason}</p>}

      <ol className="-mx-2">
        {active.map((a, i) => (
          <Step key={a.ruleId} item={a} index={i + 1} open={openId === a.ruleId}
            onToggle={() => setOpenId(openId === a.ruleId ? null : a.ruleId)} onAddInfo={() => setSheet(true)} />
        ))}
      </ol>

      {done.length > 0 && (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-wide mt-3 mb-1" style={{ color: '#9CA3AF' }}>Already done</p>
          <ol className="-mx-2">
            {done.map(a => (
              <Step key={a.ruleId} item={a} open={openId === a.ruleId}
                onToggle={() => setOpenId(openId === a.ruleId ? null : a.ruleId)} />
            ))}
          </ol>
        </>
      )}

      {skipped.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #F3F4F3' }}>
          <button onClick={() => setShowSkipped(v => !v)} className="text-xs font-medium press-effect" style={{ color: '#6B7280' }}>
            {showSkipped ? 'Hide' : 'Show'} rules that didn't apply ({skipped.length})
          </button>
          {showSkipped && (
            <ul className="mt-2 space-y-1.5 sim-enter">
              {skipped.map(t => (
                <li key={t.ruleId} className="text-xs leading-snug">
                  <span className="font-medium" style={{ color: '#374151' }}>{t.title}</span>
                  <span className="block" style={{ color: '#9CA3AF' }}>{t.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-[10.5px] mt-4" style={{ color: '#C4CDC7' }}>
        Uses {result.year} federal tax brackets and contribution limits{tax?.approximate ? ' (latest published)' : ''}. Educational only, not tax advice.
      </p>

      {sheet && <TaxDetailsSheet profile={profile} onSave={save} onClose={() => setSheet(false)} />}
    </section>
  );
}
