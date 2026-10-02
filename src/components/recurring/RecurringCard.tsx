import React, { useState } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { useCategories } from '../../hooks/useCategories';
import { RecurringPayment } from '../../utils/recurring';
import { formatDateRange } from '../../utils/date';
import { formatMoney } from '../../utils/format';

interface RecurringCardProps {
  payments: RecurringPayment[];
}

// Shows this many before "Show all".
const COLLAPSED = 6;

const CADENCE_LABELS: Record<RecurringPayment['cadence'], string> = {
  weekly: 'Weekly',
  'every 2 weeks': 'Every 2 weeks',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

// "Oct 3, 2026"
const formatDay = (date: string) => formatDateRange(date, date);

export const RecurringCard: React.FC<RecurringCardProps> = ({ payments }) => {
  const { isPrivacyMode } = useFinancial();
  const categories = useCategories();
  const [expanded, setExpanded] = useState(false);
  if (payments.length === 0) return null;

  const money = (amount: number) =>
    isPrivacyMode ? '••••' : formatMoney(amount);
  const total = payments.reduce((sum, p) => sum + p.monthlyCost, 0);
  const rises = payments.filter(
    (p) => p.priceChange && p.priceChange.to > p.priceChange.from
  ).length;
  const shown = expanded ? payments : payments.slice(0, COLLAPSED);

  return (
    <div
      className="bg-white rounded-lg shadow-sm border p-6 text-left"
      data-testid="recurring-card"
    >
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-lg font-semibold text-gray-900">
          Recurring payments
        </h3>
        <span
          className="text-sm font-medium text-gray-900"
          data-testid="recurring-total"
        >
          {money(total)}/month
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {payments.length} found from regular payments of about the same amount
        {rises > 0 && <span className="text-red-600"> · {rises} went up</span>}
      </p>
      <ul className="divide-y divide-gray-100">
        {shown.map((p) => (
          <li
            key={p.merchantKey}
            className="py-2.5 flex items-center justify-between gap-3"
            data-testid={`recurring-${p.merchantKey}`}
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                <span className="mr-1">{categories.icon(p.category)}</span>
                {p.merchant}
              </div>
              <div className="text-xs text-gray-500">
                {CADENCE_LABELS[p.cadence]} · next around{' '}
                {formatDay(p.nextDate)}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-medium text-gray-900 tabular-nums">
                {money(p.amount)}
              </div>
              {p.priceChange && (
                <div
                  className={`text-xs ${
                    p.priceChange.to > p.priceChange.from
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {p.priceChange.to > p.priceChange.from ? '▲' : '▼'} was{' '}
                  {money(p.priceChange.from)}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {payments.length > COLLAPSED && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {expanded ? 'Show fewer' : `Show all ${payments.length}`}
        </button>
      )}
    </div>
  );
};
