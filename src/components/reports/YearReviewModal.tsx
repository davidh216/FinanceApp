import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';
import { TAG_CATEGORIES } from '../../constants/financial';
import { Account } from '../../types/financial';
import { reviewYears, yearReview } from '../../utils/yearReview';
import {
  formatBalance,
  formatMoney,
  formatSignedMoney,
} from '../../utils/format';
import { formatDateRange, parseLocalDate } from '../../utils/date';

interface YearReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  // The accounts you're viewing.
  accounts: Account[];
  // "YYYY-MM-DD"
  today: string;
}

const monthName = (month: string) =>
  parseLocalDate(`${month}-01`).toLocaleDateString('en-US', { month: 'long' });

const shortDate = (date: string) =>
  parseLocalDate(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

const percent = (value: number) => `${Math.round(value * 100)}%`;

// "12% more than" / "5% less than" / "the same as".
const comparedText = (now: number, before: number | null) => {
  if (before === null || before <= 0) return null;
  const change = (now - before) / before;
  if (Math.abs(change) < 0.005) return 'the same as';
  return `${percent(Math.abs(change))} ${change > 0 ? 'more' : 'less'} than`;
};

const categoryLabel = (category: string) =>
  `${TAG_CATEGORIES[category]?.icon ?? ''} ${category}`.trim();

export const YearReviewModal: React.FC<YearReviewModalProps> = ({
  isOpen,
  onClose,
  accounts,
  today,
}) => {
  const { isPrivacyMode } = useFinancial();
  const years = useMemo(
    () =>
      reviewYears(
        accounts.flatMap((acc) => acc.transactions || []),
        today
      ),
    [accounts, today]
  );
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const review = useMemo(
    () => yearReview(accounts, year, today),
    [accounts, year, today]
  );

  if (!isOpen) return null;

  const money = (amount: number) =>
    isPrivacyMode ? '••••' : formatMoney(amount);
  const balance = (amount: number) =>
    isPrivacyMode ? '••••' : formatBalance(amount);
  const signed = (amount: number) =>
    isPrivacyMode ? '••••' : formatSignedMoney(amount);

  const lastYear = review.partial
    ? 'the same days last year'
    : 'the year before';
  const incomeCompared = comparedText(review.income, review.previousIncome);
  const spendingCompared = comparedText(
    review.spending,
    review.previousSpending
  );
  const worthChange = review.netWorthEnd - review.netWorthStart;
  const empty = review.transactionCount === 0;
  const topCategory = Math.max(0, ...review.categories.map((c) => c.amount));
  const topMerchant = Math.max(0, ...review.merchants.map((m) => m.amount));

  const tiles = [
    {
      label: 'Income',
      value: money(review.income),
      detail: incomeCompared ? `${incomeCompared} ${lastYear}` : null,
    },
    {
      label: 'Spending',
      value: money(review.spending),
      detail: spendingCompared ? `${spendingCompared} ${lastYear}` : null,
    },
    {
      label: review.saved < 0 ? 'Overspent' : 'Saved',
      value: money(review.saved),
      detail:
        review.income > 0 && review.saved >= 0
          ? `${percent(review.savingsRate)} of income`
          : null,
    },
    {
      label: 'Net worth',
      value: balance(review.netWorthEnd),
      detail: `${signed(worthChange)} since ${shortDate(
        review.dataStart ?? `${year}-01-01`
      )}`,
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="year-review-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-full overflow-y-auto text-left">
        <div className="flex items-start justify-between gap-4 p-6 border-b">
          <div>
            <h3
              id="year-review-title"
              className="text-lg font-semibold text-gray-900"
            >
              {year} in review
            </h3>
            <p className="text-sm text-gray-500" data-testid="review-range">
              {formatDateRange(review.range.start, review.range.end)}
              {review.partial && ' (so far)'}
            </p>
            {review.dataStart && (
              <p
                className="text-xs text-gray-500 mt-1"
                data-testid="review-data-start"
              >
                Your transactions start on{' '}
                {formatDateRange(review.dataStart, review.dataStart)}, so this
                covers {year} from then.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">
              <span className="sr-only">Year</span>
              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="review-year"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {empty ? (
          <p className="p-6 text-sm text-gray-600" data-testid="review-empty">
            No income or spending in {year}.
          </p>
        ) : (
          <div className="p-6 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {tiles.map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-lg border p-3"
                  data-testid={`review-${tile.label
                    .toLowerCase()
                    .replace(' ', '-')}`}
                >
                  <div className="text-xs font-medium text-gray-500">
                    {tile.label}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 tabular-nums">
                    {tile.value}
                  </div>
                  {tile.detail && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {tile.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <section>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Highlights
              </h4>
              <ul
                className="space-y-1 text-sm text-gray-700"
                data-testid="review-highlights"
              >
                {review.biggestPurchase && (
                  <li>
                    Biggest purchase:{' '}
                    <span className="font-medium text-gray-900">
                      {money(review.biggestPurchase.amount)}
                    </span>{' '}
                    at {review.biggestPurchase.merchant} on{' '}
                    {shortDate(review.biggestPurchase.date)}
                  </li>
                )}
                {review.biggestMonth && (
                  <li>
                    You spent the most in{' '}
                    <span className="font-medium text-gray-900">
                      {monthName(review.biggestMonth.month)}
                    </span>{' '}
                    ({money(review.biggestMonth.spending)})
                  </li>
                )}
                {review.bestMonth && review.bestMonth.net > 0 && (
                  <li>
                    You saved the most in{' '}
                    <span className="font-medium text-gray-900">
                      {monthName(review.bestMonth.month)}
                    </span>{' '}
                    ({money(review.bestMonth.net)})
                  </li>
                )}
                <li>
                  {review.transactionCount.toLocaleString('en-US')}{' '}
                  {review.transactionCount === 1
                    ? 'transaction'
                    : 'transactions'}
                </li>
              </ul>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Top categories
                </h4>
                <ol className="space-y-2" data-testid="review-categories">
                  {review.categories.map((c) => (
                    <li key={c.category} className="text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="truncate text-gray-700">
                          {categoryLabel(c.category)}
                        </span>
                        <span className="tabular-nums text-gray-900">
                          {money(c.amount)}{' '}
                          <span className="text-xs text-gray-500">
                            {percent(c.share)}
                          </span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded bg-gray-100">
                        <div
                          className="h-full rounded bg-blue-500"
                          style={{
                            width: `${(c.amount / topCategory) * 100}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
              <section>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Top merchants
                </h4>
                <ol className="space-y-2" data-testid="review-merchants">
                  {review.merchants.map((m) => (
                    <li key={m.merchant} className="text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="truncate text-gray-700">
                          {m.merchant}{' '}
                          <span className="text-xs text-gray-500">
                            × {m.count}
                          </span>
                        </span>
                        <span className="tabular-nums text-gray-900">
                          {money(m.amount)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded bg-gray-100">
                        <div
                          className="h-full rounded bg-orange-500"
                          style={{
                            width: `${(m.amount / topMerchant) * 100}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <section>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Month by month
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="review-months">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="py-2 font-medium">Month</th>
                      <th className="py-2 font-medium text-right">Income</th>
                      <th className="py-2 font-medium text-right">Spending</th>
                      <th className="py-2 font-medium text-right">Saved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {review.months.map((m) => (
                      <tr key={m.month} className="border-b last:border-0">
                        <td className="py-1.5 text-gray-900">
                          {monthName(m.month)}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {money(m.income)}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {money(m.spending)}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {signed(m.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
