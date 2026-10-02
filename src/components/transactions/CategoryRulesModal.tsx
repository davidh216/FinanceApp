import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';
import { TAG_CATEGORIES } from '../../constants/financial';
import { Button } from '../ui/Button';
import { isKeywordRule, keywordRules } from '../../utils/categoryRules';

interface CategoryRulesModalProps {
  onClose: () => void;
}

const CATEGORIES = Object.keys(TAG_CATEGORIES);

const fieldClasses =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

const label = (category: string) =>
  `${TAG_CATEGORIES[category]?.icon ?? ''} ${category}`.trim();

// Your category rules: keyword rules you add here, and the merchant rules
// you made from a transaction's category menu.
export const CategoryRulesModal: React.FC<CategoryRulesModalProps> = ({
  onClose,
}) => {
  const { categoryRules, addKeywordRule, keywordMatches, forgetCategoryRule } =
    useFinancial();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('Shopping');
  const [applyToExisting, setApplyToExisting] = useState(true);

  const trimmed = keyword.trim();
  const matches = trimmed.length >= 2 ? keywordMatches(trimmed, category) : [];
  const keywords = keywordRules(categoryRules);
  const merchants = Object.entries(categoryRules)
    .filter(([key]) => !isKeywordRule(key))
    .sort(([a], [b]) => a.localeCompare(b));

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
            Category rules
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
                  {CATEGORIES.map((name) => (
                    <option key={name} value={name}>
                      {label(name)}
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
                      Contains "{rule.keyword}" → {label(rule.category)}
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
                      Merchant "{key}" → {label(cat)}
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
