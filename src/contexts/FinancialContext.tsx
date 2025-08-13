import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useState,
} from 'react';
import {
  FinancialState,
  FinancialAction,
  Account,
  FilterOptions,
  TimePeriod,
  FinancialSummary,
} from '../types/financial';
import { MOCK_ACCOUNTS } from '../constants/financial';
import { calculateFinancialSummary } from '../utils/periodCalculations';
import { updateTransactionTagsInAccounts, updateTransactionTagsInArray } from '../utils/transactionUtils';

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
        currentScreen: 'account-detail',
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
        accounts: updateTransactionTagsInAccounts(state.accounts, action.payload.transactionId, action.payload.tag, 'add'),
        transactions: updateTransactionTagsInArray(state.transactions, action.payload.transactionId, action.payload.tag, 'add'),
      };
    case 'REMOVE_TAG':
      return {
        ...state,
        accounts: updateTransactionTagsInAccounts(state.accounts, action.payload.transactionId, action.payload.tag, 'remove'),
        transactions: updateTransactionTagsInArray(state.transactions, action.payload.transactionId, action.payload.tag, 'remove'),
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
        customDateRange: action.payload,
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
  setCustomDateRange: (
    startDate: string,
    endDate: string,
    label?: string
  ) => void;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  accountFilter: 'both' | 'personal' | 'business';
  setAccountFilter: (filter: 'both' | 'personal' | 'business') => void;
}

const FinancialContext = createContext<FinancialContextType | null>(null);

interface FinancialProviderProps {
  children: React.ReactNode;
  initialState?: FinancialState;
}

export const FinancialProvider: React.FC<FinancialProviderProps> = ({
  children,
  initialState: customInitialState,
}) => {
  const [state, dispatch] = useReducer(financialReducer, customInitialState || initialState);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [accountFilter, setAccountFilter] = useState<
    'both' | 'personal' | 'business'
  >('personal');

  const totalBalance = useMemo(
    () => state.accounts.reduce((sum, account) => sum + account.balance, 0),
    [state.accounts]
  );

  const summary = useMemo((): FinancialSummary => {
    return calculateFinancialSummary(
      state.transactions,
      state.selectedPeriod,
      state.customDateRange,
      totalBalance
    );
  }, [
    state.transactions,
    totalBalance,
    state.selectedPeriod,
    state.customDateRange,
  ]);

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

  const setCustomDateRange = (
    startDate: string,
    endDate: string,
    label?: string
  ) => {
    dispatch({
      type: 'SET_CUSTOM_DATE_RANGE',
      payload: {
        startDate,
        endDate,
        label: label || 'Custom Range',
      },
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
