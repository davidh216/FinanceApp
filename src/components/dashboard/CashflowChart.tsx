import React, { useState } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { MonthFlow } from '../../utils/cashflowHistory';
import { formatMoney, formatSignedMoney } from '../../utils/format';

interface CashflowChartProps {
  months: MonthFlow[];
  // The current month, which is still in progress.
  currentMonth: string;
  onSelectMonth: (month: string) => void;
  onOpenYearReview?: () => void;
}

// Categorical slots 1 and 2 of the reference palette: validated as an
// adjacent pair for colour-blind readers, and both over 3:1 on white.
const INCOME_COLOR = '#2a78d6';
const SPENDING_COLOR = '#eb6834';

const monthName = (month: string, style: 'short' | 'long') => {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon - 1, 1).toLocaleDateString('en-US', {
    month: style,
    ...(style === 'long' ? { year: 'numeric' } : {}),
  });
};

// A round number just above the largest bar, so the gridlines read cleanly.
const niceMax = (value: number) => {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value)!;
  return step * magnitude;
};

const compact = (value: number) =>
  value >= 1000
    ? `$${(value / 1000).toLocaleString('en-US', {
        maximumFractionDigits: 1,
      })}k`
    : `$${Math.round(value)}`;

export const CashflowChart: React.FC<CashflowChartProps> = ({
  months,
  currentMonth,
  onSelectMonth,
  onOpenYearReview,
}) => {
  const { isPrivacyMode } = useFinancial();
  const [active, setActive] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  const money = (amount: number) =>
    isPrivacyMode ? '••••' : formatMoney(amount);
  const signed = (amount: number) =>
    isPrivacyMode ? '••••' : formatSignedMoney(amount);
  // "Saved $120.00", or "Overspent $40.00" when spending was higher.
  const savedText = (net: number) =>
    net < 0 ? `Overspent ${money(-net)}` : `Saved ${money(net)}`;

  const top = niceMax(
    Math.max(0, ...months.flatMap((m) => [m.income, m.spending]))
  );
  const saved = months.reduce((sum, m) => sum + m.net, 0);
  const completeMonths = months.filter((m) => m.month !== currentMonth);
  const average =
    completeMonths.length > 0
      ? completeMonths.reduce((sum, m) => sum + m.net, 0) /
        completeMonths.length
      : 0;
  const activeMonth = months.find((m) => m.month === active);
  // Over the month, kept clear of the card's edges.
  const activeIndex = months.findIndex((m) => m.month === active);
  const tooltipLeft = `calc(2.5rem + (100% - 2.5rem) * ${Math.min(
    0.85,
    Math.max(0.15, (activeIndex + 0.5) / months.length)
  )})`;

  return (
    <div
      className="bg-white rounded-lg shadow-sm border p-6 text-left"
      data-testid="cashflow-card"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h3 className="text-lg font-semibold text-gray-900">
          Cash flow · last 12 months
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: INCOME_COLOR }}
            />
            Income
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: SPENDING_COLOR }}
            />
            Spending
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4" data-testid="cashflow-summary">
        {savedText(saved)} over 12 months · {signed(average)} a month on average
        · click a month for its spending
      </p>

      <div className="relative h-44 pl-10" aria-hidden="true">
        {/* Gridlines at 0, half and the top of the scale. */}
        {[1, 0.5, 0].map((fraction) => (
          <div
            key={fraction}
            className="absolute left-10 right-0 border-t border-gray-100"
            style={{ bottom: `${fraction * 100}%` }}
          >
            <span className="absolute -left-10 -top-2 w-9 text-right text-[10px] text-gray-400">
              {isPrivacyMode ? '' : compact(top * fraction)}
            </span>
          </div>
        ))}
        <div className="absolute inset-0 left-10 flex items-end">
          {months.map((m) => (
            <button
              key={m.month}
              type="button"
              tabIndex={-1}
              onClick={() => onSelectMonth(m.month)}
              onMouseEnter={() => setActive(m.month)}
              onMouseLeave={() => setActive(null)}
              className={`flex-1 h-full flex items-end justify-center gap-0.5 rounded-sm ${
                active === m.month ? 'bg-gray-50' : ''
              }`}
            >
              {[
                [m.income, INCOME_COLOR],
                [m.spending, SPENDING_COLOR],
              ].map(([value, color]) => (
                <span
                  key={color as string}
                  className="w-[30%] max-w-[14px] rounded-t"
                  style={{
                    height: `${((value as number) / top) * 100}%`,
                    minHeight: (value as number) > 0 ? 2 : 0,
                    backgroundColor: color as string,
                    opacity: m.month === currentMonth ? 0.55 : 1,
                  }}
                />
              ))}
            </button>
          ))}
        </div>

        {activeMonth && (
          <div
            className="absolute top-0 -translate-x-1/2 z-10 rounded-md border bg-white px-3 py-2 text-xs shadow-md pointer-events-none whitespace-nowrap"
            style={{ left: tooltipLeft }}
            data-testid="cashflow-tooltip"
          >
            <div className="font-medium text-gray-900 mb-1">
              {monthName(activeMonth.month, 'long')}
              {activeMonth.month === currentMonth && ' (so far)'}
            </div>
            {(
              [
                ['Income', activeMonth.income, INCOME_COLOR],
                ['Spending', activeMonth.spending, SPENDING_COLOR],
              ] as const
            ).map(([label, value, color]) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-0.5"
                  style={{ backgroundColor: color }}
                />
                <span className="font-semibold text-gray-900 tabular-nums">
                  {money(value)}
                </span>
                <span className="text-gray-500">{label}</span>
              </div>
            ))}
            <div className="mt-1 text-gray-600">
              {savedText(activeMonth.net)}
            </div>
          </div>
        )}
      </div>

      {/* Month labels; the buttons below are the keyboard and screen
          reader route to each month's report. */}
      <div className="flex pl-10 mt-1">
        {months.map((m) => (
          <button
            key={m.month}
            type="button"
            onClick={() => onSelectMonth(m.month)}
            onFocus={() => setActive(m.month)}
            onBlur={() => setActive(null)}
            aria-label={`${monthName(m.month, 'long')}${
              m.month === currentMonth ? ' so far' : ''
            }: income ${money(m.income)}, spending ${money(
              m.spending
            )}, ${savedText(m.net).toLowerCase()}. Open the spending report.`}
            className="flex-1 text-center text-[10px] sm:text-xs text-gray-500 hover:text-gray-900 rounded"
          >
            {monthName(m.month, 'short')}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <button
          onClick={() => setShowTable(!showTable)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {showTable ? 'Hide table' : 'Show as a table'}
        </button>
        {onOpenYearReview && (
          <button
            onClick={onOpenYearReview}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Year in review
          </button>
        )}
      </div>
      {showTable && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm" data-testid="cashflow-table">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="py-2 font-medium">Month</th>
                <th className="py-2 font-medium text-right">Income</th>
                <th className="py-2 font-medium text-right">Spending</th>
                <th className="py-2 font-medium text-right">Saved</th>
              </tr>
            </thead>
            <tbody>
              {[...months].reverse().map((m) => (
                <tr key={m.month} className="border-b last:border-0">
                  <td className="py-1.5 text-gray-900">
                    {monthName(m.month, 'long')}
                    {m.month === currentMonth && ' (so far)'}
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
      )}
    </div>
  );
};
