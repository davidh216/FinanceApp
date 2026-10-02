import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';
import { Button } from '../ui/Button';
import { isKeywordRule, keywordRules } from '../../utils/categoryRules';
import {
  CUSTOM_CATEGORY_ICONS,
  categoryNameError,
} from '../../utils/categories';
import { useCategories } from '../../hooks/useCategories';

interface CategoryRulesModalProps {
  onClose: () => void;
}

const fieldClasses =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

// Your own categories, and your category rules: keyword rules you add
// here, and the merchant rules you made from a transaction's category menu.
export const CategoryRulesModal: React.FC<CategoryRulesModalProps> = ({
  onClose,
}) => {
  const {
    state,
    categoryRules,
    addKeywordRule,
    keywordMatches,
    forgetCategoryRule,
    customCategories,
    addCustomCategory,
    removeCustomCategory,
  } = useFinancial();
  const categories = useCategories();
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState(CUSTOM_CATEGORY_ICONS[0]);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('Shopping');
  const [applyToExisting, setApplyToExisting] = useState(true);

  const trimmed = keyword.trim();
  const matches = trimmed.length >= 2 ? keywordMatches(trimmed, category) : [];
  const keywords = keywordRules(categoryRules);
  const merchants = Object.entries(categoryRules)
    .filter(([key]) => !isKeywordRule(key))
    .sort(([a], [b]) => a.localeCompare(b));

  // Shown as you type, once there's a name.
  const nameError =
    newName.trim() === '' ? null : categoryNameError(newName, customCategories);

  const handleAddCategory = () => {
    if (newName.trim() === '' || nameError) return;
    if (addCustomCategory(newName, newIcon) === null) setNewName('');
  };

  const handleRemoveCategory = (name: string) => {
    const count = state.transactions.filter(
      (txn) => txn.category === name
    ).length;
    const moved =
      count === 0
        ? ''
        : ` Its ${
            count === 1 ? 'transaction' : `${count} transactions`
          } will become Other.`;
    if (
      window.confirm(
        `Remove the ${name} category?${moved} Its budget and rules go too.`
      )
    ) {
      removeCustomCategory(name);
    }
  };

  const handleAdd = () => {
    if (trimmed.length < 2) return;
    addKeywordRule(trimmed, category, applyToExisting);
    setKeyword('');
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto text-left">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 id="rules-title" className="text-lg font-semibold text-gray-900">
            Categories and rules
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              Your categories
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Add categories of your own, like Pets or Kids. They work like the
              built-in ones, with budgets and rules.
            </p>
            {customCategories.length > 0 && (
              <ul
                className="divide-y divide-gray-100 text-sm mb-3"
                data-testid="custom-categories"
              >
                {customCategories.map((c) => (
                  <li
                    key={c.name}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="min-w-0 truncate text-gray-700">
                      {c.icon} {c.name}
                    </span>
                    <button
                      onClick={() => handleRemoveCategory(c.name)}
                      className="text-blue-600 hover:text-blue-700 shrink-0"
                      aria-label={`Remove the ${c.name} category`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                handleAddCategory();
              }}
            >
              <label className="shrink-0">
                <span className="sr-only">Icon</span>
                <select
                  value={newIcon}
                  onChange={(event) => setNewIcon(event.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CUSTOM_CATEGORY_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex-1 min-w-0">
                <span className="sr-only">New category name</span>
                <input
                  type="text"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="New category"
                  maxLength={40}
                  aria-invalid={nameError !== null}
                  aria-describedby={
                    nameError ? 'category-name-error' : undefined
                  }
                  className={fieldClasses}
                />
              </label>
              <Button
                type="submit"
                size="sm"
                disabled={newName.trim() === '' || nameError !== null}
                data-testid="add-category"
              >
                Add
              </Button>
            </form>
            {nameError && (
              <p
                id="category-name-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {nameError}
              </p>
            )}
          </section>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleAdd();
            }}
          >
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              Add a keyword rule
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Transactions whose description contains the words get the
              category, in future imports too. A merchant's own rule comes
              first.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  Description contains
                </span>
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="AMZN"
                  className={fieldClasses}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={fieldClasses}
                >
                  {categories.names.map((name) => (
                    <option key={name} value={name}>
                      {categories.label(name)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="mt-3 flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={applyToExisting}
                onChange={(event) => setApplyToExisting(event.target.checked)}
              />
              <span data-testid="rule-matches">
                Also change{' '}
                {matches.length === 1
                  ? '1 transaction'
                  : `${matches.length} transactions`}{' '}
                you already have
              </span>
            </label>
            <div className="mt-3 flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={trimmed.length < 2}
                data-testid="add-keyword-rule"
              >
                Add rule
              </Button>
            </div>
          </form>

          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Your rules
            </h4>
            {keywords.length === 0 && merchants.length === 0 ? (
              <p className="text-sm text-gray-500">
                None yet. Add a keyword rule above, or tick "Use for every …"
                when you change a transaction's category.
              </p>
            ) : (
              <ul
                className="divide-y divide-gray-100 text-sm"
                data-testid="rules-list"
              >
                {keywords.map((rule) => (
                  <li
                    key={rule.key}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="min-w-0 truncate text-gray-700">
                      Contains "{rule.keyword}" →{' '}
                      {categories.label(rule.category)}
                    </span>
                    <button
                      onClick={() => forgetCategoryRule(rule.key)}
                      className="text-blue-600 hover:text-blue-700 shrink-0"
                      aria-label={`Remove the rule for "${rule.keyword}"`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
                {merchants.map(([key, cat]) => (
                  <li
                    key={key}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="min-w-0 truncate text-gray-700">
                      Merchant "{key}" → {categories.label(cat)}
                    </span>
                    <button
                      onClick={() => forgetCategoryRule(key)}
                      className="text-blue-600 hover:text-blue-700 shrink-0"
                      aria-label={`Remove the rule for ${key}`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
