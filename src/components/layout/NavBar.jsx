export function NavBar({ activePage, onNavigate, onEditProfile, onReset, onLogout, isAdmin, userEmail }) {
  const tabs = [
    { id: 'home',      label: 'Home' },
    { id: 'goals',     label: 'Goals' },
    { id: 'investing', label: 'Investing' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin' }] : []),
  ];

  return (
    <header className="sticky top-0 z-20" style={{ background: '#222222', borderBottom: '1px solid #333' }}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Advysr</h1>
            <p className="text-xs text-gray-500">Personal Finance Manager</p>
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
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {userEmail && (
              <span className="text-xs text-gray-500 hidden sm:block max-w-[120px] truncate">{userEmail}</span>
            )}
            <button
              onClick={onEditProfile}
              className="text-xs px-3 py-1.5 rounded-lg border border-[#444] hover:bg-[#2a2a2a] font-medium transition-colors text-gray-400"
            >
              Edit Profile
            </button>
            <button
              onClick={onReset}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-900 text-red-500 hover:bg-red-950 font-medium transition-colors"
            >
              Reset
            </button>
            <button
              onClick={onLogout}
              className="text-xs px-3 py-1.5 rounded-lg border border-[#444] hover:bg-[#2a2a2a] font-medium transition-colors text-gray-400"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
