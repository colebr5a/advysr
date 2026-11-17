import { useState } from 'react';

const TABS = [
  {
    id: 'home',
    label: 'Home',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
      </svg>
    ),
  },
  {
    id: 'goals',
    label: 'Goals',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
      </svg>
    ),
  },
  {
    id: 'investing',
    label: 'Invest',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    id: 'news',
    label: 'News',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
      </svg>
    ),
  },
  {
    id: 'research',
    label: 'AI',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
];

function SaveIndicator({ saveStatus, lastSaved }) {
  if (saveStatus === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs" style={{ color: '#9CA3AF' }}>
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Saving
      </span>
    );
  }
  if (saveStatus === 'error') {
    return <span className="text-xs" style={{ color: '#DC2626' }}>Not saved</span>;
  }
  if (saveStatus === 'saved') {
    return (
      <span className="flex items-center gap-1 text-xs" style={{ color: '#52B788' }}>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Saved
      </span>
    );
  }
  return null;
}

const PAGE_TITLES = {
  goals: 'Goals',
  portfolio: 'Portfolio',
  investing: 'Invest',
  news: 'News',
  research: 'AI',
  admin: 'Admin',
};

export function NavBar({ activePage, onNavigate, onEditProfile, onReset, onLogout, isAdmin, userEmail, saveStatus, lastSaved }) {
  const [showProfile, setShowProfile] = useState(false);

  const tabs = [
    ...TABS,
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )}] : []),
  ];

  const pageTitle = PAGE_TITLES[activePage];

  return (
    <>
      {/* Top header */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-5"
        style={{
          background: '#F5F3EE',
          height: '52px',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {pageTitle ? (
          <span
            className="text-base font-semibold"
            style={{ color: '#111827', letterSpacing: '-0.01em' }}
          >
            {pageTitle}
          </span>
        ) : (
          <span
            className="text-xl"
            style={{ color: '#1B4332', letterSpacing: '-0.02em' }}
          >
            advysr
          </span>
        )}
        <div className="flex items-center gap-3">
          <SaveIndicator saveStatus={saveStatus} lastSaved={lastSaved} />
          <button
            onClick={() => setShowProfile(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all press-effect"
            style={{ background: '#E6F4EC', color: '#1B4332' }}
            aria-label="Profile"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around"
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid #E6E9E6',
          height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {tabs.map(tab => {
          const active = activePage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full press-effect"
              style={{ color: active ? '#1B4332' : '#9CA3AF' }}
            >
              {tab.icon(active)}
              <span
                className="text-xs leading-none"
                style={{
                  fontSize: '10px',
                  fontWeight: active ? '600' : '400',
                  color: active ? '#1B4332' : '#9CA3AF',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Profile sheet backdrop */}
      {showProfile && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(13, 31, 23, 0.4)' }}
          onClick={() => setShowProfile(false)}
        />
      )}

      {/* Profile action sheet */}
      {showProfile && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
          style={{ background: '#FFFFFF', padding: '8px 0 calc(24px + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2 pb-4">
            <div className="w-10 h-1 rounded-full" style={{ background: '#E6E9E6' }} />
          </div>

          {/* User info */}
          {userEmail && (
            <div className="px-6 pb-4 mb-2" style={{ borderBottom: '1px solid #F3F4F3' }}>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Signed in as</p>
              <p className="text-sm font-medium truncate" style={{ color: '#374151' }}>{userEmail}</p>
            </div>
          )}

          {/* Actions */}
          <div className="px-3">
            <button
              onClick={() => { setShowProfile(false); onEditProfile(); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-colors press-effect"
              style={{ color: '#1B4332' }}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span>Edit Profile</span>
            </button>
            <button
              onClick={() => { setShowProfile(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-colors press-effect"
              style={{ color: '#374151' }}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              <span>Sign out</span>
            </button>
            <button
              onClick={() => { setShowProfile(false); onReset(); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-colors press-effect"
              style={{ color: '#DC2626' }}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
