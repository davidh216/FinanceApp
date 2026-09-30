import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
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
  Transaction,
} from '../types/financial';
import { MOCK_ACCOUNTS } from '../constants/financial';
import { isImportedAccount } from '../utils/csvImport';
import { parseLocalDate } from '../utils/date';
import { incomeOf, spendingOf } from '../utils/cashflow';
import { Budgets, cleanBudgets } from '../utils/budgets';
import {
  markAsTransfer as markTransfer,
  unlinkTransfer as unlinkTransferIn,
} from '../utils/transfers';

const IMPORTED_ACCOUNTS_STORAGE_KEY = 'financeapp.importedAccounts';
const SHOW_DEMO_ACCOUNTS_STORAGE_KEY = 'financeapp.showDemoAccounts';
const BUDGETS_STORAGE_KEY = 'financeapp.budgets';

const loadBudgets = (): Budgets => {
  try {
    return cleanBudgets(
      JSON.parse(window.localStorage.getItem(BUDGETS_STORAGE_KEY) || '{}')
    );
  } catch {
    return {};
  }
};

const loadShowDemoAccounts = (): boolean => {
  try {
    return (
      window.localStorage.getItem(SHOW_DEMO_ACCOUNTS_STORAGE_KEY) === 'true'
    );
  } catch {
    return false;
  }
};

const loadImportedAccounts = (): Account[] => {
  try {
    const stored = window.localStorage.getItem(IMPORTED_ACCOUNTS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (account) =>
            typeof account?.id === 'string' && isImportedAccount(account)
        )
      : [];
  } catch {
    return [];
  }
};

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

const createInitialState = (state: FinancialState): FinancialState => {
  const accounts = [...state.accounts, ...loadImportedAccounts()];
  return {
    ...state,
    accounts,
    transactions: accounts.flatMap((acc) => acc.transactions || []),
  };
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
    case 'SET_CATEGORY': {
      // The suggestion follows your choice, so the "Suggest" tag matches it.
      const recategorize = (txn: Transaction): Transaction =>
        txn.id === action.payload.transactionId
          ? {
              ...txn,
              category: action.payload.category,
              cleanMerchant: {
                ...txn.cleanMerchant,
                suggestedCategory: action.payload.category,
              },
            }
          : txn;
      return {
        ...state,
        accounts: state.accounts.map((account) => ({
          ...account,
          transactions: account.transactions?.map(recategorize),
        })),
        transactions: state.transactions.map(recategorize),
      };
    }
    case 'CONNECT_ACCOUNT':
      return {
        ...state,
        accounts: [...state.accounts, action.payload],
        transactions: [
          ...state.transactions,
          ...(action.payload.transactions || []),
        ],
      };
    case 'REPLACE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map((acc) =>
          acc.id === action.payload.id ? action.payload : acc
        ),
        transactions: [
          ...state.transactions.filter(
            (txn) => txn.accountId !== action.payload.id
          ),
          ...(action.payload.transactions || []),
        ],
      };
    case 'REMOVE_ACCOUNT': {
      const isSelected = state.selectedAccount?.id === action.payload;
      return {
        ...state,
        accounts: state.accounts.filter((acc) => acc.id !== action.payload),
        transactions: state.transactions.filter(
          (txn) => txn.accountId !== action.payload
        ),
        selectedAccount: isSelected ? null : state.selectedAccount,
        currentScreen: isSelected ? 'dashboard' : state.currentScreen,
      };
    }
    case 'RESTORE_IMPORTED_ACCOUNTS': {
      const accounts = [
        ...state.accounts.filter((acc) => !isImportedAccount(acc)),
        ...action.payload,
      ];
      return {
        ...state,
        accounts,
        transactions: accounts.flatMap((acc) => acc.transactions || []),
        selectedAccount: null,
        currentScreen: 'dashboard',
      };
    }
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
  setCategory: (transactionId: string, category: string) => void;
  // Undoes a wrongly matched transfer, on both sides.
  unlinkTransfer: (transactionId: string) => void;
  // Records a missed transfer to or from another imported account, or
  // EXTERNAL_ACCOUNT_ID.
  markAsTransfer: (transactionId: string, otherAccountId: string) => void;
  applyFilters: (filters: FilterOptions) => void;
  viewAccountDetail: (account: Account) => void;
  importAccount: (account: Account) => void;
  updateImportedAccount: (account: Account) => void;
  // Saves changes to an account without opening it.
  replaceAccount: (account: Account) => void;
  removeAccount: (accountId: string) => void;
  // Replaces every imported account with a backup's.
  restoreImportedAccounts: (accounts: Account[]) => void;
  setCustomDateRange: (
    startDate: string,
    endDate: string,
    label?: string
  ) => void;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  accountFilter: 'both' | 'personal' | 'business';
  setAccountFilter: (filter: 'both' | 'personal' | 'business') => void;
  // True once the user has imported an account of their own.
  hasImportedAccounts: boolean;
  hasBusinessAccounts: boolean;
  // Whether the demo accounts are shown next to imported ones. They are
  // always shown until something is imported.
  showDemoAccounts: boolean;
  setShowDemoAccounts: (show: boolean) => void;
  // Monthly spending limits by category.
  budgets: Budgets;
  setBudgets: (budgets: Budgets) => void;
}

const FinancialContext = createContext<FinancialContextType | null>(null);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [fullState, dispatch] = useReducer(
    financialReducer,
    initialState,
    createInitialState
  );
  const [showDemoPreference, setShowDemoPreference] =
    useState(loadShowDemoAccounts);
  const hasImportedAccounts = fullState.accounts.some(isImportedAccount);
  const showDemoAccounts = !hasImportedAccounts || showDemoPreference;

  // Everything below, and every component, sees only the visible accounts:
  // once you import your own, the demo accounts drop out of the lists and
  // every total unless you choose to show them.
  const state = useMemo((): FinancialState => {
    if (showDemoAccounts) return fullState;
    const accounts = fullState.accounts.filter(isImportedAccount);
    const ids = new Set(accounts.map((account) => account.id));
    return {
      ...fullState,
      accounts,
      transactions: fullState.transactions.filter((txn) =>
        ids.has(txn.accountId)
      ),
    };
  }, [fullState, showDemoAccounts]);

  // The Personal / Business switch only applies when there are business
  // accounts to show; without any, everything counts as personal.
  const hasBusinessAccounts = state.accounts.some((account) =>
    account.type.includes('BUSINESS')
  );
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [accountFilter, setAccountFilter] = useState<
    'both' | 'personal' | 'business'
  >('personal');

  // Imported accounts are the only user data that must survive a reload;
  // mock accounts are regenerated on every load.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        IMPORTED_ACCOUNTS_STORAGE_KEY,
        JSON.stringify(fullState.accounts.filter(isImportedAccount))
      );
    } catch {
      // Storage can be unavailable (private mode, quota); imports still
      // work for the current session.
    }
  }, [fullState.accounts]);

  const [budgets, setBudgetsState] = useState<Budgets>(loadBudgets);

  const setBudgets = (next: Budgets) => {
    const cleaned = cleanBudgets(next);
    setBudgetsState(cleaned);
    try {
      window.localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(cleaned));
    } catch {
      // The budgets still apply for this session.
    }
  };

  const setShowDemoAccounts = (show: boolean) => {
    setShowDemoPreference(show);
    try {
      window.localStorage.setItem(SHOW_DEMO_ACCOUNTS_STORAGE_KEY, String(show));
    } catch {
      // The choice still applies for this session.
    }
  };

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
        startDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        endDate = new Date(); // Today
        periodLabel = 'daily';
        break;
      case 'week':
        const dayOfWeek = today.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
        startDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - daysToSubtract
        );
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
          startDate = parseLocalDate(state.customDateRange.startDate);
          endDate = parseLocalDate(state.customDateRange.endDate);
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
      const txnDate = parseLocalDate(txn.date);
      return txnDate >= startDate && txnDate <= endDate;
    });

    const periodIncome = incomeOf(periodTransactions);

    const periodExpenses = spendingOf(periodTransactions);

    const savingsRate =
      periodIncome > 0 ? (periodIncome - periodExpenses) / periodIncome : 0;

    // Calculate previous period for comparison
    let prevStartDate: Date;
    switch (state.selectedPeriod) {
      case 'day':
        prevStartDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 1
        );
        break;
      case 'week':
        const prevWeekDaysToSubtract =
          (today.getDay() === 0 ? 6 : today.getDay() - 1) + 7;
        prevStartDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - prevWeekDaysToSubtract
        );
        break;
      case 'month':
        prevStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        break;
      case 'quarter':
        const prevQuarter = Math.floor(today.getMonth() / 3) - 1;
        prevStartDate =
          prevQuarter >= 0
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
      const txnDate = parseLocalDate(txn.date);
      return txnDate >= prevStartDate && txnDate <= prevEndDate;
    });

    const prevPeriodIncome = incomeOf(prevPeriodTransactions);

    const prevPeriodExpenses = spendingOf(prevPeriodTransactions);

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

  const setCategory = (transactionId: string, category: string) => {
    dispatch({ type: 'SET_CATEGORY', payload: { transactionId, category } });
  };

  const unlinkTransfer = (transactionId: string) => {
    unlinkTransferIn(fullState.accounts, transactionId).forEach((account) =>
      dispatch({ type: 'REPLACE_ACCOUNT', payload: account })
    );
  };

  const markAsTransfer = (transactionId: string, otherAccountId: string) => {
    markTransfer(fullState.accounts, transactionId, otherAccountId).forEach(
      (account) => dispatch({ type: 'REPLACE_ACCOUNT', payload: account })
    );
  };

  const applyFilters = (filters: FilterOptions) => {
    dispatch({ type: 'APPLY_FILTERS', payload: filters });
  };

  const viewAccountDetail = (account: Account) => {
    dispatch({ type: 'VIEW_ACCOUNT_DETAIL', payload: account });
  };

  const importAccount = (account: Account) => {
    dispatch({ type: 'CONNECT_ACCOUNT', payload: account });
    dispatch({ type: 'VIEW_ACCOUNT_DETAIL', payload: account });
  };

  const updateImportedAccount = (account: Account) => {
    dispatch({ type: 'REPLACE_ACCOUNT', payload: account });
    dispatch({ type: 'VIEW_ACCOUNT_DETAIL', payload: account });
  };

  const replaceAccount = (account: Account) => {
    dispatch({ type: 'REPLACE_ACCOUNT', payload: account });
  };

  const removeAccount = (accountId: string) => {
    dispatch({ type: 'REMOVE_ACCOUNT', payload: accountId });
  };

  const restoreImportedAccounts = (accounts: Account[]) => {
    dispatch({ type: 'RESTORE_IMPORTED_ACCOUNTS', payload: accounts });
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
    setCategory,
    unlinkTransfer,
    markAsTransfer,
    applyFilters,
    viewAccountDetail,
    importAccount,
    updateImportedAccount,
    replaceAccount,
    removeAccount,
    restoreImportedAccounts,
    setCustomDateRange,
    isPrivacyMode,
    togglePrivacyMode,
    accountFilter: hasBusinessAccounts ? accountFilter : 'personal',
    setAccountFilter,
    hasImportedAccounts,
    hasBusinessAccounts,
    showDemoAccounts,
    setShowDemoAccounts,
    budgets,
    setBudgets,
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
