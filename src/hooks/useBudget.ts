import { useState, useEffect, useCallback, useMemo } from 'react';
import { Budget, BudgetProgress, BudgetSummary, BudgetAlert, TimePeriod } from '../types/financial';
import { createBudgetService, BudgetServiceConfig } from '../services/budgetService';
import { useAuth } from '../contexts/AuthContext';

interface UseBudgetConfig {
  useMockData?: boolean;
}

interface UseBudgetReturn {
  // Budget data
  budgets: Budget[];
  budgetSummary: BudgetSummary | null;
  selectedBudget: Budget | null;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error states
  error: string | null;
  
  // Budget operations
  createBudget: (budgetData: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Budget>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<boolean>;
  selectBudget: (budget: Budget | null) => void;
  
  // Budget progress
  getBudgetProgress: (budgetId: string) => Promise<BudgetProgress>;
  calculateBudgetSpending: (budgetId: string, transactions: any[]) => Promise<number>;
  
  // Budget alerts
  createBudgetAlert: (budgetId: string, alert: Omit<BudgetAlert, 'id' | 'createdAt'>) => Promise<BudgetAlert>;
  getBudgetAlerts: (budgetId: string) => Promise<BudgetAlert[]>;
  updateBudgetAlert: (alertId: string, updates: Partial<BudgetAlert>) => Promise<BudgetAlert>;
  
  // Utility functions
  refreshBudgets: () => Promise<void>;
  clearError: () => void;
}

export const useBudget = (config: UseBudgetConfig = {}): UseBudgetReturn => {
  const { currentUser } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create budget service instance
  const budgetService = useMemo(() => {
    // Check if we're in demo mode
    const isDemoMode = localStorage.getItem('financeapp-demo-mode') === 'true' || 
                      new URLSearchParams(window.location.search).get('demo') === 'true';
    
    // Use demo user ID if in demo mode, otherwise require current user
    const userId = isDemoMode ? 'demo-user' : currentUser?.id;
    
    if (!userId) return null;
    
    const serviceConfig: BudgetServiceConfig = {
      useMockData: config.useMockData ?? true, // Default to mock data for development
    };
    
    return createBudgetService(serviceConfig, userId);
  }, [currentUser?.id, config.useMockData]);

  // Load budgets on mount and when user changes
  useEffect(() => {
    if (!budgetService) return;

    // Check if we're in demo mode
    const isDemoMode = localStorage.getItem('financeapp-demo-mode') === 'true' || 
                      new URLSearchParams(window.location.search).get('demo') === 'true';
    
    // Use demo user ID if in demo mode, otherwise require current user
    const userId = isDemoMode ? 'demo-user' : currentUser?.id;
    
    if (!userId) return;

    const loadBudgets = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const [budgetsData, summaryData] = await Promise.all([
          budgetService.getBudgets(userId),
          budgetService.getBudgetSummary(userId),
        ]);
        
        setBudgets(budgetsData);
        setBudgetSummary(summaryData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load budgets');
      } finally {
        setIsLoading(false);
      }
    };

    loadBudgets();

    // Subscribe to real-time updates
    const unsubscribe = budgetService.subscribeToBudgets(userId, (updatedBudgets) => {
      setBudgets(updatedBudgets);
    });

    return unsubscribe;
  }, [budgetService, currentUser?.id]);

  // Budget operations
  const createBudget = useCallback(async (budgetData: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!budgetService) {
      throw new Error('Budget service not available');
    }

    setIsCreating(true);
    setError(null);
    
    try {
      const newBudget = await budgetService.createBudget(budgetData);
      
      // Update local state
      setBudgets(prev => [...prev, newBudget]);
      
      // Refresh summary
      const isDemoMode = localStorage.getItem('financeapp-demo-mode') === 'true' || 
                        new URLSearchParams(window.location.search).get('demo') === 'true';
      const userId = isDemoMode ? 'demo-user' : currentUser?.id;
      
      if (userId) {
        const summary = await budgetService.getBudgetSummary(userId);
        setBudgetSummary(summary);
      }
      
      return newBudget;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create budget';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, [budgetService, currentUser?.id]);

  const updateBudget = useCallback(async (id: string, updates: Partial<Budget>) => {
    if (!budgetService) {
      throw new Error('Budget service not available');
    }

    setIsUpdating(true);
    setError(null);
    
    try {
      const updatedBudget = await budgetService.updateBudget(id, updates);
      
      // Update local state
      setBudgets(prev => prev.map(budget => 
        budget.id === id ? updatedBudget : budget
      ));
      
      // Update selected budget if it's the one being updated
      if (selectedBudget?.id === id) {
        setSelectedBudget(updatedBudget);
      }
      
      // Refresh summary
      const isDemoMode = localStorage.getItem('financeapp-demo-mode') === 'true' || 
                        new URLSearchParams(window.location.search).get('demo') === 'true';
      const userId = isDemoMode ? 'demo-user' : currentUser?.id;
      
      if (userId) {
        const summary = await budgetService.getBudgetSummary(userId);
        setBudgetSummary(summary);
      }
      
      return updatedBudget;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update budget';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  }, [budgetService, currentUser?.id, selectedBudget]);

  const deleteBudget = useCallback(async (id: string) => {
    if (!budgetService) {
      throw new Error('Budget service not available');
    }

    setIsDeleting(true);
    setError(null);
    
    try {
      const success = await budgetService.deleteBudget(id);
      
      if (success) {
        // Update local state
        setBudgets(prev => prev.filter(budget => budget.id !== id));
        
        // Clear selected budget if it's the one being deleted
        if (selectedBudget?.id === id) {
          setSelectedBudget(null);
        }
        
        // Refresh summary
        const isDemoMode = localStorage.getItem('financeapp-demo-mode') === 'true' || 
                          new URLSearchParams(window.location.search).get('demo') === 'true';
        const userId = isDemoMode ? 'demo-user' : currentUser?.id;
        
        if (userId) {
          const summary = await budgetService.getBudgetSummary(userId);
          setBudgetSummary(summary);
        }
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete budget';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [budgetService, currentUser?.id, selectedBudget]);

  const selectBudget = useCallback((budget: Budget | null) => {
    setSelectedBudget(budget);
  }, []);

  // Budget progress operations
  const getBudgetProgress = useCallback(async (budgetId: string) => {
    if (!budgetService) {
      throw new Error('Budget service not available');
    }
    
    return await budgetService.getBudgetProgress(budgetId);
  }, [budgetService]);

  const calculateBudgetSpending = useCallback(async (budgetId: string, transactions: any[]) => {
    if (!budgetService) {
      throw new Error('Budget service not available');
    }
    
    return await budgetService.calculateBudgetSpending(budgetId, transactions);
  }, [budgetService]);

  // Budget alert operations
  const createBudgetAlert = useCallback(async (budgetId: string, alert: Omit<BudgetAlert, 'id' | 'createdAt'>) => {
    if (!budgetService) {
      throw new Error('Budget service not available');
    }
    
    return await budgetService.createBudgetAlert(budgetId, alert);
  }, [budgetService]);

  const getBudgetAlerts = useCallback(async (budgetId: string) => {
    if (!budgetService) {
      throw new Error('Budget service not available');
    }
    
    return await budgetService.getBudgetAlerts(budgetId);
  }, [budgetService]);

  const updateBudgetAlert = useCallback(async (alertId: string, updates: Partial<BudgetAlert>) => {
    if (!budgetService) {
      throw new Error('Budget service not available');
    }
    
    return await budgetService.updateBudgetAlert(alertId, updates);
  }, [budgetService]);

  // Utility functions
  const refreshBudgets = useCallback(async () => {
    if (!budgetService) return;

    // Check if we're in demo mode
    const isDemoMode = localStorage.getItem('financeapp-demo-mode') === 'true' || 
                      new URLSearchParams(window.location.search).get('demo') === 'true';
    
    // Use demo user ID if in demo mode, otherwise require current user
    const userId = isDemoMode ? 'demo-user' : currentUser?.id;
    
    if (!userId) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const [budgetsData, summaryData] = await Promise.all([
        budgetService.getBudgets(userId),
        budgetService.getBudgetSummary(userId),
      ]);
      
      setBudgets(budgetsData);
      setBudgetSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh budgets');
    } finally {
      setIsLoading(false);
    }
  }, [budgetService, currentUser?.id]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Budget data
    budgets,
    budgetSummary,
    selectedBudget,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error states
    error,
    
    // Budget operations
    createBudget,
    updateBudget,
    deleteBudget,
    selectBudget,
    
    // Budget progress
    getBudgetProgress,
    calculateBudgetSpending,
    
    // Budget alerts
    createBudgetAlert,
    getBudgetAlerts,
    updateBudgetAlert,
    
    // Utility functions
    refreshBudgets,
    clearError,
  };
}; 