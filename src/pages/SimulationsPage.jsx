import { useState } from 'react';
import { Segmented } from '../components/sim/controls.jsx';
import { MonteCarloPanel } from '../components/sim/MonteCarloPanel.jsx';
import { NetWorthPanel } from '../components/sim/NetWorthPanel.jsx';
import { DebtPayoffPanel } from '../components/sim/DebtPayoffPanel.jsx';
import { Disclaimer } from '../components/ui/Disclaimer.jsx';

const TABS = [
  { value: 'montecarlo', label: 'Monte Carlo' },
  { value: 'networth', label: 'Net worth' },
  { value: 'debt', label: 'Debt payoff' },
];

const INTRO = {
  montecarlo: 'Thousands of possible market futures for a goal or long-term plan.',
  networth: 'Where your net worth has been, and where it could go.',
  debt: 'Compare payoff strategies and see the cost of minimum payments.',
};

export function SimulationsPage({ profile, initialGoalId, initialTab = 'montecarlo' }) {
  const [tab, setTab] = useState(initialTab);

  return (
    <main className="px-4 pt-3 pb-8 max-w-5xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#111827', letterSpacing: '-0.02em' }}>
          Simulations
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{INTRO[tab]}</p>
      </div>

      <div className="mb-4 max-w-md">
        <Segmented options={TABS} value={tab} onChange={setTab} ariaLabel="Simulation type" />
      </div>

      <div key={tab} className="sim-enter">
        {tab === 'montecarlo' && <MonteCarloPanel profile={profile} initialGoalId={initialGoalId} />}
        {tab === 'networth' && <NetWorthPanel profile={profile} />}
        {tab === 'debt' && <DebtPayoffPanel profile={profile} />}
      </div>

      <div className="mt-6">
        <Disclaimer full />
      </div>
    </main>
  );
}
