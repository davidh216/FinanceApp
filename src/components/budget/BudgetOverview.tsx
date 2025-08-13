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
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react';

interface BudgetOverviewProps {
  onBudgetSelect?: (budget: Budget) => void;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  onBudgetSelect,
}) => {
  const { budgets, budgetSummary, isLoading, error } = useBudget();
  const [selectedBudgets, setSelectedBudgets] = useState<Set<string>>(new Set());

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
       </div>

             {/* Summary Cards */}
       {budgetSummary && (
         <div className="p-6 border-b border-gray-200">
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
             <div className="bg-blue-50 rounded-lg p-3">
               <div className="flex items-center space-x-2">
                 <DollarSign className="w-4 h-4 text-blue-600" />
                 <span className="text-xs font-medium text-blue-600">Total Budgeted</span>
               </div>
               <p className="text-lg font-bold text-blue-900 mt-1">
                 ${budgetSummary.totalBudgeted.toLocaleString()}
               </p>
             </div>
             
             <div className="bg-green-50 rounded-lg p-3">
               <div className="flex items-center space-x-2">
                 <TrendingDown className="w-4 h-4 text-green-600" />
                 <span className="text-xs font-medium text-green-600">Total Spent</span>
               </div>
               <p className="text-lg font-bold text-green-900 mt-1">
                 ${budgetSummary.totalSpent.toLocaleString()}
               </p>
             </div>
             
             <div className="bg-purple-50 rounded-lg p-3">
               <div className="flex items-center space-x-2">
                 <BarChart3 className="w-4 h-4 text-purple-600" />
                 <span className="text-xs font-medium text-purple-600">Remaining</span>
               </div>
               <p className={`text-lg font-bold mt-1 ${
                 budgetSummary.totalRemaining >= 0 ? 'text-purple-900' : 'text-red-600'
               }`}>
                 ${budgetSummary.totalRemaining.toLocaleString()}
               </p>
             </div>
             
             <div className="bg-orange-50 rounded-lg p-3">
               <div className="flex items-center space-x-2">
                 <AlertTriangle className="w-4 h-4 text-orange-600" />
                 <span className="text-xs font-medium text-orange-600">Over Budget</span>
               </div>
               <p className="text-lg font-bold text-orange-900 mt-1">
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
             <p className="text-gray-500">
               Use the "Add Budget" button above to create your first budget and start tracking your spending
             </p>
           </div>
         ) : (
           <div className="space-y-3">
                           {activeBudgets.map((budget) => {
                const percentage = (budget.spent / budget.amount) * 100;
                const isOverBudget = budget.spent > budget.amount;
                const isSelected = selectedBudgets.has(budget.id);
                
                return (
                  <div key={budget.id}>
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-purple-50 border border-purple-200' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        const newSelectedBudgets = new Set(selectedBudgets);
                        if (isSelected) {
                          newSelectedBudgets.delete(budget.id);
                        } else {
                          newSelectedBudgets.add(budget.id);
                        }
                        setSelectedBudgets(newSelectedBudgets);
                      }}
                    >
                     <div className="flex items-center space-x-3">
                       <div className={`w-2 h-2 rounded-full ${
                         isOverBudget ? 'bg-red-500' : percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                       }`} />
                       <div>
                         <p className="font-medium text-gray-900">{budget.category}</p>
                         <p className="text-sm text-gray-500">
                           ${budget.spent.toLocaleString()} / ${budget.amount.toLocaleString()}
                         </p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className={`text-sm font-medium ${getBudgetProgressColor(budget)}`}>
                         {percentage.toFixed(0)}%
                       </p>
                       <p className="text-xs text-gray-500">
                         {isOverBudget ? 'Over' : 'On track'}
                       </p>
                     </div>
                   </div>
                   
                   {/* Selected Budget Details */}
                   {isSelected && (
                     <div className="mt-2 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                       <div className="space-y-3">
                         <div className="flex items-center justify-between">
                           <span className="text-sm font-medium text-gray-700">Period:</span>
                           <span className="text-sm text-gray-600 capitalize">{budget.period}</span>
                         </div>
                         <div className="flex items-center justify-between">
                           <span className="text-sm font-medium text-gray-700">Start Date:</span>
                           <span className="text-sm text-gray-600">
                             {new Date(budget.startDate).toLocaleDateString()}
                           </span>
                         </div>
                         <div className="flex items-center justify-between">
                           <span className="text-sm font-medium text-gray-700">End Date:</span>
                           <span className="text-sm text-gray-600">
                             {new Date(budget.endDate).toLocaleDateString()}
                           </span>
                         </div>
                         <div className="flex items-center justify-between">
                           <span className="text-sm font-medium text-gray-700">Remaining:</span>
                           <span className={`text-sm font-medium ${
                             budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                           }`}>
                             ${budget.remaining.toLocaleString()}
                           </span>
                         </div>
                         
                         {/* Progress Bar */}
                         <div className="w-full bg-gray-200 rounded-full h-2">
                           <div
                             className={`h-2 rounded-full transition-all duration-300 ${
                               isOverBudget ? 'bg-red-500' : percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                             }`}
                             style={{ width: `${Math.min(percentage, 100)}%` }}
                           />
                         </div>
                         
                         <div className="flex items-center justify-between text-xs">
                           <span className="text-gray-500">
                             {percentage.toFixed(1)}% used
                           </span>
                           <span className={`font-medium ${
                             isOverBudget ? 'text-red-600' : 'text-gray-600'
                           }`}>
                             {isOverBudget ? 'Over budget' : `${budget.remaining >= 0 ? '$' + budget.remaining.toLocaleString() : '$0'} remaining`}
                           </span>
                         </div>
                         
                         {/* Alerts */}
                         {budget.alerts.length > 0 && (
                           <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                             <AlertTriangle className="w-3 h-3 text-yellow-500" />
                             <span className="text-xs text-yellow-700">
                               {budget.alerts.length} alert{budget.alerts.length !== 1 ? 's' : ''}
                             </span>
                           </div>
                         )}
                       </div>
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
         )}
       </div>
    </div>
  );
}; 