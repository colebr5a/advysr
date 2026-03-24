import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';
import { fmt } from '../../utils/formatters.js';

export function AdvicePanel({ advice }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-gray-900">Your Allocation Plan</h2>
      {advice.map(item => (
        <Card key={item.ruleId} className="!p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                {item.priority}
              </div>
              <div>
                <div className="font-semibold text-gray-800">{item.title}</div>
                <p className="text-xs text-gray-500 mt-0.5">{item.rationale}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {item.monthlyAmount > 0 && <span className="font-bold text-gray-900">{fmt(item.monthlyAmount)}<span className="text-xs font-normal text-gray-400">/mo</span></span>}
              <Badge status={item.status} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-3 pl-10">{item.detail}</p>
        </Card>
      ))}
    </div>
  );
}
