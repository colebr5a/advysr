import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { fetchProfile, saveProfile } from './lib/profileService.js';
import { AuthPage } from './pages/AuthPage.jsx';
import { OnboardingShell } from './components/onboarding/OnboardingShell.jsx';
import { NavBar } from './components/layout/NavBar.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { GoalsPage } from './pages/GoalsPage.jsx';
import { InvestingPage } from './pages/InvestingPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';

function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
  }

  // Resolving initial auth session
  if (authLoading) return <FullScreenSpinner />;

  // Not logged in
  if (!user) return <AuthPage />;

  // Logged in, loading profile from Supabase
  if (profileLoading) return <FullScreenSpinner />;

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
    <div className="min-h-screen" style={{ background: '#1a1a1a' }}>
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
      {activePage === 'admin'     && isAdmin && <AdminPage />}
    </div>
  );
}
