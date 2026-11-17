import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setSuccess(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: '#F5F3EE' }}
    >
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-10">
          <p
            className="text-4xl tracking-tight mb-2"
            style={{ color: '#1B4332', letterSpacing: '-0.02em' }}
          >
            advysr
          </p>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            Personal Finance Manager
          </p>
        </div>

        {success ? (
          <div
            className="rounded-3xl p-8 text-center"
            style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#F0FAF4' }}
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#1B4332" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <p className="text-lg font-semibold mb-2" style={{ color: '#111827' }}>Check your email</p>
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
              We sent a link to <span className="font-medium" style={{ color: '#111827' }}>{email}</span>. Click it to confirm your account.
            </p>
            <button
              onClick={() => { setMode('login'); setSuccess(false) }}
              className="text-sm font-medium press-effect"
              style={{ color: '#1B4332' }}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <div
            className="rounded-3xl p-6"
            style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}
          >
            <p className="text-lg font-semibold mb-5" style={{ color: '#111827' }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>
                  Email
                </label>
                <input
                  type="email" required autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm transition-shadow"
                  style={{
                    background: '#F9F8F6',
                    border: '1.5px solid #E6E9E6',
                    color: '#111827',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>
                  Password
                </label>
                <input
                  type="password" required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-shadow"
                  style={{
                    background: '#F9F8F6',
                    border: '1.5px solid #E6E9E6',
                    color: '#111827',
                  }}
                />
              </div>

              {error && (
                <div
                  className="text-sm px-4 py-3 rounded-xl"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-semibold press-effect disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#1B4332', color: '#FFFFFF' }}
              >
                {loading ? 'Loading…' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p className="text-center text-sm mt-5" style={{ color: '#9CA3AF' }}>
              {mode === 'login' ? "No account? " : 'Already signed up? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
                className="font-medium press-effect"
                style={{ color: '#1B4332' }}
              >
                {mode === 'login' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
