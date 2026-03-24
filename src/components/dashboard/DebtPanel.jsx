import { Card } from '../ui/Card.jsx';
import { fmt } from '../../utils/formatters.js';

const TYPE_LABELS = { credit_card:'Credit Card', student_loan:'Student Loan', auto_loan:'Auto Loan', personal_loan:'Personal Loan', medical:'Medical', other:'Other' };
const COLORS = { credit_card:'text-danger-500', student_loan:'text-warning-700', auto_loan:'text-primary-600', personal_loan:'text-primary-600', medical:'text-gray-500', other:'text-gray-500' };

export function DebtPanel({ debts }) {
  if (!debts || debts.length === 0) return null;
  const total = debts.reduce((s,d) => s+d.balance, 0);
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-3">Debts — {fmt(total)} total</h2>
      <div className="space-y-2">
        {[...debts].sort((a,b)=>b.interestRate-a.interestRate).map(d => (
          <Card key={d.id} className="!p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">{d.label || TYPE_LABELS[d.type]}</div>
              <div className={`text-sm font-semibold ${COLORS[d.type]}`}>{Math.round(d.interestRate*1000)/10}% APR</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-900">{fmt(d.balance)}</div>
              <div className="text-xs text-gray-400">Min: {fmt(d.minimumPayment)}/mo</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
