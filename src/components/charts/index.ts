// Export individual chart components for backward compatibility
export { BalanceTrendChart } from './BalanceTrendChart';
export { IncomeExpenseChart } from './IncomeExpenseChart';
export { CategorySpendingChart } from './CategorySpendingChart';
export { BudgetVsActualChart } from './BudgetVsActualChart';

// Export the new ChartFactory and related types
export { ChartFactory } from './ChartFactory';
export type { ChartType, ChartConfig, ChartFactoryProps } from './ChartFactory';

// Export the chart container
export { ChartContainer } from './ChartContainer';

// Export the base chart component
export { BaseChart } from './BaseChart';
export type { BaseChartProps } from './BaseChart'; 