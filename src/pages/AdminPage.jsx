import { useEffect, useState } from 'react'
import { fetchAllProfiles } from '../lib/profileService.js'
import { fmt } from '../utils/formatters.js'
import { totalExpenses, monthlySurplus } from '../utils/calculations.js'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtRelative(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return fmtDate(iso)
}

function StatTile({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}>
      <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: accent || '#111827' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{sub}</p>}
    </div>
  )
}

function UserDetail({ row, onBack }) {
  const p          = row.profile_data
  const expenses   = totalExpenses(p)
  const surplus    = monthlySurplus(p)
  const totalDebt  = (p.debts || []).reduce((s, d) => s + d.balance, 0)
  const totalAssets = (p.accounts || []).reduce((s, a) => s + (a.balance || 0), 0)
  const netWorth   = totalAssets - totalDebt

  return (
    <main className="px-4 pt-2 space-y-5 max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm press-effect"
        style={{ color: '#1B4332' }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        All users
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-lg" style={{ color: '#111827', wordBreak: 'break-all' }}>{row.email}</p>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
            Joined {fmtDate(row.created_at)} · Last seen {fmtRelative(row.last_seen)}
          </p>
        </div>
        <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: '#F0FAF4', color: '#1B4332', border: '1px solid #B7E4C7' }}>
          Onboarded
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Monthly Income"   value={fmt(p.monthlyIncome || 0)} />
        <StatTile label="Monthly Expenses" value={fmt(expenses)} />
        <StatTile label="Monthly Surplus"  value={fmt(Math.abs(surplus))} sub={surplus < 0 ? 'deficit' : 'surplus'} accent={surplus < 0 ? '#DC2626' : '#1B4332'} />
        <StatTile label="Risk Tolerance"   value={p.riskTolerance ? p.riskTolerance.charAt(0).toUpperCase() + p.riskTolerance.slice(1) : '—'} />
        <StatTile label="Total Assets"     value={fmt(totalAssets)} />
        <StatTile label="Total Debt"       value={fmt(totalDebt)}   accent={totalDebt > 0 ? '#DC2626' : undefined} />
        <StatTile label="Net Worth"        value={fmt(netWorth)}    accent={netWorth < 0 ? '#DC2626' : '#1B4332'} />
        <StatTile label="Goals"            value={(p.goals || []).length} />
      </div>

      {(p.accounts || []).length > 0 && (
        <div>
          <p className="font-semibold mb-3" style={{ color: '#111827' }}>Accounts</p>
          <div className="grid grid-cols-2 gap-2.5">
            {p.accounts.map(a => (
              <div key={a.id} className="rounded-xl p-3" style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}>
                <p className="text-xs truncate mb-1" style={{ color: '#9CA3AF' }}>{a.label}</p>
                <p className="font-bold text-sm" style={{ color: '#1B4332' }}>{fmt(a.balance || 0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(p.goals || []).length > 0 && (
        <div>
          <p className="font-semibold mb-3" style={{ color: '#111827' }}>Goals</p>
          <div className="space-y-2">
            {p.goals.map(g => {
              const saved = (g.contributions || []).reduce((s, c) => s + c.amount, 0)
              const pct   = g.targetAmount > 0 ? Math.min(100, Math.round(saved / g.targetAmount * 100)) : 0
              return (
                <div key={g.id} className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: '#F9F8F6', border: '1px solid #E6E9E6' }}>
                  <span className="text-base">{g.icon || '🎯'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: '#111827' }}>{g.label}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 rounded-full h-1" style={{ background: '#E6E9E6' }}>
                        <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: '#1B4332' }} />
                      </div>
                      <span className="text-xs flex-shrink-0" style={{ color: '#9CA3AF' }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: '#1B4332' }}>{fmt(saved)}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>of {fmt(g.targetAmount)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}

export function AdminPage() {
  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    fetchAllProfiles()
      .then(setRows)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: '#E6E9E6', borderTopColor: '#1B4332' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 pt-4 max-w-2xl mx-auto">
        <div className="rounded-2xl p-5" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <p className="font-semibold" style={{ color: '#DC2626' }}>Error loading users</p>
          <p className="text-sm mt-1" style={{ color: '#DC2626' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (selected) return <UserDetail row={selected} onBack={() => setSelected(null)} />

  const onboarded     = rows.filter(r => r.profile_data != null)
  const notOnboarded  = rows.filter(r => r.profile_data == null)
  const recentlyActive = rows.filter(r => {
    if (!r.last_seen) return false
    return Date.now() - new Date(r.last_seen).getTime() < 7 * 24 * 60 * 60 * 1000
  }).length

  const filtered = rows.filter(r =>
    !search || r.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="px-4 pt-3 space-y-4 max-w-2xl mx-auto">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Total Users"     value={rows.length} />
        <StatTile label="Onboarded"       value={onboarded.length}    sub={`${Math.round(onboarded.length / Math.max(rows.length, 1) * 100)}% of users`} accent="#1B4332" />
        <StatTile label="Pending"         value={notOnboarded.length} accent="#D97706" />
        <StatTile label="Active (7 days)" value={recentlyActive}      accent="#2D6A4F" />
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email…"
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl"
          style={{ background: '#FFFFFF', border: '1.5px solid #E6E9E6', color: '#111827' }}
        />
      </div>

      {/* User list */}
      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm" style={{ color: '#9CA3AF' }}>No users found</p>
        )}
        {filtered.map(row => (
          <div
            key={row.id}
            className="flex items-center gap-3 p-4 rounded-2xl press-effect"
            style={{ background: '#FFFFFF', border: '1px solid #E6E9E6', cursor: row.profile_data ? 'pointer' : 'default' }}
            onClick={() => row.profile_data && setSelected(row)}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: row.profile_data ? '#F0FAF4' : '#F9F8F6' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={row.profile_data ? '#1B4332' : '#9CA3AF'} strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#111827' }}>{row.email}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                {fmtDate(row.created_at)} · {fmtRelative(row.last_seen)}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: row.profile_data ? '#F0FAF4' : '#F9F8F6',
                  color: row.profile_data ? '#1B4332' : '#9CA3AF',
                  border: `1px solid ${row.profile_data ? '#B7E4C7' : '#E6E9E6'}`,
                }}
              >
                {row.profile_data ? 'Active' : 'Pending'}
              </span>
              {row.profile_data && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#C4CDC7" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
