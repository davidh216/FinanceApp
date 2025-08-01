import React, { createContext, useContext, useReducer, useMemo, useState } from 'react';
import {
  FinancialState,
  FinancialAction,
  Account,
  FilterOptions,
  TimePeriod,
  FinancialSummary,
} from '../types/financial';
import { MOCK_ACCOUNTS } from '../constants/financial';

const initialState: FinancialState = {
  accounts: MOCK_ACCOUNTS,
  transactions: MOCK_ACCOUNTS.flatMap((acc) => acc.transactions || []),
  selectedAccount: null,
  currentScreen: 'dashboard',
  selectedPeriod: 'month',
  isLoading: false,
  error: null,
  filters: {},
  sortBy: 'date-desc',
};

const financialReducer = (
  state: FinancialState,
  action: FinancialAction
): FinancialState => {
  switch (action.type) {
    case 'VIEW_ACCOUNT_DETAIL':
      return {
        ...state,
        selectedAccount: action.payload,
        currentScreen: 'account-detail'
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SELECT_ACCOUNT':
      return { ...state, selectedAccount: action.payload };
    case 'CHANGE_SCREEN':
      return { ...state, currentScreen: action.payload };
    case 'CHANGE_PERIOD':
      return { ...state, selectedPeriod: action.payload };
    case 'ADD_TAG':
      return {
        ...state,
        accounts: state.accounts.map((account) => ({
          ...account,
          transactions: account.transactions?.map((txn) =>
            txn.id === action.payload.transactionId
              ? {
                  ...txn,
                  tags: Array.from(new Set([...txn.tags, action.payload.tag])),
                }
              : txn
          ),
        })),
        transactions: state.transactions.map((txn) =>
          txn.id === action.payload.transactionId
            ? {
                ...txn,
                tags: Array.from(new Set([...txn.tags, action.payload.tag])),
              }
            : txn
        ),
      };
    case 'REMOVE_TAG':
      return {
        ...state,
        accounts: state.accounts.map((account) => ({
          ...account,
          transactions: account.transactions?.map((txn) =>
            txn.id === action.payload.transactionId
              ? {
                  ...txn,
                  tags: txn.tags.filter((tag) => tag !== action.payload.tag),
                }
              : txn
          ),
        })),
        transactions: state.transactions.map((txn) =>
          txn.id === action.payload.transactionId
            ? {
                ...txn,
                tags: txn.tags.filter((tag) => tag !== action.payload.tag),
              }
            : txn
        ),
      };
    case 'CONNECT_ACCOUNT':
      return {
        ...state,
        accounts: [...state.accounts, action.payload],
        transactions: [
          ...state.transactions,
          ...(action.payload.transactions || []),
        ],
      };
    case 'APPLY_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_CUSTOM_DATE_RANGE':
      return { 
        ...state, 
        selectedPeriod: 'custom',
        customDateRange: action.payload 
      };
    default:
      return state;
  }
};

interface FinancialContextType {
  state: FinancialState;
  dispatch: React.Dispatch<FinancialAction>;
  totalBalance: number;
  summary: FinancialSummary;
  selectAccount: (account: Account | null) => void;
  changeScreen: (screen: 'dashboard' | 'accounts' | 'transactions') => void;
  changePeriod: (period: TimePeriod) => void;
  addTag: (transactionId: string, tag: string) => void;
  removeTag: (transactionId: string, tag: string) => void;
  applyFilters: (filters: FilterOptions) => void;
  viewAccountDetail: (account: Account) => void;
  setCustomDateRange: (startDate: string, endDate: string, label?: string) => void;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  accountFilter: 'both' | 'personal' | 'business';
  setAccountFilter: (filter: 'both' | 'personal' | 'business') => void;
}

const FinancialContext = createContext<FinancialContextType | null>(null);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(financialReducer, initialState);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [accountFilter, setAccountFilter] = useState<'both' | 'personal' | 'business'>('personal');

  const totalBalance = useMemo(
    () => state.accounts.reduce((sum, account) => sum + account.balance, 0),
    [state.accounts]
  );

  const summary = useMemo((): FinancialSummary => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    let periodLabel: string;

    // Calculate period boundaries based on selectedPeriod
    switch (state.selectedPeriod) {
      case 'day':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(); // Today
        periodLabel = 'daily';
        break;
      case 'week':
        const dayOfWeek = today.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysToSubtract);
        endDate = new Date(); // Today
        periodLabel = 'weekly';
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(); // Today
        periodLabel = 'monthly';
        break;
      case 'quarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
        endDate = new Date(); // Today
        periodLabel = 'quarterly';
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(); // Today
        periodLabel = 'yearly';
        break;
      case '5year':
        startDate = new Date(today.getFullYear() - 5, 0, 1);
        endDate = new Date(); // Today
        periodLabel = '5-year';
        break;
      case 'custom':
        if (state.customDateRange) {
          startDate = new Date(state.customDateRange.startDate);
          endDate = new Date(state.customDateRange.endDate);
          periodLabel = state.customDateRange.label || 'custom';
        } else {
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(); // Today
          periodLabel = 'monthly';
        }
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(); // Today
        periodLabel = 'monthly';
    }
    
    // Filter transactions for the selected period
    const periodTransactions = state.transactions.filter((txn) => {
      const txnDate = new Date(txn.date);
      return txnDate >= startDate && txnDate <= endDate;
    });


    const periodIncome = periodTransactions
      .filter((txn) => txn.amount > 0)
      .reduce((sum, txn) => sum + txn.amount, 0);

    const periodExpenses = Math.abs(
      periodTransactions
        .filter((txn) => txn.amount < 0)
        .reduce((sum, txn) => sum + txn.amount, 0)
    );


    const savingsRate = periodIncome > 0 ? (periodIncome - periodExpenses) / periodIncome : 0;

    // Calculate previous period for comparison
    let prevStartDate: Date;
    switch (state.selectedPeriod) {
      case 'day':
        prevStartDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        break;
      case 'week':
        const prevWeekDaysToSubtract = (today.getDay() === 0 ? 6 : today.getDay() - 1) + 7;
        prevStartDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - prevWeekDaysToSubtract);
        break;
      case 'month':
        prevStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        break;
      case 'quarter':
        const prevQuarter = Math.floor(today.getMonth() / 3) - 1;
        prevStartDate = prevQuarter >= 0 
          ? new Date(today.getFullYear(), prevQuarter * 3, 1)
          : new Date(today.getFullYear() - 1, 9, 1); // Q4 of previous year
        break;
      case 'year':
        prevStartDate = new Date(today.getFullYear() - 1, 0, 1);
        break;
      case '5year':
        prevStartDate = new Date(today.getFullYear() - 10, 0, 1);
        break;
      default:
        prevStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    }

    const prevEndDate = new Date(startDate.getTime() - 1); // Day before current period starts
    
    const prevPeriodTransactions = state.transactions.filter((txn) => {
      const txnDate = new Date(txn.date);
      return txnDate >= prevStartDate && txnDate <= prevEndDate;
    });

    const prevPeriodIncome = prevPeriodTransactions
      .filter((txn) => txn.amount > 0)
      .reduce((sum, txn) => sum + txn.amount, 0);

    const prevPeriodExpenses = Math.abs(
      prevPeriodTransactions
        .filter((txn) => txn.amount < 0)
        .reduce((sum, txn) => sum + txn.amount, 0)
    );

    return {
      totalBalance,
      monthlyIncome: Math.round(periodIncome * 100) / 100,
      monthlyExpenses: Math.round(periodExpenses * 100) / 100,
      netWorth: totalBalance,
      debtToIncomeRatio: periodIncome > 0 ? periodExpenses / periodIncome : 0,
      savingsRate: Math.max(0, savingsRate),
      // Add comparison data for trends
      previousPeriodIncome: prevPeriodIncome,
      previousPeriodExpenses: prevPeriodExpenses,
      periodLabel,
    };
  }, [state.transactions, totalBalance, state.selectedPeriod]);

  const selectAccount = (account: Account | null) => {
    dispatch({ type: 'SELECT_ACCOUNT', payload: account });
  };

  const changeScreen = (screen: 'dashboard' | 'accounts' | 'transactions') => {
    dispatch({ type: 'CHANGE_SCREEN', payload: screen });
  };

  const changePeriod = (period: TimePeriod) => {
    dispatch({ type: 'CHANGE_PERIOD', payload: period });
  };

  const addTag = (transactionId: string, tag: string) => {
    dispatch({ type: 'ADD_TAG', payload: { transactionId, tag } });
  };

  const removeTag = (transactionId: string, tag: string) => {
    dispatch({ type: 'REMOVE_TAG', payload: { transactionId, tag } });
  };

  const applyFilters = (filters: FilterOptions) => {
    dispatch({ type: 'APPLY_FILTERS', payload: filters });
  };

  const viewAccountDetail = (account: Account) => {
    dispatch({ type: 'VIEW_ACCOUNT_DETAIL', payload: account });
  };

    const setCustomDateRange = (startDate: string, endDate: string, label?: string) => {
    dispatch({
      type: 'SET_CUSTOM_DATE_RANGE',
      payload: {
        startDate,
        endDate,
        label: label || 'Custom Range'
      }
    });
  };

  const togglePrivacyMode = () => {
    setIsPrivacyMode(!isPrivacyMode);
  };

  const value: FinancialContextType = {
    state,
    dispatch,
    totalBalance,
    summary,
    selectAccount,
    changeScreen,
    changePeriod,
    addTag,
    removeTag,
    applyFilters,
    viewAccountDetail,
    setCustomDateRange,
    isPrivacyMode,
    togglePrivacyMode,
    accountFilter,
    setAccountFilter,
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = (): FinancialContextType => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};
