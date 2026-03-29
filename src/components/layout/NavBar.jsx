const TAB_ICONS = {
  home:      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
  goals:     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  investing: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
  research:  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  admin:     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
};

export function NavBar({ activePage, onNavigate, onEditProfile, onReset, onLogout, isAdmin, userEmail }) {
  const tabs = [
    { id: 'home',      label: 'Home' },
    { id: 'goals',     label: 'Goals' },
    { id: 'investing', label: 'Investing' },
    { id: 'research',  label: 'Research' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin' }] : []),
  ];

  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden sm:block sticky top-0 z-20" style={{ background: '#222222', borderBottom: '1px solid #333' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">advysr</h1>
              <p className="text-xs text-gray-500">Personal Finance Manager</p>
            </div>

            <nav className="flex gap-1">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => onNavigate(t.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activePage === t.id
                      ? t.id === 'admin' ? 'bg-purple-600 text-white' : 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {userEmail && <span className="text-xs text-gray-500 hidden lg:block max-w-[120px] truncate">{userEmail}</span>}
              <button onClick={onEditProfile} className="text-xs px-3 py-1.5 rounded-lg border border-[#444] hover:bg-[#2a2a2a] font-medium transition-colors text-gray-400">Edit Profile</button>
              <button onClick={onReset} className="text-xs px-3 py-1.5 rounded-lg border border-red-900 text-red-500 hover:bg-red-950 font-medium transition-colors">Reset</button>
              <button onClick={onLogout} className="text-xs px-3 py-1.5 rounded-lg border border-[#444] hover:bg-[#2a2a2a] font-medium transition-colors text-gray-400">Sign out</button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="sm:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3" style={{ background: '#222222', borderBottom: '1px solid #333' }}>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">advysr</h1>
          <p className="text-xs text-gray-500">Personal Finance Manager</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onEditProfile} className="text-xs px-2.5 py-1.5 rounded-lg border border-[#444] text-gray-400">Edit</button>
          <button onClick={onLogout} className="text-xs px-2.5 py-1.5 rounded-lg border border-[#444] text-gray-400">Sign out</button>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-20 flex" style={{ background: '#222222', borderTop: '1px solid #333' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => onNavigate(t.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
              activePage === t.id ? 'text-primary-400' : 'text-gray-500'
            }`}
          >
            {TAB_ICONS[t.id]}
            <span className="text-xs font-medium">{t.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
