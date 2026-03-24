import { Card } from '../ui/Card.jsx';
import { ProgressBar } from '../ui/ProgressBar.jsx';
import { fmt, fmtPct } from '../../utils/formatters.js';
import { totalExpenses, savingsRate, netWorth, emergencyFundTarget } from '../../utils/calculations.js';

export function SnapshotPanel({ profile }) {
  const expenses = totalExpenses(profile);
  const surplus = profile.monthlyIncome - expenses;
  const rate = savingsRate(profile);
  const nw = netWorth(profile);
  const efBalance = profile.emergencyFundBalance || 0;
  const efTarget6 = emergencyFundTarget(profile, 6);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Card className="col-span-2 sm:col-span-2">
        <div className="text-sm text-gray-500 font-medium mb-1">Monthly Cash Flow</div>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-3xl font-bold text-gray-900">{fmt(profile.monthlyIncome)}</span>
          <span className="text-gray-400 mb-1">income</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Fixed expenses</span><span>{fmt(profile.fixedExpenses?.total||0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Variable expenses</span><span>{fmt(profile.variableExpenses?.total||0)}</span>
          </div>
          <div className="border-t border-gray-100 pt-1 flex justify-between text-sm font-semibold">
            <span className={surplus>=0?'text-success-700':'text-danger-500'}>Monthly surplus</span>
            <span className={surplus>=0?'text-success-700':'text-danger-500'}>{fmt(surplus)}</span>
          </div>
        </div>
      </Card>
      <Card>
        <div className="text-sm text-gray-500 font-medium mb-1">Savings Rate</div>
        <div className="text-3xl font-bold text-gray-900 mb-2">{fmtPct(rate)}</div>
        <ProgressBar value={rate} max={0.3} color={rate >= 0.2 ? 'bg-success-500' : rate >= 0.1 ? 'bg-warning-500' : 'bg-danger-500'} />
        <p className="text-xs text-gray-400 mt-2">Target: 20%+</p>
      </Card>
      <Card>
        <div className="text-sm text-gray-500 font-medium mb-1">Net Worth</div>
        <div className={`text-3xl font-bold mb-1 ${nw >= 0 ? 'text-gray-900' : 'text-danger-500'}`}>{fmt(nw)}</div>
        <p className="text-xs text-gray-400">Savings + EF − Debt</p>
      </Card>
      <Card className="col-span-2">
        <div className="text-sm text-gray-500 font-medium mb-2">Emergency Fund</div>
        <div className="flex justify-between text-sm mb-1">
          <span>{fmt(efBalance)} saved</span>
          <span className="text-gray-400">{fmt(efTarget6)} target (6mo)</span>
        </div>
        <ProgressBar value={efBalance} max={efTarget6} color="bg-primary-500" />
        <p className="text-xs text-gray-400 mt-1">
          {Math.floor(efBalance / Math.max(expenses, 1))} of 6 months covered
        </p>
      </Card>
    </div>
  );
}
