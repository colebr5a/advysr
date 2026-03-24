import { Card } from '../ui/Card.jsx';
import { ProgressBar } from '../ui/ProgressBar.jsx';
import { fmt, fmtMonths } from '../../utils/formatters.js';

export function GoalsPanel({ goals }) {
  if (!goals || goals.length === 0) return null;
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-3">Goals</h2>
      <div className="space-y-3">
        {goals.map(g => {
          const pct = Math.min(1, (g.currentSaved || 0) / Math.max(g.targetAmount, 1));
          const needed = Math.max(0, g.targetAmount - (g.currentSaved||0));
          const monthly = needed / Math.max(g.targetMonths, 1);
          return (
            <Card key={g.id} className="!p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-gray-800">{g.label}</div>
                  <div className="text-xs text-gray-400">{fmtMonths(g.targetMonths)} timeline</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{fmt(g.targetAmount)}</div>
                  <div className="text-xs text-gray-400">target</div>
                </div>
              </div>
              <ProgressBar value={g.currentSaved||0} max={g.targetAmount} color="bg-success-500" />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{fmt(g.currentSaved||0)} saved ({Math.round(pct*100)}%)</span>
                <span>Need {fmt(monthly)}/mo</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
