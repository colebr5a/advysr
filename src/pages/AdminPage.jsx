import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card.jsx'
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
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return fmtDate(iso)
}

function StatCard({ label, value, color = 'text-white', sub }) {
  return (
    <Card className="!p-5">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </Card>
  )
}

function UserDetail({ row, onBack }) {
  const p = row.profile_data
  const expenses   = totalExpenses(p)
  const surplus    = monthlySurplus(p)
  const totalDebt  = (p.debts || []).reduce((s, d) => s + d.balance, 0)
  const totalAssets= (p.accounts || []).reduce((s, a) => s + (a.balance || 0), 0)
  const netWorth   = totalAssets - totalDebt

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <button onClick={onBack} className="text-sm text-primary-600 hover:underline font-medium flex items-center gap-1">
        ← Back to all users
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{row.email}</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Joined {fmtDate(row.created_at)} · Last seen {fmtRelative(row.last_seen)}
          </p>
        </div>
        <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Onboarded</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Monthly Income"   value={fmt(p.monthlyIncome || 0)} />
        <StatCard label="Monthly Expenses" value={fmt(expenses)} />
        <StatCard
          label="Monthly Surplus"
          value={fmt(Math.abs(surplus))}
          color={surplus < 0 ? 'text-red-500' : 'text-green-600'}
          sub={surplus < 0 ? 'deficit' : 'surplus'}
        />
        <StatCard label="Risk Tolerance" value={p.riskTolerance ? p.riskTolerance.charAt(0).toUpperCase() + p.riskTolerance.slice(1) : '—'} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Assets" value={fmt(totalAssets)} />
        <StatCard label="Total Debt"   value={fmt(totalDebt)} color={totalDebt > 0 ? 'text-red-500' : 'text-white'} />
        <StatCard label="Net Worth"    value={fmt(netWorth)}   color={netWorth < 0 ? 'text-red-500' : 'text-white'} />
        <StatCard label="Goals"        value={(p.goals || []).length} />
      </div>

      {(p.accounts || []).length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-white mb-3">Accounts</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {p.accounts.map(a => (
              <Card key={a.id} className="!p-4">
                <p className="text-xs text-gray-500 truncate mb-1">{a.label}</p>
                <p className="font-bold text-white">{fmt(a.balance || 0)}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(p.goals || []).length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-white mb-3">Goals</h3>
          <div className="space-y-2">
            {p.goals.map(g => {
              const saved = (g.contributions || []).reduce((s, c) => s + c.amount, 0)
              const pct = g.targetAmount > 0 ? Math.min(100, Math.round(saved / g.targetAmount * 100)) : 0
              return (
                <div key={g.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: '#383838' }}>
                  <span className="text-lg">{g.icon || '🎯'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-100 text-sm truncate">{g.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{pct}%</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-white">{fmt(saved)}</p>
                    <p className="text-xs text-gray-400">of {fmt(g.targetAmount)}</p>
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
          <p className="font-semibold text-red-700">Error loading users</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (selected) return <UserDetail row={selected} onBack={() => setSelected(null)} />

  const onboarded    = rows.filter(r => r.profile_data != null)
  const notOnboarded = rows.filter(r => r.profile_data == null)

  const filtered = rows.filter(r =>
    !search || r.email?.toLowerCase().includes(search.toLowerCase())
  )

  // Active in last 7 days
  const recentlyActive = rows.filter(r => {
    if (!r.last_seen) return false
    return Date.now() - new Date(r.last_seen).getTime() < 7 * 24 * 60 * 60 * 1000
  }).length

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">All registered users</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Users"      value={rows.length} />
        <StatCard label="Onboarded"        value={onboarded.length} color="text-green-600" sub={`${Math.round(onboarded.length / Math.max(rows.length, 1) * 100)}% of users`} />
        <StatCard label="Not Onboarded"    value={notOnboarded.length} color="text-amber-500" />
        <StatCard label="Active (7 days)"  value={recentlyActive} color="text-primary-600" />
      </div>

      <div>
        <div className="flex items-center gap-4 mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email..."
            className="flex-1 max-w-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm text-white"
            style={{ background: '#2c2c2c', border: '1px solid #3a3a3a' }}
          />
          <span className="text-sm text-gray-400">{filtered.length} users</span>
        </div>

        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead style={{ background: '#383838', borderBottom: '1px solid #3a3a3a' }}>
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Joined</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Last Seen</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No users found</td>
                </tr>
              )}
              {filtered.map(row => (
                <tr key={row.id} className="transition-colors" style={{ borderTop: '1px solid #3a3a3a' }} onMouseEnter={e => e.currentTarget.style.background='#383838'} onMouseLeave={e => e.currentTarget.style.background=''}>
                  <td className="px-6 py-4 font-medium text-white">{row.email}</td>
                  <td className="px-6 py-4 text-gray-500">{fmtDate(row.created_at)}</td>
                  <td className="px-6 py-4 text-gray-500">{fmtRelative(row.last_seen)}</td>
                  <td className="px-6 py-4">
                    {row.profile_data
                      ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Onboarded</span>
                      : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">Pending</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-right">
                    {row.profile_data && (
                      <button
                        onClick={() => setSelected(row)}
                        className="text-xs text-primary-600 hover:underline font-medium"
                      >
                        View →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </main>
  )
}
