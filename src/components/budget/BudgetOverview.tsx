import React, { useState } from 'react';
import { Budget, BudgetSummary } from '../../types/financial';
import { useBudget } from '../../hooks/useBudget';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  Target, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react';

interface BudgetOverviewProps {
  onBudgetSelect?: (budget: Budget) => void;
  onCreateBudget?: () => void;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  onBudgetSelect,
  onCreateBudget,
}) => {
  const { budgets, budgetSummary, isLoading, error } = useBudget();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-red-600">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>Error loading budgets: {error}</p>
        </div>
      </div>
    );
  }

  const activeBudgets = budgets.filter(budget => budget.isActive);
  const overBudgetCategories = budgetSummary?.overBudgetCategories || [];

  const getBudgetProgressColor = (budget: Budget) => {
    const percentage = (budget.spent / budget.amount) * 100;
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBudgetProgressBgColor = (budget: Budget) => {
    const percentage = (budget.spent / budget.amount) * 100;
    if (percentage >= 100) return 'bg-red-100';
    if (percentage >= 80) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Budget Overview</h3>
              <p className="text-sm text-gray-500">
                {activeBudgets.length} active budget{activeBudgets.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            onClick={onCreateBudget}
            className="flex items-center space-x-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Budget</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {budgetSummary && (
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Total Budgeted</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                ${budgetSummary.totalBudgeted.toLocaleString()}
              </p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Total Spent</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">
                ${budgetSummary.totalSpent.toLocaleString()}
              </p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Remaining</span>
              </div>
              <p className={`text-2xl font-bold mt-1 ${
                budgetSummary.totalRemaining >= 0 ? 'text-purple-900' : 'text-red-600'
              }`}>
                ${budgetSummary.totalRemaining.toLocaleString()}
              </p>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">Over Budget</span>
              </div>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                {overBudgetCategories.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Budget List */}
      <div className="p-6">
        {activeBudgets.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No budgets yet</h4>
            <p className="text-gray-500 mb-4">
              Create your first budget to start tracking your spending
            </p>
            <Button onClick={onCreateBudget}>
              Create Your First Budget
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">Active Budgets</h4>
              <div className="flex space-x-2">
                {['All', 'Food & Dining', 'Transportation', 'Shopping', 'Entertainment'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category === 'All' ? null : category)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      selectedCategory === (category === 'All' ? null : category)
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {activeBudgets
                .filter(budget => !selectedCategory || budget.category === selectedCategory)
                .map((budget) => {
                  const percentage = (budget.spent / budget.amount) * 100;
                  const isOverBudget = budget.spent > budget.amount;
                  
                  return (
                    <div
                      key={budget.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer"
                      onClick={() => onBudgetSelect?.(budget)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            isOverBudget ? 'bg-red-500' : 'bg-green-500'
                          }`} />
                          <div>
                            <h5 className="font-medium text-gray-900">{budget.category}</h5>
                            <p className="text-sm text-gray-500">
                              {budget.period} budget • ${budget.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${getBudgetProgressColor(budget)}`}>
                            ${budget.spent.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            of ${budget.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isOverBudget ? 'bg-red-500' : percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {percentage.toFixed(1)}% used
                        </span>
                        <span className={`font-medium ${
                          isOverBudget ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {isOverBudget ? 'Over budget' : `$${budget.remaining.toLocaleString()} remaining`}
                        </span>
                      </div>
                      
                      {/* Alerts */}
                      {budget.alerts.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-yellow-700">
                              {budget.alerts.length} alert{budget.alerts.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 