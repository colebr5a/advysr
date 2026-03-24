import { SnapshotPanel } from './SnapshotPanel.jsx';
import { AdvicePanel } from './AdvicePanel.jsx';
import { AllocationChart } from './AllocationChart.jsx';
import { GoalsPanel } from './GoalsPanel.jsx';
import { DebtPanel } from './DebtPanel.jsx';
import { useAdvice } from '../../hooks/useAdvice.js';

export function DashboardShell({ profile, onEditProfile, onReset }) {
  const result = useAdvice(profile);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">WealthManager</h1>
            <p className="text-xs text-gray-400">Personal finance advisor</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onEditProfile} className="text-sm px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium transition-colors">
              Edit Profile
            </button>
            <button onClick={onReset} className="text-sm px-4 py-2 rounded-xl text-danger-500 border border-danger-200 hover:bg-danger-50 font-medium transition-colors">
              Reset
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <SnapshotPanel profile={profile} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {result && <AdvicePanel advice={result.advice} />}
            <GoalsPanel goals={profile.goals} />
            <DebtPanel debts={profile.debts} />
          </div>
          <div className="space-y-6">
            {result && result.allocations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Surplus</h2>
                <AllocationChart allocations={result.allocations} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
