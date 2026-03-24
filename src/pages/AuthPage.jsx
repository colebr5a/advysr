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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Advysr</h1>
          <p className="text-gray-400 text-sm mt-1">Personal Finance Advisor</p>
        </div>

        {success ? (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center">
            <p className="text-4xl mb-3">📬</p>
            <p className="font-semibold text-gray-900 text-lg">Check your email</p>
            <p className="text-gray-500 text-sm mt-2">
              We sent a confirmation link to <strong>{email}</strong>.
              Click it to activate your account, then come back to sign in.
            </p>
            <button
              onClick={() => { setMode('login'); setSuccess(false) }}
              className="mt-6 text-sm text-primary-600 hover:underline font-medium"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                <input
                  type="email" required autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
                <input
                  type="password" required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                  placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                  minLength={6}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading
                  ? 'Loading...'
                  : mode === 'login' ? 'Sign in' : 'Create account'
                }
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
                className="text-primary-600 font-medium hover:underline"
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
