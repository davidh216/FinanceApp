import React, { useState, useEffect } from 'react';
import { Budget, TimePeriod, BudgetAlert } from '../../types/financial';
import { useBudget } from '../../hooks/useBudget';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { X, AlertTriangle, Bell, Plus, Trash2 } from 'lucide-react';

interface BudgetFormProps {
  budget?: Budget | null;
  onSave?: (budget: Budget) => void;
  onCancel?: () => void;
  isOpen: boolean;
}

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Insurance',
  'Other'
];

const PERIODS: { value: TimePeriod; label: string; days: number }[] = [
  { value: 'week', label: 'Weekly', days: 7 },
  { value: 'month', label: 'Monthly', days: 30 },
  { value: 'quarter', label: 'Quarterly', days: 90 },
  { value: 'year', label: 'Yearly', days: 365 }
];

export const BudgetForm: React.FC<BudgetFormProps> = ({
  budget,
  onSave,
  onCancel,
  isOpen
}) => {
  const { createBudget, updateBudget, isCreating, isUpdating, error } = useBudget();
  
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'month' as TimePeriod,
    startDate: '',
    endDate: '',
    isActive: true
  });
  
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form when budget changes
  useEffect(() => {
    if (budget) {
      setFormData({
        category: budget.category,
        amount: budget.amount.toString(),
        period: budget.period,
        startDate: budget.startDate.split('T')[0],
        endDate: budget.endDate.split('T')[0],
        isActive: budget.isActive
      });
      setAlerts(budget.alerts);
    } else {
      // Set default values for new budget
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 30); // Default to 30 days
      
      setFormData({
        category: '',
        amount: '',
        period: 'month',
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        isActive: true
      });
      setAlerts([]);
    }
    setValidationErrors({});
  }, [budget]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        errors.endDate = 'End date must be after start date';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const budgetData = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: formData.period,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        spent: budget?.spent || 0,
        remaining: budget?.remaining || parseFloat(formData.amount),
        alerts: alerts,
        isActive: formData.isActive
      };

      if (budget) {
        const updatedBudget = await updateBudget(budget.id, budgetData);
        onSave?.(updatedBudget);
      } else {
        const newBudget = await createBudget(budgetData);
        onSave?.(newBudget);
      }
    } catch (err) {
      console.error('Error saving budget:', err);
    }
  };

  const handlePeriodChange = (period: TimePeriod) => {
    const selectedPeriod = PERIODS.find(p => p.value === period);
    if (selectedPeriod && formData.startDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + selectedPeriod.days);
      
      setFormData(prev => ({
        ...prev,
        period,
        endDate: endDate.toISOString().split('T')[0]
      }));
    }
  };

  const addAlert = () => {
    setAlerts(prev => [...prev, {
      id: `alert-${Date.now()}`,
      type: 'warning',
      threshold: 80,
      message: 'You\'re approaching your budget limit',
      triggered: false,
      createdAt: new Date().toISOString()
    }]);
  };

  const updateAlert = (index: number, field: keyof BudgetAlert, value: any) => {
    setAlerts(prev => prev.map((alert, i) => 
      i === index ? { ...alert, [field]: value } : alert
    ));
  };

  const removeAlert = (index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {budget ? 'Edit Budget' : 'Create New Budget'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                validationErrors.category ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {validationErrors.category && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.category}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  validationErrors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {validationErrors.amount && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.amount}</p>
            )}
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Period
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PERIODS.map(period => (
                <button
                  key={period.value}
                  type="button"
                  onClick={() => handlePeriodChange(period.value)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    formData.period === period.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium">{period.label}</div>
                  <div className="text-sm text-gray-500">{period.days} days</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  validationErrors.startDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.startDate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.startDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  validationErrors.endDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.endDate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.endDate}</p>
              )}
            </div>
          </div>

          {/* Alerts Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Budget Alerts
              </label>
              <Button
                type="button"
                onClick={addAlert}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Alert</span>
              </Button>
            </div>
            
            {alerts.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">No alerts configured</p>
                <p className="text-sm text-gray-400">Add alerts to get notified about budget progress</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Alert {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeAlert(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={alert.type}
                          onChange={(e) => updateAlert(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="warning">Warning</option>
                          <option value="danger">Danger</option>
                          <option value="info">Info</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Threshold (%)
                        </label>
                        <input
                          type="number"
                          value={alert.threshold}
                          onChange={(e) => updateAlert(index, 'threshold', parseInt(e.target.value))}
                          min="1"
                          max="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Message
                        </label>
                        <input
                          type="text"
                          value={alert.message}
                          onChange={(e) => updateAlert(index, 'message', e.target.value)}
                          placeholder="Alert message"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active Budget
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isCreating || isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || isUpdating}
              className="flex items-center space-x-2"
            >
              {(isCreating || isUpdating) && <LoadingSpinner size="sm" />}
              <span>{budget ? 'Update Budget' : 'Create Budget'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 