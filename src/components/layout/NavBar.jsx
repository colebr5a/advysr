import { useState } from 'react';

const TAB_ICONS = {
  home:      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
  goals:     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  portfolio: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>,
  investing: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
  news:      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6"/></svg>,
  research:  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  admin:     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
};

export function NavBar({ activePage, onNavigate, onEditProfile, onReset, onLogout, isAdmin, userEmail }) {
  const [open, setOpen] = useState(false);

  const tabs = [
    { id: 'home',      label: 'Home' },
    { id: 'goals',     label: 'Goals' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'investing', label: 'Investing' },
    { id: 'news',      label: 'News' },
    { id: 'research',  label: 'Research' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin' }] : []),
  ];

  function navigate(id) {
    onNavigate(id);
    setOpen(false);
  }

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3" style={{ background: '#222222', borderBottom: '1px solid #333' }}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex flex-col justify-center gap-1.5 w-8 h-8 items-center rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="Toggle menu"
        >
          <span className="block w-5 h-0.5 rounded-full bg-gray-300" />
          <span className="block w-5 h-0.5 rounded-full bg-gray-300" />
          <span className="block w-5 h-0.5 rounded-full bg-gray-300" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight leading-none">advysr</h1>
          <p className="text-xs text-gray-500 leading-none mt-0.5">Personal Finance Manager</p>
        </div>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className="fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-250"
        style={{
          background: '#1e1e1e',
          borderRight: '1px solid #333',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #2e2e2e' }}>
          <div>
            <p className="text-base font-bold text-white tracking-tight">advysr</p>
            {userEmail && <p className="text-xs text-gray-500 truncate max-w-[160px] mt-0.5">{userEmail}</p>}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav tabs */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {tabs.map(t => {
            const active = activePage === t.id;
            const isAdminTab = t.id === 'admin';
            return (
              <button
                key={t.id}
                onClick={() => navigate(t.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
                style={{
                  background: active ? (isAdminTab ? '#7c3aed22' : '#2563eb22') : 'transparent',
                  color: active ? (isAdminTab ? '#a78bfa' : '#60a5fa') : '#9ca3af',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#ffffff0d'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: active ? (isAdminTab ? '#a78bfa' : '#60a5fa') : '#6b7280' }}>
                  {TAB_ICONS[t.id]}
                </span>
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-3 space-y-0.5" style={{ borderTop: '1px solid #2e2e2e' }}>
          <button
            onClick={() => { onEditProfile(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors text-left"
            onMouseEnter={e => e.currentTarget.style.background = '#ffffff0d'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Edit Profile
          </button>
          <button
            onClick={() => { onLogout(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors text-left"
            onMouseEnter={e => e.currentTarget.style.background = '#ffffff0d'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
          <button
            onClick={() => { onReset(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:text-red-400 transition-colors text-left"
            onMouseEnter={e => e.currentTarget.style.background = '#7f1d1d22'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Reset Data
          </button>
        </div>
      </aside>
    </>
  );
}
