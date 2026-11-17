import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { fetchProfile, saveProfile, fetchAiUsage, sanitizeProfile } from './lib/profileService.js';
import { setPin, verifyPin } from './lib/apiClient.js';
import { AuthPage } from './pages/AuthPage.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { OnboardingShell } from './components/onboarding/OnboardingShell.jsx';
import { PinLock } from './components/PinLock.jsx';
import { NavBar } from './components/layout/NavBar.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { GoalsPage } from './pages/GoalsPage.jsx';
import { InvestingPage } from './pages/InvestingPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { ResearchPage } from './pages/ResearchPage.jsx';
import { PortfolioPage } from './pages/PortfolioPage.jsx';
import { NewsPage } from './pages/NewsPage.jsx';
import { SimulationsPage } from './pages/SimulationsPage.jsx';
import { recordSnapshot } from './lib/snapshotService.js';

function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#F5F3EE' }}>
      <div
        className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: '#E6E9E6', borderTopColor: '#1B4332' }}
      />
    </div>
  );
}

export default function App() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile]                   = useState(null);
  const [profileLoading, setProfileLoading]     = useState(false);
  const [isOnboarded, setIsOnboarded]           = useState(false);
  const [editing, setEditing]                   = useState(false);
  const [activePage, setActivePage]             = useState('home');
  const [pinUnlocked, setPinUnlocked]           = useState(false);
  const [showAuth, setShowAuth]                 = useState(false);
  const [saveStatus, setSaveStatus]             = useState('idle');
  const [lastSaved, setLastSaved]               = useState(null);
  const [aiQueriesUsed, setAiQueriesUsed]       = useState(0);
  const [simGoalId, setSimGoalId]               = useState(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsOnboarded(false);
      setAiQueriesUsed(0);
      return;
    }
    setProfileLoading(true);
    fetchAiUsage(user.id).then(setAiQueriesUsed);
    fetchProfile(user.id)
      .then(({ profileData }) => {
        // Drop any legacy plaintext PIN from memory; the server migrates it on first verify.
        setProfile(sanitizeProfile(profileData));
        setIsOnboarded(profileData != null);
      })
      .catch(console.error)
      .finally(() => setProfileLoading(false));
  }, [user]);

  // Net worth history: snapshot today's balances whenever they change (debounced).
  useEffect(() => {
    if (!user || !profile) return undefined;
    const t = setTimeout(() => recordSnapshot(user.id, profile), 1500);
    return () => clearTimeout(t);
  }, [user, profile]);

  function navigate(page) {
    if (page === 'simulations') setSimGoalId(null);
    setActivePage(page);
  }

  function simulateGoal(goalId) {
    setSimGoalId(goalId);
    setActivePage('simulations');
  }

  async function handleComplete(draft) {
    const { pin, ...rest } = draft;
    let hasPin = !!profile?.hasPin;
    if (pin) {
      try {
        const { ok } = await setPin(pin);
        hasPin = ok || hasPin;
        if (!ok) console.error('setPin failed');
      } catch (err) {
        console.error('setPin failed:', err);
      }
    }
    const p = { ...rest, hasPin, createdAt: profile?.createdAt || new Date().toISOString() };
    try {
      await saveProfile(user.id, user.email, p);
    } catch (err) {
      console.error('saveProfile failed:', err);
    }
    setProfile(p);
    setIsOnboarded(true);
    setEditing(false);
    setPinUnlocked(true);
  }

  async function handleProfileUpdate(updated) {
    setProfile(updated);
    setSaveStatus('saving');
    try {
      await saveProfile(user.id, user.email, updated);
      setLastSaved(new Date());
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  }

  // Usage is counted server-side; the AI endpoints report the new count back.
  function handleAiResponse({ data }) {
    if (typeof data?.usage?.used === 'number') setAiQueriesUsed(data.usage.used);
  }

  async function handlePinAttempt(entered) {
    try {
      const { ok, data } = await verifyPin(entered);
      if (ok) { setPinUnlocked(true); return null; }
      if (data?.code === 'pin_not_set') {
        // Flag was set but no PIN exists server-side — nothing to unlock against.
        setProfile(p => ({ ...p, hasPin: false }));
        setPinUnlocked(true);
        return null;
      }
      if (data?.code === 'locked') {
        const mins = Math.max(1, Math.ceil((new Date(data.lockedUntil) - Date.now()) / 60000));
        return `Too many attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`;
      }
      if (data?.code === 'wrong_pin') {
        const left = data.attemptsRemaining;
        return left > 0 && left <= 3
          ? `Incorrect PIN. ${left} attempt${left === 1 ? '' : 's'} left.`
          : 'Incorrect PIN. Try again.';
      }
      return 'Something went wrong. Try again.';
    } catch {
      return 'Could not reach the server. Check your connection.';
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

  if (authLoading) return <FullScreenSpinner />;

  if (!user) {
    if (showAuth) return <AuthPage />;
    return <LandingPage onGetStarted={() => setShowAuth(true)} onSignIn={() => setShowAuth(true)} />;
  }

  if (profileLoading) return <FullScreenSpinner />;

  if (isOnboarded && !editing && profile?.hasPin && !pinUnlocked) {
    return (
      <PinLock
        onUnlock={handlePinAttempt}
        onSignOut={handleLogout}
      />
    );
  }

  if (!isOnboarded || editing) {
    return (
      <OnboardingShell
        onComplete={handleComplete}
        initialDraft={editing ? profile : undefined}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F3EE' }}>
      <NavBar
        activePage={activePage}
        onNavigate={navigate}
        onEditProfile={() => setEditing(true)}
        onReset={handleReset}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        userEmail={user.email}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
      />
      <div className="pb-nav">
        {activePage === 'home'      && <HomePage profile={profile} onProfileUpdate={handleProfileUpdate} onNavigate={setActivePage} />}
        {activePage === 'goals'     && <GoalsPage profile={profile} onProfileUpdate={handleProfileUpdate} onSimulateGoal={simulateGoal} />}
        {activePage === 'simulations' && <SimulationsPage key={simGoalId || 'default'} profile={profile} initialGoalId={simGoalId} />}
        {activePage === 'portfolio' && <PortfolioPage profile={profile} onProfileUpdate={handleProfileUpdate} />}
        {activePage === 'investing' && <InvestingPage profile={profile} onAiResponse={handleAiResponse} />}
        {activePage === 'news'      && <NewsPage profile={profile} />}
        {activePage === 'research'  && (
          <ResearchPage
            profile={profile}
            aiQueriesUsed={aiQueriesUsed}
            onAiResponse={handleAiResponse}
          />
        )}
        {activePage === 'admin'     && isAdmin && <AdminPage />}
      </div>
    </div>
  );
}
