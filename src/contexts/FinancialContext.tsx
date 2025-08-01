import React, { createContext, useContext, useReducer, useMemo } from 'react';
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
}

const FinancialContext = createContext<FinancialContextType | null>(null);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(financialReducer, initialState);

  const totalBalance = useMemo(
    () => state.accounts.reduce((sum, account) => sum + account.balance, 0),
    [state.accounts]
  );

  const summary = useMemo((): FinancialSummary => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyTransactions = state.transactions.filter((txn) =>
      txn.date.startsWith(currentMonth)
    );

    const monthlyIncome = monthlyTransactions
      .filter((txn) => txn.amount > 0)
      .reduce((sum, txn) => sum + txn.amount, 0);

    const monthlyExpenses = Math.abs(
      monthlyTransactions
        .filter((txn) => txn.amount < 0)
        .reduce((sum, txn) => sum + txn.amount, 0)
    );

    const savingsRate =
      monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0;

    return {
      totalBalance,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
      netWorth: totalBalance,
      debtToIncomeRatio:
        monthlyIncome > 0 ? monthlyExpenses / monthlyIncome : 0,
      savingsRate: Math.max(0, savingsRate),
    };
  }, [state.transactions, totalBalance]);

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
