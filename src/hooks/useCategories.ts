import { useMemo } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { categoryIcon, categoryNames } from '../utils/categories';

// Every category, built-in and your own, with their icons.
export const useCategories = () => {
  const { customCategories } = useFinancial();
  return useMemo(
    () => ({
      names: categoryNames(customCategories),
      icon: (name: string) => categoryIcon(name, customCategories),
      // "🛒 Groceries"
      label: (name: string) =>
        `${categoryIcon(name, customCategories)} ${name}`,
    }),
    [customCategories]
  );
};
