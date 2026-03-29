import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode]           = useState('login')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState(null)
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#1a1a1a' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">advysr</h1>
          <p className="text-gray-500 text-sm mt-1">Personal Finance Manager</p>
        </div>

        {success ? (
          <div className="rounded-3xl shadow-lg p-8 text-center" style={{ background: '#242424', border: '1px solid #333' }}>
            <p className="text-4xl mb-3">📬</p>
            <p className="font-semibold text-white text-lg">Check your email</p>
            <p className="text-gray-400 text-sm mt-2">
              We sent a confirmation link to <strong className="text-white">{email}</strong>.
              Click it to activate your account, then come back to sign in.
            </p>
            <button
              onClick={() => { setMode('login'); setSuccess(false) }}
              className="mt-6 text-sm text-primary-500 hover:underline font-medium"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <div className="rounded-3xl shadow-lg p-8" style={{ background: '#242424', border: '1px solid #333' }}>
            <h2 className="text-xl font-bold text-white mb-6">
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">Email</label>
                <input
                  type="email" required autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-white"
                  style={{ background: '#2e2e2e', border: '1px solid #444' }}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">Password</label>
                <input
                  type="password" required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-white"
                  style={{ background: '#2e2e2e', border: '1px solid #444' }}
                  placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                  minLength={6}
                />
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-950 border border-red-900 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
                className="text-primary-500 font-medium hover:underline"
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
