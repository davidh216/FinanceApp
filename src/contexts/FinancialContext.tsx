import React, {
  useRef,
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
  TimePeriod,
  Transaction,
  TransactionSplit,
} from '../types/financial';
import { MOCK_ACCOUNTS } from '../constants/financial';
import { isImportedAccount } from '../utils/csvImport';
import { Budgets, cleanBudgets, cleanRollover } from '../utils/budgets';
import { Goal, cleanGoals } from '../utils/goals';
import {
  CategoryRules,
  cleanCategoryRules,
  keywordOf,
  keywordRuleKey,
  matchesKeyword,
  merchantKey,
} from '../utils/categoryRules';
import { isCashflow } from '../utils/cashflow';
import {
  hasCategory,
  isSplit,
  replaceCategory,
  withSplits,
} from '../utils/splits';
import {
  CustomCategory,
  categoryNameError,
  cleanCustomCategories,
  newCustomCategory,
} from '../utils/categories';
import {
  markAsTransfer as markTransfer,
  unlinkTransfer as unlinkTransferIn,
} from '../utils/transfers';
import {
  addTransaction as addTransactionTo,
  removeTransaction as removeTransactionFrom,
} from '../utils/manualTransactions';
import {
  TransactionEdit,
  editTransaction as editTransactionIn,
} from '../utils/editTransaction';
import {
  AccountStore,
  defaultAccountStore,
  loadAccounts,
  loadLegacyAccounts,
} from '../utils/accountStore';
import { updateBalance } from '../utils/manualAccounts';
import {
  AccountSettings,
  applyAccountSettings,
} from '../utils/accountSettings';

const SHOW_DEMO_ACCOUNTS_STORAGE_KEY = 'financeapp.showDemoAccounts';
const BUDGETS_STORAGE_KEY = 'financeapp.budgets';
const GOALS_STORAGE_KEY = 'financeapp.goals';
const ROLLOVER_STORAGE_KEY = 'financeapp.budgetRollover';
const CATEGORY_RULES_STORAGE_KEY = 'financeapp.categoryRules';
const CUSTOM_CATEGORIES_STORAGE_KEY = 'financeapp.customCategories';

const loadCustomCategories = (): CustomCategory[] => {
  try {
    return cleanCustomCategories(
      JSON.parse(
        window.localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY) || '[]'
      )
    );
  } catch {
    return [];
  }
};

const loadCategoryRules = (customNames: string[]): CategoryRules => {
  try {
    return cleanCategoryRules(
      JSON.parse(
        window.localStorage.getItem(CATEGORY_RULES_STORAGE_KEY) || '{}'
      ),
      customNames
    );
  } catch {
    return {};
  }
};

const loadBudgets = (): Budgets => {
  try {
    return cleanBudgets(
      JSON.parse(window.localStorage.getItem(BUDGETS_STORAGE_KEY) || '{}')
    );
  } catch {
    return {};
  }
};

const loadRollover = (): string[] => {
  try {
    return cleanRollover(
      JSON.parse(window.localStorage.getItem(ROLLOVER_STORAGE_KEY) || '[]')
    );
  } catch {
    return [];
  }
};

const loadGoals = (): Goal[] => {
  try {
    return cleanGoals(
      JSON.parse(window.localStorage.getItem(GOALS_STORAGE_KEY) || '[]')
    );
  } catch {
    return [];
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

// Read straight away so a browser without IndexedDB starts with its data;
// with IndexedDB, the provider replaces these once it has loaded.
const loadImportedAccounts = (): Account[] => loadLegacyAccounts() ?? [];

const initialState: FinancialState = {
  accounts: MOCK_ACCOUNTS,
  transactions: MOCK_ACCOUNTS.flatMap((acc) => acc.transactions || []),
  selectedAccount: null,
  currentScreen: 'dashboard',
  selectedPeriod: 'month',
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
              // Choosing one category undoes a split.
              ...withSplits(txn, null),
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
    case 'SPLIT_TRANSACTION': {
      const { transactionId, splits } = action.payload;
      const now = new Date().toISOString();
      const split = (txn: Transaction): Transaction =>
        txn.id === transactionId
          ? { ...withSplits(txn, splits), updatedAt: now }
          : txn;
      return {
        ...state,
        accounts: state.accounts.map((account) => ({
          ...account,
          transactions: account.transactions?.map(split),
        })),
        transactions: state.transactions.map(split),
      };
    }
    case 'REPLACE_CATEGORY': {
      const { from, to } = action.payload;
      const replace = (txn: Transaction): Transaction =>
        replaceCategory(txn, from, to);
      return {
        ...state,
        accounts: state.accounts.map((account) => ({
          ...account,
          transactions: account.transactions?.map(replace),
        })),
        transactions: state.transactions.map(replace),
      };
    }
    case 'RECATEGORIZE': {
      const ids = new Set(action.payload.transactionIds);
      const { category } = action.payload;
      const recategorize = (txn: Transaction): Transaction =>
        ids.has(txn.id)
          ? {
              ...txn,
              category,
              cleanMerchant: {
                ...txn.cleanMerchant,
                suggestedCategory: category,
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
    case 'SET_MERCHANT_CATEGORY': {
      const { category } = action.payload;
      const recategorize = (txn: Transaction): Transaction =>
        isCashflow(txn) &&
        !isSplit(txn) &&
        merchantKey(txn.cleanMerchant) === action.payload.merchantKey
          ? {
              ...txn,
              category,
              cleanMerchant: {
                ...txn.cleanMerchant,
                suggestedCategory: category,
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
  selectAccount: (account: Account | null) => void;
  changeScreen: (screen: 'dashboard' | 'accounts' | 'transactions') => void;
  changePeriod: (period: TimePeriod) => void;
  addTag: (transactionId: string, tag: string) => void;
  removeTag: (transactionId: string, tag: string) => void;
  // With applyToMerchant, every transaction from the same merchant gets the
  // category too, and future imports remember it.
  setCategory: (
    transactionId: string,
    category: string,
    applyToMerchant?: boolean
  ) => void;
  categoryRules: CategoryRules;
  forgetCategoryRule: (merchantKey: string) => void;
  // "Description contains …" rules, for this and future imports.
  addKeywordRule: (
    keyword: string,
    category: string,
    applyToExisting: boolean
  ) => void;
  // The transactions a keyword rule would recategorise now.
  keywordMatches: (keyword: string, category: string) => Transaction[];
  setCategoryRules: (rules: CategoryRules) => void;
  // Divides a transaction between categories; null puts it back in one.
  splitTransaction: (
    transactionId: string,
    splits: TransactionSplit[] | null
  ) => void;
  // Categories you added, alongside the built-in ones.
  customCategories: CustomCategory[];
  // Returns why it couldn't be added (a clashing name), or null.
  addCustomCategory: (name: string, icon: string) => string | null;
  // Its transactions become "Other"; its budget and rules go.
  removeCustomCategory: (name: string) => void;
  setCustomCategories: (categories: CustomCategory[]) => void;
  // Undoes a wrongly matched transfer, on both sides.
  unlinkTransfer: (transactionId: string) => void;
  // Records a missed transfer to or from another imported account, or
  // EXTERNAL_ACCOUNT_ID.
  markAsTransfer: (transactionId: string, otherAccountId: string) => void;
  // Adds a transaction entered by hand to its (imported) account.
  addManualTransaction: (transaction: Transaction) => void;
  // Deletes a transaction, undoing any transfer it was part of first.
  deleteTransaction: (transactionId: string) => void;
  // Renames a transaction or changes its note; for one added by hand, also
  // its date, description and amount.
  editTransaction: (transactionId: string, edit: TransactionEdit) => void;
  // Sets an imported or hand-entered account's balance at the end of `date`
  // (today unless given), recording the change as a balance update.
  updateAccountBalance: (
    accountId: string,
    balance: number,
    date: string
  ) => void;
  // Renames an imported or hand-entered account, changes its type or marks
  // it closed.
  updateAccountSettings: (accountId: string, settings: AccountSettings) => void;
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
  // Why your accounts aren't being saved, when they aren't.
  storageError: string | null;
  // Whether the demo accounts are shown next to imported ones. They are
  // always shown until something is imported.
  showDemoAccounts: boolean;
  setShowDemoAccounts: (show: boolean) => void;
  // Monthly spending limits by category.
  budgets: Budgets;
  setBudgets: (budgets: Budgets) => void;
  // Budgets whose leftover (or overspend) rolls into the next month.
  budgetRollover: string[];
  setBudgetRollover: (categories: string[]) => void;
  // Savings goals, in the order you added them.
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
}

const FinancialContext = createContext<FinancialContextType | null>(null);

export const FinancialProvider: React.FC<{
  children: React.ReactNode;
  // Where imported accounts are kept; IndexedDB when the browser has it.
  accountStore?: AccountStore;
}> = ({ children, accountStore }) => {
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
  // mock accounts are regenerated on every load. Nothing is saved until the
  // stored accounts have loaded, so a slow load can't be overwritten.
  const [store] = useState(() => accountStore ?? defaultAccountStore());
  const [isLoaded, setIsLoaded] = useState(store.kind === 'localStorage');
  const [storageError, setStorageError] = useState<string | null>(null);
  const canSave = useRef(true);

  useEffect(() => {
    if (store.kind === 'localStorage') return;
    let cancelled = false;
    loadAccounts(store)
      .then((accounts) => {
        if (cancelled) return;
        dispatch({ type: 'RESTORE_IMPORTED_ACCOUNTS', payload: accounts });
      })
      .catch(() => {
        if (cancelled) return;
        // Saving now could overwrite the data that didn't load.
        canSave.current = false;
        setStorageError(
          "Your saved accounts couldn't be loaded, so changes won't be saved. Reload the page to try again."
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [store]);

  // Saves run one at a time; only the newest waiting save is kept.
  const nextSave = useRef<Account[] | null>(null);
  const isSaving = useRef(false);
  const runSaves = async () => {
    isSaving.current = true;
    while (nextSave.current) {
      const accounts = nextSave.current;
      nextSave.current = null;
      try {
        await store.save(accounts);
        setStorageError(null);
      } catch {
        setStorageError(
          "Your latest changes couldn't be saved in this browser. Download a backup or turn on auto-save to a file so you don't lose them."
        );
      }
    }
    isSaving.current = false;
  };

  useEffect(() => {
    if (!isLoaded || !canSave.current) return;
    nextSave.current = fullState.accounts.filter(isImportedAccount);
    if (!isSaving.current) runSaves();
    // runSaves only reads refs and the store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullState.accounts, isLoaded]);

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

  const [budgetRollover, setBudgetRolloverState] =
    useState<string[]>(loadRollover);

  const setBudgetRollover = (next: string[]) => {
    const cleaned = cleanRollover(next);
    setBudgetRolloverState(cleaned);
    try {
      window.localStorage.setItem(
        ROLLOVER_STORAGE_KEY,
        JSON.stringify(cleaned)
      );
    } catch {
      // The choice still applies for this session.
    }
  };

  const [goals, setGoalsState] = useState<Goal[]>(loadGoals);

  const setGoals = (next: Goal[]) => {
    const cleaned = cleanGoals(next);
    setGoalsState(cleaned);
    try {
      window.localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(cleaned));
    } catch {
      // The goals still apply for this session.
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

  const [customCategories, setCustomCategoriesState] =
    useState<CustomCategory[]>(loadCustomCategories);
  // The latest, so rules restored straight after categories (from a backup)
  // are checked against the new ones.
  const customRef = useRef(customCategories);

  const setCustomCategories = (next: CustomCategory[]) => {
    const cleaned = cleanCustomCategories(next);
    customRef.current = cleaned;
    setCustomCategoriesState(cleaned);
    try {
      window.localStorage.setItem(
        CUSTOM_CATEGORIES_STORAGE_KEY,
        JSON.stringify(cleaned)
      );
    } catch {
      // The categories still apply for this session.
    }
  };

  const [categoryRules, setCategoryRulesState] = useState<CategoryRules>(() =>
    loadCategoryRules(customRef.current.map((c) => c.name))
  );

  const setCategoryRules = (rules: CategoryRules) => {
    const cleaned = cleanCategoryRules(
      rules,
      customRef.current.map((c) => c.name)
    );
    setCategoryRulesState(cleaned);
    try {
      window.localStorage.setItem(
        CATEGORY_RULES_STORAGE_KEY,
        JSON.stringify(cleaned)
      );
    } catch {
      // The rules still apply for this session.
    }
  };

  const setCategory = (
    transactionId: string,
    category: string,
    applyToMerchant = false
  ) => {
    const txn = fullState.transactions.find((t) => t.id === transactionId);
    if (!applyToMerchant || !txn) {
      dispatch({ type: 'SET_CATEGORY', payload: { transactionId, category } });
      return;
    }
    const key = merchantKey(txn.cleanMerchant);
    dispatch({
      type: 'SET_MERCHANT_CATEGORY',
      payload: { merchantKey: key, category },
    });
    setCategoryRules({ ...categoryRules, [key]: category });
  };

  // Transactions a new keyword rule would change: spending and income, not
  // already that category, and not covered by a merchant rule.
  const keywordMatches = (keyword: string, category: string) => {
    const key = keywordRuleKey(keyword);
    return fullState.transactions.filter(
      (txn) =>
        isCashflow(txn) &&
        !isSplit(txn) &&
        txn.category !== category &&
        categoryRules[merchantKey(txn.cleanMerchant)] === undefined &&
        matchesKeyword(txn, keywordOf(key))
    );
  };

  const addKeywordRule = (
    keyword: string,
    category: string,
    applyToExisting: boolean
  ) => {
    const key = keywordRuleKey(keyword);
    if (keywordOf(key) === '') return;
    if (applyToExisting) {
      dispatch({
        type: 'RECATEGORIZE',
        payload: {
          transactionIds: keywordMatches(keyword, category).map((t) => t.id),
          category,
        },
      });
    }
    setCategoryRules({ ...categoryRules, [key]: category });
  };

  const splitTransaction = (
    transactionId: string,
    splits: TransactionSplit[] | null
  ) => {
    dispatch({ type: 'SPLIT_TRANSACTION', payload: { transactionId, splits } });
  };

  const forgetCategoryRule = (key: string) => {
    const { [key]: _forgotten, ...rest } = categoryRules;
    setCategoryRules(rest);
  };

  const addCustomCategory = (name: string, icon: string) => {
    const error = categoryNameError(name, customRef.current);
    if (error) return error;
    setCustomCategories([...customRef.current, newCustomCategory(name, icon)]);
    return null;
  };

  const removeCustomCategory = (name: string) => {
    if (!customRef.current.some((c) => c.name === name)) return;
    if (fullState.transactions.some((txn) => hasCategory(txn, name))) {
      dispatch({
        type: 'REPLACE_CATEGORY',
        payload: { from: name, to: 'Other' },
      });
    }
    if (budgets[name] !== undefined) {
      const { [name]: _removed, ...rest } = budgets;
      setBudgets(rest);
    }
    if (budgetRollover.includes(name)) {
      setBudgetRollover(budgetRollover.filter((c) => c !== name));
    }
    setCustomCategories(customRef.current.filter((c) => c.name !== name));
    setCategoryRules(
      Object.fromEntries(
        Object.entries(categoryRules).filter(([, cat]) => cat !== name)
      )
    );
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

  const addManualTransaction = (transaction: Transaction) => {
    const account = fullState.accounts.find(
      (acc) => acc.id === transaction.accountId
    );
    if (!account || !isImportedAccount(account)) return;
    dispatch({
      type: 'REPLACE_ACCOUNT',
      payload: addTransactionTo(account, transaction),
    });
  };

  const deleteTransaction = (transactionId: string) => {
    const account = fullState.accounts.find((acc) =>
      acc.transactions?.some((txn) => txn.id === transactionId)
    );
    if (!account || !isImportedAccount(account)) return;
    const unlinked = unlinkTransferIn(fullState.accounts, transactionId);
    unlinked
      .filter((acc) => acc.id !== account.id)
      .forEach((acc) => dispatch({ type: 'REPLACE_ACCOUNT', payload: acc }));
    const current = unlinked.find((acc) => acc.id === account.id) ?? account;
    dispatch({
      type: 'REPLACE_ACCOUNT',
      payload: removeTransactionFrom(current, transactionId),
    });
  };

  const updateAccountBalance = (
    accountId: string,
    balance: number,
    date: string
  ) => {
    const account = fullState.accounts.find((acc) => acc.id === accountId);
    if (!account || !isImportedAccount(account)) return;
    dispatch({
      type: 'REPLACE_ACCOUNT',
      payload: updateBalance(account, balance, date),
    });
  };

  const updateAccountSettings = (
    accountId: string,
    settings: AccountSettings
  ) => {
    const account = fullState.accounts.find((acc) => acc.id === accountId);
    if (!account || !isImportedAccount(account)) return;
    dispatch({
      type: 'REPLACE_ACCOUNT',
      payload: applyAccountSettings(account, settings),
    });
  };

  const editTransaction = (transactionId: string, edit: TransactionEdit) => {
    const account = fullState.accounts.find((acc) =>
      acc.transactions?.some((txn) => txn.id === transactionId)
    );
    if (!account || !isImportedAccount(account)) return;
    dispatch({
      type: 'REPLACE_ACCOUNT',
      payload: editTransactionIn(account, transactionId, edit),
    });
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
    selectAccount,
    changeScreen,
    changePeriod,
    addTag,
    removeTag,
    setCategory,
    categoryRules,
    forgetCategoryRule,
    addKeywordRule,
    keywordMatches,
    setCategoryRules,
    splitTransaction,
    customCategories,
    addCustomCategory,
    removeCustomCategory,
    setCustomCategories,
    unlinkTransfer,
    markAsTransfer,
    addManualTransaction,
    deleteTransaction,
    editTransaction,
    updateAccountBalance,
    updateAccountSettings,
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
    storageError,
    hasBusinessAccounts,
    showDemoAccounts,
    setShowDemoAccounts,
    budgets,
    setBudgets,
    goals,
    setGoals,
    budgetRollover,
    setBudgetRollover,
  };

  return (
    <FinancialContext.Provider value={value}>
      {isLoaded ? (
        children
      ) : (
        <div
          className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500"
          role="status"
        >
          Loading your data…
        </div>
      )}
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
