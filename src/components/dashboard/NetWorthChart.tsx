import React, { useState } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { MonthWorth } from '../../utils/netWorthHistory';
import { formatMoney, formatSignedMoney } from '../../utils/format';

interface NetWorthChartProps {
  months: MonthWorth[];
  onOpenAccount: (accountId: string) => void;
}

// Categorical slot 1 of the reference palette, as in the cash flow chart.
const LINE_COLOR = '#2a78d6';

const monthName = (month: string, style: 'short' | 'long') => {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon - 1, 1).toLocaleDateString('en-US', {
    month: style,
    ...(style === 'long' ? { year: 'numeric' } : {}),
  });
};

// A round number at or above `value`, so the gridlines read cleanly.
const niceCeil = (value: number) => {
  if (value <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value)!;
  return step * magnitude;
};

const compact = (value: number) => {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  return abs >= 1000
    ? `${sign}$${(abs / 1000).toLocaleString('en-US', {
        maximumFractionDigits: 1,
      })}k`
    : `${sign}$${Math.round(abs)}`;
};

export const NetWorthChart: React.FC<NetWorthChartProps> = ({
  months,
  onOpenAccount,
}) => {
  const { isPrivacyMode } = useFinancial();
  const current = months[months.length - 1];
  // Clicking picks a month; hovering previews one.
  const [selected, setSelected] = useState(current.month);
  const [hovered, setHovered] = useState<string | null>(null);

  const money = (amount: number) =>
    isPrivacyMode ? '••••' : formatMoney(amount);
  const signedMoney = (amount: number) =>
    isPrivacyMode ? '••••' : formatSignedMoney(amount);

  const nets = months.map((m) => m.net);
  const top = niceCeil(Math.max(0, ...nets)) || 100;
  const low = Math.min(0, ...nets);
  const bottom = low < 0 ? -niceCeil(-low) : 0;
  const y = (value: number) => ((top - value) / (top - bottom)) * 100;
  const x = (index: number) => ((index + 0.5) / months.length) * 100;
  const gridlines = bottom < 0 ? [top, 0, bottom] : [top, top / 2, 0];

  const change = Math.round((current.net - months[0].net) * 100) / 100;
  const shown =
    months.find((m) => m.month === (hovered ?? selected)) ?? current;

  return (
    <div
      className="bg-white rounded-lg shadow-sm border p-6 text-left"
      data-testid="net-worth-card"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
        <h3 className="text-lg font-semibold text-gray-900">
          Net worth · last 12 months
        </h3>
        <span
          className="text-2xl font-bold text-gray-900 tabular-nums"
          data-testid="net-worth-total"
        >
          {money(current.net)}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-4" data-testid="net-worth-summary">
        {change === 0
          ? 'No change'
          : `${change > 0 ? 'Up' : 'Down'} ${money(Math.abs(change))}`}{' '}
        since the end of {monthName(months[0].month, 'long')} · what you own
        minus what you owe
      </p>

      <div className="relative h-40 pl-12" aria-hidden="true">
        {gridlines.map((value) => (
          <div
            key={value}
            className={`absolute left-12 right-0 border-t ${
              value === 0 ? 'border-gray-300' : 'border-gray-100'
            }`}
            style={{ top: `${y(value)}%` }}
          >
            <span className="absolute -left-12 -top-2 w-11 text-right text-[10px] text-gray-400">
              {isPrivacyMode ? '' : compact(value)}
            </span>
          </div>
        ))}
        <div className="absolute inset-0 left-12">
          {/* Hover and click targets, under the line so it stays crisp. */}
          <div className="absolute inset-0 flex">
            {months.map((m) => (
              <button
                key={m.month}
                type="button"
                tabIndex={-1}
                onClick={() => setSelected(m.month)}
                onMouseEnter={() => setHovered(m.month)}
                onMouseLeave={() => setHovered(null)}
                className={`flex-1 h-full rounded-sm ${
                  m.month === shown.month ? 'bg-blue-50/60' : ''
                }`}
              />
            ))}
          </div>
          <svg
            className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              points={months.map((m, i) => `${x(i)},${y(m.net)}`).join(' ')}
              fill="none"
              stroke={LINE_COLOR}
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {months.map((m, i) => (
            <span
              key={m.month}
              className="absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full border-2 border-white pointer-events-none"
              style={{
                left: `${x(i)}%`,
                top: `${y(m.net)}%`,
                backgroundColor: LINE_COLOR,
                transform: m.month === shown.month ? 'scale(1.5)' : undefined,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex pl-12 mt-1">
        {months.map((m) => (
          <button
            key={m.month}
            type="button"
            onClick={() => setSelected(m.month)}
            aria-pressed={m.month === selected}
            aria-label={`Net worth ${
              m.month === current.month
                ? 'today'
                : `at the end of ${monthName(m.month, 'long')}`
            }: ${money(m.net)}`}
            className={`flex-1 text-center text-[10px] sm:text-xs rounded ${
              m.month === selected
                ? 'font-semibold text-gray-900'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {monthName(m.month, 'short')}
          </button>
        ))}
      </div>

      <div
        className="mt-4 border-t pt-4"
        aria-live="polite"
        data-testid="net-worth-detail"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <h4 className="text-sm font-semibold text-gray-900">
            {shown.month === current.month
              ? 'Today'
              : `End of ${monthName(shown.month, 'long')}`}
          </h4>
          <span className="text-sm text-gray-600">
            Own {money(shown.assets)} · Owe {money(shown.debts)} ·{' '}
            <span className="font-semibold text-gray-900 whitespace-nowrap">
              Net {money(shown.net)}
            </span>
          </span>
        </div>
        <ul className="divide-y divide-gray-100 text-sm">
          {shown.accounts.map((account) => (
            <li
              key={account.id}
              className="flex justify-between gap-3 py-1.5"
              data-testid={`net-worth-account-${account.id}`}
            >
              <button
                type="button"
                onClick={() => onOpenAccount(account.id)}
                className="text-gray-700 hover:text-blue-600 hover:underline truncate min-w-0 text-left"
              >
                {account.name}
              </button>
              <span
                className={`tabular-nums whitespace-nowrap ${
                  account.balance < 0 ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {account.balance < 0
                  ? signedMoney(account.balance)
                  : money(account.balance)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
