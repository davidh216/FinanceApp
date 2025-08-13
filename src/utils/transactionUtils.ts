import { Transaction, Account } from '../types/financial';

/**
 * Update transaction tags in a single transaction
 */
export const updateTransactionTags = (
  transaction: Transaction,
  tag: string,
  action: 'add' | 'remove'
): Transaction => {
  if (action === 'add') {
    const newTags = Array.from(new Set([...transaction.tags, tag]));
    return { ...transaction, tags: newTags };
  } else {
    const newTags = transaction.tags.filter(t => t !== tag);
    return { ...transaction, tags: newTags };
  }
};

/**
 * Update transaction tags across all accounts
 */
export const updateTransactionTagsInAccounts = (
  accounts: Account[],
  transactionId: string,
  tag: string,
  action: 'add' | 'remove'
): Account[] => {
  return accounts.map(account => ({
    ...account,
    transactions: account.transactions?.map(txn =>
      txn.id === transactionId
        ? updateTransactionTags(txn, tag, action)
        : txn
    ),
  }));
};

/**
 * Update transaction tags in a flat transaction array
 */
export const updateTransactionTagsInArray = (
  transactions: Transaction[],
  transactionId: string,
  tag: string,
  action: 'add' | 'remove'
): Transaction[] => {
  return transactions.map(txn =>
    txn.id === transactionId
      ? updateTransactionTags(txn, tag, action)
      : txn
  );
};

/**
 * Filter transactions by account type
 */
export const filterTransactionsByAccountType = (
  accounts: Account[],
  accountFilter: 'both' | 'personal' | 'business'
): Transaction[] => {
  const filteredAccounts = accounts.filter(account => {
    if (accountFilter === 'both') return true;
    if (accountFilter === 'personal') return !account.type.includes('BUSINESS');
    if (accountFilter === 'business') return account.type.includes('BUSINESS');
    return true;
  });

  return filteredAccounts.flatMap(account => account.transactions || []);
};

/**
 * Search transactions by text
 */
export const searchTransactions = (
  transactions: Transaction[],
  searchTerm: string
): Transaction[] => {
  if (!searchTerm.trim()) return transactions;
  
  const term = searchTerm.toLowerCase();
  return transactions.filter(txn =>
    txn.description.toLowerCase().includes(term) ||
    txn.cleanMerchant.cleanName.toLowerCase().includes(term) ||
    txn.cleanMerchant.original.toLowerCase().includes(term) ||
    txn.category.toLowerCase().includes(term) ||
    txn.tags.some(tag => tag.toLowerCase().includes(term))
  );
};

/**
 * Sort transactions by various criteria
 */
export const sortTransactions = (
  transactions: Transaction[],
  sortBy: string
): Transaction[] => {
  const sorted = [...transactions];
  
  switch (sortBy) {
    case 'date-desc':
      return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    case 'date-asc':
      return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    case 'amount-desc':
      return sorted.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    case 'amount-asc':
      return sorted.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
    case 'merchant-asc':
      return sorted.sort((a, b) => a.cleanMerchant.cleanName.localeCompare(b.cleanMerchant.cleanName));
    case 'merchant-desc':
      return sorted.sort((a, b) => b.cleanMerchant.cleanName.localeCompare(a.cleanMerchant.cleanName));
    default:
      return sorted;
  }
};

/**
 * Get transaction statistics for a given period
 */
export const getTransactionStats = (
  transactions: Transaction[]
): {
  totalCount: number;
  incomeCount: number;
  expenseCount: number;
  totalIncome: number;
  totalExpenses: number;
  averageTransaction: number;
} => {
  const incomeTransactions = transactions.filter(txn => txn.amount > 0);
  const expenseTransactions = transactions.filter(txn => txn.amount < 0);
  
  const totalIncome = incomeTransactions.reduce((sum, txn) => sum + txn.amount, 0);
  const totalExpenses = Math.abs(expenseTransactions.reduce((sum, txn) => sum + txn.amount, 0));
  const averageTransaction = transactions.length > 0 
    ? (totalIncome - totalExpenses) / transactions.length 
    : 0;

  return {
    totalCount: transactions.length,
    incomeCount: incomeTransactions.length,
    expenseCount: expenseTransactions.length,
    totalIncome,
    totalExpenses,
    averageTransaction,
  };
};

/**
 * Group transactions by category
 */
export const groupTransactionsByCategory = (
  transactions: Transaction[]
): Record<string, Transaction[]> => {
  return transactions.reduce((groups, transaction) => {
    const category = transaction.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);
};

/**
 * Get top spending categories
 */
export const getTopSpendingCategories = (
  transactions: Transaction[],
  limit: number = 5
): Array<{ category: string; total: number; count: number }> => {
  const expenseTransactions = transactions.filter(txn => txn.amount < 0);
  const categoryGroups = groupTransactionsByCategory(expenseTransactions);
  
  const categoryTotals = Object.entries(categoryGroups).map(([category, txns]) => ({
    category,
    total: Math.abs(txns.reduce((sum, txn) => sum + txn.amount, 0)),
    count: txns.length,
  }));

  return categoryTotals
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
};

/**
 * Calculate running balance over time
 */
export const calculateRunningBalance = (
  transactions: Transaction[],
  initialBalance: number = 0
): Array<{ date: string; balance: number }> => {
  const sortedTransactions = sortTransactions(transactions, 'date-asc');
  let runningBalance = initialBalance;
  
  return sortedTransactions.map(txn => {
    runningBalance += txn.amount;
    return {
      date: txn.date,
      balance: runningBalance,
    };
  });
}; 