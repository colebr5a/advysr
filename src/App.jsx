import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { fetchProfile, saveProfile } from './lib/profileService.js';
import { AuthPage } from './pages/AuthPage.jsx';
import { OnboardingShell } from './components/onboarding/OnboardingShell.jsx';
import { PinLock } from './components/PinLock.jsx';
import { NavBar } from './components/layout/NavBar.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { GoalsPage } from './pages/GoalsPage.jsx';
import { InvestingPage } from './pages/InvestingPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { ResearchPage } from './pages/ResearchPage.jsx';

function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1a1a' }}>
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile]           = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isOnboarded, setIsOnboarded]   = useState(false);
  const [editing, setEditing]           = useState(false);
  const [activePage, setActivePage]     = useState('home');
  const [pinUnlocked, setPinUnlocked]   = useState(false);

  // Load profile from Supabase when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsOnboarded(false);
      return;
    }
    setProfileLoading(true);
    fetchProfile(user.id)
      .then(data => {
        setProfile(data);
        setIsOnboarded(data != null);
      })
      .catch(console.error)
      .finally(() => setProfileLoading(false));
  }, [user]);

  async function handleComplete(draft) {
    const p = { ...draft, createdAt: profile?.createdAt || new Date().toISOString() };
    await saveProfile(user.id, user.email, p);
    setProfile(p);
    setIsOnboarded(true);
    setEditing(false);
    setPinUnlocked(true); // just set it, no need to re-enter immediately
  }

  async function handleProfileUpdate(updated) {
    setProfile(updated); // optimistic
    try {
      await saveProfile(user.id, user.email, updated);
    } catch (err) {
      console.error('Save failed:', err);
    }
  }

  async function handleReset() {
    if (window.confirm('Reset all data? This cannot be undone.')) {
      await saveProfile(user.id, user.email, null);
      setIsOnboarded(false);
      setProfile(null);
      setEditing(false);
      setActivePage('home');
    }
  }

  async function handleLogout() {
    await signOut();
    setActivePage('home');
    setEditing(false);
    setPinUnlocked(false);
  }

  // Resolving initial auth session
  if (authLoading) return <FullScreenSpinner />;

  // Not logged in
  if (!user) return <AuthPage />;

  // Logged in, loading profile from Supabase
  if (profileLoading) return <FullScreenSpinner />;

  // PIN lock — shown after profile loads if PIN is set and not yet unlocked this session
  if (isOnboarded && !editing && profile?.pin && !pinUnlocked) {
    return (
      <PinLock
        onUnlock={(entered, onWrong) => {
          if (entered === profile.pin) setPinUnlocked(true);
          else onWrong();
        }}
        onSignOut={handleLogout}
      />
    );
  }

  // Needs onboarding
  if (!isOnboarded || editing) {
    return (
      <OnboardingShell
        onComplete={handleComplete}
        initialDraft={editing ? profile : undefined}
      />
    );
  }

  return (
    <div className="min-h-screen pb-16 sm:pb-0" style={{ background: '#1a1a1a' }}>
      <NavBar
        activePage={activePage}
        onNavigate={setActivePage}
        onEditProfile={() => setEditing(true)}
        onReset={handleReset}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        userEmail={user.email}
      />
      {activePage === 'home'      && <HomePage profile={profile} onProfileUpdate={handleProfileUpdate} />}
      {activePage === 'goals'     && <GoalsPage profile={profile} onProfileUpdate={handleProfileUpdate} />}
      {activePage === 'investing' && <InvestingPage profile={profile} />}
      {activePage === 'research'   && <ResearchPage profile={profile} />}
      {activePage === 'admin'     && isAdmin && <AdminPage />}
    </div>
  );
}
