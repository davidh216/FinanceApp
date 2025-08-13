import { Budget, BudgetProgress, BudgetSummary, BudgetAlert, TimePeriod } from '../types/financial';
import { 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  DocumentData,
  collection,
  doc
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface BudgetServiceConfig {
  useMockData: boolean;
  apiBaseUrl?: string;
  apiKey?: string;
}

export interface BudgetServiceResponse<T> {
  data: T;
  error?: string;
  loading: boolean;
}

export interface BudgetService {
  // Budget operations
  createBudget(budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Budget>;
  getBudgets(userId: string): Promise<Budget[]>;
  getBudget(id: string): Promise<Budget | null>;
  updateBudget(id: string, updates: Partial<Budget>): Promise<Budget>;
  deleteBudget(id: string): Promise<boolean>;
  
  // Budget progress and analytics
  getBudgetProgress(budgetId: string): Promise<BudgetProgress>;
  getBudgetSummary(userId: string): Promise<BudgetSummary>;
  calculateBudgetSpending(budgetId: string, transactions: any[]): Promise<number>;
  
  // Budget alerts
  createBudgetAlert(budgetId: string, alert: Omit<BudgetAlert, 'id' | 'createdAt'>): Promise<BudgetAlert>;
  getBudgetAlerts(budgetId: string): Promise<BudgetAlert[]>;
  updateBudgetAlert(alertId: string, updates: Partial<BudgetAlert>): Promise<BudgetAlert>;
  
  // Real-time subscriptions
  subscribeToBudgets(userId: string, callback: (budgets: Budget[]) => void): () => void;
  subscribeToBudgetProgress(budgetId: string, callback: (progress: BudgetProgress) => void): () => void;
}

class MockBudgetService implements BudgetService {
  private budgets: Budget[] = [];
  private alerts: BudgetAlert[] = [];

  constructor() {
    this.generateMockBudgets();
  }

  private generateMockBudgets(): void {
    const categories = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Utilities', 'Healthcare'];
    const periods: TimePeriod[] = ['month', 'quarter', 'year'];
    
    categories.forEach((category, index) => {
      const period = periods[index % periods.length];
      const amount = Math.random() * 1000 + 200; // $200-$1200
      const spent = Math.random() * amount;
      
      this.budgets.push({
        id: `budget-${index}`,
        userId: 'mock-user',
        category,
        amount,
        period,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        spent,
        remaining: amount - spent,
        alerts: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  }

  async createBudget(budgetData: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const budget: Budget = {
      ...budgetData,
      id: `budget-${Date.now()}`,
      userId: 'mock-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.budgets.push(budget);
    return budget;
  }

  async getBudgets(userId: string): Promise<Budget[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.budgets.filter(budget => budget.userId === userId);
  }

  async getBudget(id: string): Promise<Budget | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return this.budgets.find(budget => budget.id === id) || null;
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const index = this.budgets.findIndex(budget => budget.id === id);
    if (index === -1) {
      throw new Error('Budget not found');
    }
    
    this.budgets[index] = {
      ...this.budgets[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    return this.budgets[index];
  }

  async deleteBudget(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const index = this.budgets.findIndex(budget => budget.id === id);
    if (index === -1) {
      return false;
    }
    
    this.budgets.splice(index, 1);
    return true;
  }

  async getBudgetProgress(budgetId: string): Promise<BudgetProgress> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const budget = this.budgets.find(b => b.id === budgetId);
    if (!budget) {
      throw new Error('Budget not found');
    }
    
    const percentageUsed = (budget.spent / budget.amount) * 100;
    const isOverBudget = budget.spent > budget.amount;
    const daysRemaining = Math.ceil((new Date(budget.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const projectedSpending = budget.spent + (budget.spent / (30 - daysRemaining)) * daysRemaining;
    
    return {
      budgetId,
      spent: budget.spent,
      remaining: budget.remaining,
      percentageUsed,
      isOverBudget,
      daysRemaining: Math.max(0, daysRemaining),
      projectedSpending,
    };
  }

  async getBudgetSummary(userId: string): Promise<BudgetSummary> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const userBudgets = this.budgets.filter(budget => budget.userId === userId && budget.isActive);
    const totalBudgeted = userBudgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = userBudgets.reduce((sum, budget) => sum + budget.spent, 0);
    const totalRemaining = totalBudgeted - totalSpent;
    const overBudgetCategories = userBudgets
      .filter(budget => budget.spent > budget.amount)
      .map(budget => budget.category);
    
    const upcomingAlerts = this.alerts.filter(alert => 
      userBudgets.some(budget => budget.id === alert.id && !alert.triggered)
    );
    
    return {
      totalBudgets: userBudgets.length,
      totalBudgeted,
      totalSpent,
      totalRemaining,
      overBudgetCategories,
      upcomingAlerts,
    };
  }

  async calculateBudgetSpending(budgetId: string, transactions: any[]): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const budget = this.budgets.find(b => b.id === budgetId);
    if (!budget) {
      return 0;
    }
    
    // Filter transactions by category and date range
    const relevantTransactions = transactions.filter(tx => 
      tx.category === budget.category &&
      new Date(tx.date) >= new Date(budget.startDate) &&
      new Date(tx.date) <= new Date(budget.endDate) &&
      tx.amount < 0 // Only expenses
    );
    
    return Math.abs(relevantTransactions.reduce((sum, tx) => sum + tx.amount, 0));
  }

  async createBudgetAlert(budgetId: string, alertData: Omit<BudgetAlert, 'id' | 'createdAt'>): Promise<BudgetAlert> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const alert: BudgetAlert = {
      ...alertData,
      id: `alert-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    this.alerts.push(alert);
    return alert;
  }

  async getBudgetAlerts(budgetId: string): Promise<BudgetAlert[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return this.alerts.filter(alert => alert.id === budgetId);
  }

  async updateBudgetAlert(alertId: string, updates: Partial<BudgetAlert>): Promise<BudgetAlert> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const index = this.alerts.findIndex(alert => alert.id === alertId);
    if (index === -1) {
      throw new Error('Alert not found');
    }
    
    this.alerts[index] = {
      ...this.alerts[index],
      ...updates,
    };
    
    return this.alerts[index];
  }

  subscribeToBudgets(userId: string, callback: (budgets: Budget[]) => void): () => void {
    // Mock subscription - just call once with current data
    setTimeout(() => {
      const userBudgets = this.budgets.filter(budget => budget.userId === userId);
      callback(userBudgets);
    }, 100);
    
    // Return unsubscribe function
    return () => {};
  }

  subscribeToBudgetProgress(budgetId: string, callback: (progress: BudgetProgress) => void): () => void {
    // Mock subscription - just call once with current data
    setTimeout(async () => {
      const progress = await this.getBudgetProgress(budgetId);
      callback(progress);
    }, 100);
    
    // Return unsubscribe function
    return () => {};
  }
}

class FirebaseBudgetService implements BudgetService {
  private config: BudgetServiceConfig;
  private userId: string;

  constructor(config: BudgetServiceConfig, userId: string) {
    this.config = config;
    this.userId = userId;
  }

  private getUserBudgetsCollection() {
    return collection(db, 'users', this.userId, 'budgets');
  }

  private getBudgetDocRef(budgetId: string) {
    return doc(db, 'users', this.userId, 'budgets', budgetId);
  }

  private convertTimestamp(timestamp: Timestamp | string): string {
    if (typeof timestamp === 'string') return timestamp;
    return timestamp.toDate().toISOString();
  }

  private convertToTimestamp(dateString: string): Timestamp {
    return Timestamp.fromDate(new Date(dateString));
  }

  private convertFirestoreToBudget(doc: DocumentData): Budget {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      category: data.category,
      amount: data.amount,
      period: data.period,
      startDate: this.convertTimestamp(data.startDate),
      endDate: this.convertTimestamp(data.endDate),
      spent: data.spent || 0,
      remaining: data.remaining || data.amount,
      alerts: data.alerts || [],
      isActive: data.isActive !== false,
      createdAt: this.convertTimestamp(data.createdAt || serverTimestamp()),
      updatedAt: this.convertTimestamp(data.updatedAt || serverTimestamp()),
    };
  }

  async createBudget(budgetData: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    try {
      const budgetsRef = this.getUserBudgetsCollection();
      const budgetDoc = {
        ...budgetData,
        userId: this.userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(budgetsRef, budgetDoc);
      const budgetSnap = await getDoc(docRef);
      
      if (budgetSnap.exists()) {
        return this.convertFirestoreToBudget(budgetSnap);
      }
      
      throw new Error('Failed to create budget');
    } catch (error) {
      console.error('Error creating budget:', error);
      throw new Error('Failed to create budget');
    }
  }

  async getBudgets(userId: string): Promise<Budget[]> {
    try {
      const budgetsRef = this.getUserBudgetsCollection();
      const querySnapshot = await getDocs(budgetsRef);
      
      return querySnapshot.docs.map(doc => this.convertFirestoreToBudget(doc));
    } catch (error) {
      console.error('Error fetching budgets:', error);
      throw new Error('Failed to fetch budgets');
    }
  }

  async getBudget(id: string): Promise<Budget | null> {
    try {
      const budgetRef = this.getBudgetDocRef(id);
      const budgetSnap = await getDoc(budgetRef);
      
      if (budgetSnap.exists()) {
        return this.convertFirestoreToBudget(budgetSnap);
      }
      return null;
    } catch (error) {
      console.error('Error fetching budget:', error);
      throw new Error('Failed to fetch budget');
    }
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    try {
      const budgetRef = this.getBudgetDocRef(id);
      const updatedBudget = {
        ...updates,
        updatedAt: serverTimestamp(),
      };
      
      await updateDoc(budgetRef, updatedBudget);
      
      // Fetch updated budget
      const budgetSnap = await getDoc(budgetRef);
      if (budgetSnap.exists()) {
        return this.convertFirestoreToBudget(budgetSnap);
      }
      
      throw new Error('Budget not found');
    } catch (error) {
      console.error('Error updating budget:', error);
      throw new Error('Failed to update budget');
    }
  }

  async deleteBudget(id: string): Promise<boolean> {
    try {
      const budgetRef = this.getBudgetDocRef(id);
      await deleteDoc(budgetRef);
      return true;
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw new Error('Failed to delete budget');
    }
  }

  async getBudgetProgress(budgetId: string): Promise<BudgetProgress> {
    try {
      const budget = await this.getBudget(budgetId);
      if (!budget) {
        throw new Error('Budget not found');
      }
      
      const percentageUsed = (budget.spent / budget.amount) * 100;
      const isOverBudget = budget.spent > budget.amount;
      const daysRemaining = Math.ceil((new Date(budget.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const projectedSpending = budget.spent + (budget.spent / (30 - daysRemaining)) * daysRemaining;
      
      return {
        budgetId,
        spent: budget.spent,
        remaining: budget.remaining,
        percentageUsed,
        isOverBudget,
        daysRemaining: Math.max(0, daysRemaining),
        projectedSpending,
      };
    } catch (error) {
      console.error('Error calculating budget progress:', error);
      throw new Error('Failed to calculate budget progress');
    }
  }

  async getBudgetSummary(userId: string): Promise<BudgetSummary> {
    try {
      const budgets = await this.getBudgets(userId);
      const activeBudgets = budgets.filter(budget => budget.isActive);
      
      const totalBudgeted = activeBudgets.reduce((sum, budget) => sum + budget.amount, 0);
      const totalSpent = activeBudgets.reduce((sum, budget) => sum + budget.spent, 0);
      const totalRemaining = totalBudgeted - totalSpent;
      const overBudgetCategories = activeBudgets
        .filter(budget => budget.spent > budget.amount)
        .map(budget => budget.category);
      
      const upcomingAlerts = activeBudgets.flatMap(budget => 
        budget.alerts.filter(alert => !alert.triggered)
      );
      
      return {
        totalBudgets: activeBudgets.length,
        totalBudgeted,
        totalSpent,
        totalRemaining,
        overBudgetCategories,
        upcomingAlerts,
      };
    } catch (error) {
      console.error('Error calculating budget summary:', error);
      throw new Error('Failed to calculate budget summary');
    }
  }

  async calculateBudgetSpending(budgetId: string, transactions: any[]): Promise<number> {
    try {
      const budget = await this.getBudget(budgetId);
      if (!budget) {
        return 0;
      }
      
      // Filter transactions by category and date range
      const relevantTransactions = transactions.filter(tx => 
        tx.category === budget.category &&
        new Date(tx.date) >= new Date(budget.startDate) &&
        new Date(tx.date) <= new Date(budget.endDate) &&
        tx.amount < 0 // Only expenses
      );
      
      return Math.abs(relevantTransactions.reduce((sum, tx) => sum + tx.amount, 0));
    } catch (error) {
      console.error('Error calculating budget spending:', error);
      throw new Error('Failed to calculate budget spending');
    }
  }

  async createBudgetAlert(budgetId: string, alertData: Omit<BudgetAlert, 'id' | 'createdAt'>): Promise<BudgetAlert> {
    try {
      const budget = await this.getBudget(budgetId);
      if (!budget) {
        throw new Error('Budget not found');
      }
      
      const alert: BudgetAlert = {
        ...alertData,
        id: `alert-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      
      // Add alert to budget
      const updatedAlerts = [...budget.alerts, alert];
      await this.updateBudget(budgetId, { alerts: updatedAlerts });
      
      return alert;
    } catch (error) {
      console.error('Error creating budget alert:', error);
      throw new Error('Failed to create budget alert');
    }
  }

  async getBudgetAlerts(budgetId: string): Promise<BudgetAlert[]> {
    try {
      const budget = await this.getBudget(budgetId);
      return budget?.alerts || [];
    } catch (error) {
      console.error('Error fetching budget alerts:', error);
      throw new Error('Failed to fetch budget alerts');
    }
  }

  async updateBudgetAlert(alertId: string, updates: Partial<BudgetAlert>): Promise<BudgetAlert> {
    try {
      // Find budget containing this alert
      const budgets = await this.getBudgets(this.userId);
      const budgetWithAlert = budgets.find(budget => 
        budget.alerts.some(alert => alert.id === alertId)
      );
      
      if (!budgetWithAlert) {
        throw new Error('Alert not found');
      }
      
      // Update the alert
      const updatedAlerts = budgetWithAlert.alerts.map(alert => 
        alert.id === alertId ? { ...alert, ...updates } : alert
      );
      
      await this.updateBudget(budgetWithAlert.id, { alerts: updatedAlerts });
      
      const updatedAlert = updatedAlerts.find(alert => alert.id === alertId);
      if (!updatedAlert) {
        throw new Error('Failed to update alert');
      }
      
      return updatedAlert;
    } catch (error) {
      console.error('Error updating budget alert:', error);
      throw new Error('Failed to update budget alert');
    }
  }

  subscribeToBudgets(userId: string, callback: (budgets: Budget[]) => void): () => void {
    const budgetsRef = this.getUserBudgetsCollection();
    return onSnapshot(budgetsRef, (snapshot) => {
      const budgets = snapshot.docs.map(doc => this.convertFirestoreToBudget(doc));
      callback(budgets);
    });
  }

  subscribeToBudgetProgress(budgetId: string, callback: (progress: BudgetProgress) => void): () => void {
    const budgetRef = this.getBudgetDocRef(budgetId);
    return onSnapshot(budgetRef, async (snapshot: any) => {
      if (snapshot.exists()) {
        const progress = await this.getBudgetProgress(budgetId);
        callback(progress);
      }
    });
  }
}

export function createBudgetService(config: BudgetServiceConfig, userId?: string): BudgetService {
  if (config.useMockData) {
    return new MockBudgetService();
  } else {
    if (!userId) {
      throw new Error('User ID is required for Firebase BudgetService');
    }
    return new FirebaseBudgetService(config, userId);
  }
}

// Export classes for testing
export { MockBudgetService, FirebaseBudgetService };

// Default export for convenience
export default createBudgetService; 