import { useMemo, useCallback, useRef } from 'react';

export interface PerformanceConfig {
  enableMemoization?: boolean;
  enableDebouncing?: boolean;
  debounceDelay?: number;
  enableThrottling?: boolean;
  throttleDelay?: number;
}

export interface UsePerformanceOptimizationReturn {
  memoizedValue: <T>(value: T, dependencies: any[]) => T;
  debouncedCallback: <T extends (...args: any[]) => any>(callback: T, delay?: number) => T;
  throttledCallback: <T extends (...args: any[]) => any>(callback: T, delay?: number) => T;
  shouldUpdate: (dependencies: any[], equalityFn?: (prev: any[], next: any[]) => boolean) => boolean;
}

export const usePerformanceOptimization = (
  config: PerformanceConfig = {}
): UsePerformanceOptimizationReturn => {
  const {
    enableMemoization = true,
    enableDebouncing = true,
    debounceDelay = 300,
    enableThrottling = true,
    throttleDelay = 100,
  } = config;

  const debounceTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const throttleLastCall = useRef<Map<string, number>>(new Map());
  const lastDependencies = useRef<any[]>([]);

  // Memoization helper
  const memoizedValue = useCallback(
    <T>(value: T, dependencies: any[]): T => {
      if (!enableMemoization) return value;
      
      return useMemo(() => value, dependencies);
    },
    [enableMemoization]
  );

  // Debouncing helper
  const debouncedCallback = useCallback(
    <T extends (...args: any[]) => any>(callback: T, delay: number = debounceDelay): T => {
      if (!enableDebouncing) return callback;

      return ((...args: any[]) => {
        const key = callback.toString();
        const existingTimeout = debounceTimeouts.current.get(key);
        
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        const newTimeout = setTimeout(() => {
          callback(...args);
          debounceTimeouts.current.delete(key);
        }, delay);

        debounceTimeouts.current.set(key, newTimeout);
      }) as T;
    },
    [enableDebouncing, debounceDelay]
  );

  // Throttling helper
  const throttledCallback = useCallback(
    <T extends (...args: any[]) => any>(callback: T, delay: number = throttleDelay): T => {
      if (!enableThrottling) return callback;

      return ((...args: any[]) => {
        const key = callback.toString();
        const now = Date.now();
        const lastCall = throttleLastCall.current.get(key) || 0;

        if (now - lastCall >= delay) {
          callback(...args);
          throttleLastCall.current.set(key, now);
        }
      }) as T;
    },
    [enableThrottling, throttleDelay]
  );

  // Dependency comparison helper
  const shouldUpdate = useCallback(
    (dependencies: any[], equalityFn?: (prev: any[], next: any[]) => boolean): boolean => {
      const defaultEqualityFn = (prev: any[], next: any[]) => {
        if (prev.length !== next.length) return true;
        return prev.some((value, index) => value !== next[index]);
      };

      const fn = equalityFn || defaultEqualityFn;
      const shouldUpdate = fn(lastDependencies.current, dependencies);
      
      if (shouldUpdate) {
        lastDependencies.current = [...dependencies];
      }

      return shouldUpdate;
    },
    []
  );

  return {
    memoizedValue,
    debouncedCallback,
    throttledCallback,
    shouldUpdate,
  };
};

// Specialized hooks for common patterns
export const useOptimizedCalculation = <T>(
  calculation: () => T,
  dependencies: any[],
  config: PerformanceConfig = {}
): T => {
  const { memoizedValue } = usePerformanceOptimization(config);
  return memoizedValue(calculation(), dependencies);
};

export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[],
  config: PerformanceConfig = {}
): T => {
  const { memoizedValue } = usePerformanceOptimization(config);
  return memoizedValue(callback, dependencies);
}; 