export function NavBar({ activePage, onNavigate, onEditProfile, onReset, onLogout, isAdmin, userEmail }) {
  const tabs = [
    { id: 'home',      label: 'Home' },
    { id: 'goals',     label: 'Goals' },
    { id: 'investing', label: 'Investing' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin' }] : []),
  ];

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Advysr</h1>
            <p className="text-xs text-gray-400">Personal Finance Advisor</p>
          </div>

          <nav className="flex gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => onNavigate(t.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activePage === t.id
                    ? t.id === 'admin'
                      ? 'bg-purple-600 text-white'
                      : 'bg-primary-600 text-white'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {userEmail && (
              <span className="text-xs text-gray-400 hidden sm:block max-w-[120px] truncate">{userEmail}</span>
            )}
            <button
              onClick={onEditProfile}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium transition-colors text-gray-600"
            >
              Edit Profile
            </button>
            <button
              onClick={onReset}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-colors"
            >
              Reset
            </button>
            <button
              onClick={onLogout}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium transition-colors text-gray-600"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
