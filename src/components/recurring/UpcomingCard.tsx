import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Account } from '../../types/financial';
import { useFinancial } from '../../contexts/FinancialContext';
import {
  AccountForecast,
  FORECAST_DAYS,
  UpcomingEvent,
} from '../../utils/forecast';
import { formatDateRange } from '../../utils/date';
import { formatMoney, formatSignedMoney } from '../../utils/format';

interface UpcomingCardProps {
  events: UpcomingEvent[];
  forecasts: AccountForecast[];
  accounts: Account[];
}

// Shows this many before "Show all".
const COLLAPSED = 6;

// "Oct 3, 2026"
const formatDay = (date: string) => formatDateRange(date, date);

// Bills and paychecks expected in the next 30 days, and where they leave
// each account.
export const UpcomingCard: React.FC<UpcomingCardProps> = ({
  events,
  forecasts,
  accounts,
}) => {
  const { isPrivacyMode } = useFinancial();
  const [expanded, setExpanded] = useState(false);
  if (events.length === 0) return null;

  const money = (amount: number) =>
    isPrivacyMode ? '••••' : formatMoney(amount);
  const signed = (amount: number) =>
    isPrivacyMode ? '••••' : formatSignedMoney(amount);
  // A balance: no plus sign, but a minus when it's below zero.
  const balance = (amount: number) =>
    amount < 0 ? signed(amount) : money(amount);
  const accountName = (id: string) =>
    accounts.find((acc) => acc.id === id)?.name ?? '';

  const bills = events
    .filter((e) => e.kind === 'bill')
    .reduce((sum, e) => sum - e.amount, 0);
  const income = events
    .filter((e) => e.kind === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const warnings = forecasts.filter((f) => f.goesNegative);
  const shown = expanded ? events : events.slice(0, COLLAPSED);

  return (
    <div
      className="bg-white rounded-lg shadow-sm border p-6 text-left"
      data-testid="upcoming-card"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Coming up · next {FORECAST_DAYS} days
      </h3>
      <p className="text-sm text-gray-500 mb-4" data-testid="upcoming-totals">
        Bills {money(bills)}
        {income > 0 && <> · Income {money(income)}</>} · from regular payments
      </p>

      {warnings.map((f) => (
        <p
          key={f.accountId}
          className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800"
          role="alert"
          data-testid={`upcoming-warning-${f.accountId}`}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            {f.name} could go below $0 around {formatDay(f.lowestDate)}, to{' '}
            {balance(f.lowest)}, unless money comes in first.
          </span>
        </p>
      ))}

      <ul className="divide-y divide-gray-100">
        {shown.map((e, i) => (
          <li
            key={`${e.merchant}-${e.date}-${i}`}
            className="py-2.5 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {e.merchant}
              </div>
              <div className="text-xs text-gray-500">
                {e.late ? 'Due now' : formatDay(e.date)} ·{' '}
                {accountName(e.accountId)}
              </div>
            </div>
            <div
              className={`text-sm font-medium tabular-nums shrink-0 ${
                e.amount > 0 ? 'text-green-600' : 'text-gray-900'
              }`}
            >
              {signed(e.amount)}
            </div>
          </li>
        ))}
      </ul>
      {events.length > COLLAPSED && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {expanded ? 'Show fewer' : `Show all ${events.length}`}
        </button>
      )}

      {forecasts.length > 0 && (
        <div className="mt-4 border-t pt-3 space-y-1 text-sm">
          {forecasts.map((f) => (
            <div
              key={f.accountId}
              className="flex justify-between gap-3"
              data-testid={`upcoming-forecast-${f.accountId}`}
            >
              <span className="text-gray-700 truncate">{f.name}</span>
              <span className="text-gray-600 tabular-nums whitespace-nowrap">
                {balance(f.now)} now → {balance(f.end)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
