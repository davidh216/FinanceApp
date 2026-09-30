import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';
import { TAG_CATEGORIES } from '../../constants/financial';
import { Transaction } from '../../types/financial';
import { DateRange, spendingReport } from '../../utils/spendingReport';
import { formatMoney, formatSignedMoney } from '../../utils/format';
import { formatDateRange } from '../../utils/date';

interface SpendingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  // The accounts' transactions you're viewing.
  transactions: Transaction[];
  period: DateRange;
  previous: DateRange;
}

const formatRange = ({ start, end }: DateRange) => formatDateRange(start, end);

const percent = (share: number) => `${Math.round(share * 100)}%`;

export const SpendingReportModal: React.FC<SpendingReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  period,
  previous,
}) => {
  const { isPrivacyMode } = useFinancial();
  const report = useMemo(
    () => spendingReport(transactions, period, previous),
    [transactions, period, previous]
  );

  if (!isOpen) return null;

  const money = (amount: number) =>
    isPrivacyMode ? '••••' : formatMoney(amount);
  const signed = (amount: number) =>
    isPrivacyMode ? '••••' : formatSignedMoney(amount);
  const largest = Math.max(0, ...report.categories.map((c) => c.amount));
  const totalChange = report.total - report.previousTotal;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spending-report-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto text-left">
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h3
              id="spending-report-title"
              className="text-lg font-semibold text-gray-900"
            >
              Spending by category
            </h3>
            <p className="text-sm text-gray-500" data-testid="report-period">
              {formatRange(period)}, compared with {formatRange(previous)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {report.categories.length === 0 ? (
            <p className="text-sm text-gray-600" data-testid="report-empty">
              No spending in either period.
            </p>
          ) : (
            <>
              <div className="mb-6" data-testid="report-total">
                <div className="text-sm text-gray-500">Total spent</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {money(report.total)}
                </div>
                <div className="text-sm text-gray-600">
                  {signed(totalChange)} vs {money(report.previousTotal)} the
                  period before
                </div>
              </div>

              {/* One bar per category, scaled to the largest. */}
              <div className="space-y-3 mb-6" aria-hidden="true">
                {report.categories
                  .filter((c) => c.amount > 0)
                  .map((c) => (
                    <div
                      key={c.category}
                      className="grid grid-cols-[8rem_1fr_5.5rem] items-center gap-3"
                      title={`${c.category}: ${money(c.amount)} (${percent(
                        c.share
                      )} of spending)`}
                    >
                      <span className="text-sm text-gray-700 truncate">
                        <span className="mr-1">
                          {TAG_CATEGORIES[c.category]?.icon}
                        </span>
                        {c.category}
                      </span>
                      <div className="h-2">
                        <div
                          className="h-2 rounded-r bg-blue-500"
                          style={{
                            width: `${(c.amount / largest) * 100}%`,
                            minWidth: '2px',
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-900 text-right tabular-nums">
                        {money(c.amount)}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="report-table">
                  <caption className="sr-only">
                    Spending by category, with the change from the period before
                  </caption>
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="py-2 font-medium">Category</th>
                      <th className="py-2 font-medium text-right">Spent</th>
                      <th className="py-2 font-medium text-right hidden sm:table-cell">
                        Share
                      </th>
                      <th className="py-2 font-medium text-right hidden sm:table-cell">
                        Before
                      </th>
                      <th className="py-2 font-medium text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.categories.map((c) => (
                      <tr
                        key={c.category}
                        className="border-b last:border-0"
                        data-testid={`report-row-${c.category}`}
                      >
                        <td className="py-2 text-gray-900">{c.category}</td>
                        <td className="py-2 text-right tabular-nums text-gray-900">
                          {money(c.amount)}
                        </td>
                        <td className="py-2 text-right tabular-nums text-gray-600 hidden sm:table-cell">
                          {percent(c.share)}
                        </td>
                        <td className="py-2 text-right tabular-nums text-gray-600 hidden sm:table-cell">
                          {money(c.previous)}
                        </td>
                        <td className="py-2 text-right tabular-nums text-gray-600">
                          {c.change > 0 && (
                            <span
                              className="text-red-500 mr-1"
                              aria-hidden="true"
                            >
                              ▲
                            </span>
                          )}
                          {c.change < 0 && (
                            <span
                              className="text-green-600 mr-1"
                              aria-hidden="true"
                            >
                              ▼
                            </span>
                          )}
                          {signed(c.change)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <p className="mt-4 text-xs text-gray-500">
            Money out in the accounts you're viewing. Income and transfers
            between your own accounts aren't spending.
          </p>
        </div>
      </div>
    </div>
  );
};
