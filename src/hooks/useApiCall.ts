import { useState, useCallback, useRef } from 'react';

export interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface ApiCallOptions {
  retryCount?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  immediate?: boolean;
}

export interface ApiCallResult<T> extends ApiCallState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  retry: () => Promise<T | null>;
  setData: (data: T) => void;
}

export function useApiCall<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: ApiCallOptions = {}
): ApiCallResult<T> {
  const {
    retryCount = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    immediate = false,
  } = options;

  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const retryCountRef = useRef(0);
  const apiFunctionRef = useRef(apiFunction);

  // Update the API function reference if it changes
  apiFunctionRef.current = apiFunction;

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      retryCountRef.current = 0;

      try {
        const result = await apiFunctionRef.current(...args);
        
        setState({
          data: result,
          loading: false,
          error: null,
          lastUpdated: new Date(),
        });

        onSuccess?.(result);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));

        onError?.(errorMessage);
        return null;
      }
    },
    [onSuccess, onError]
  );

  const retry = useCallback(
    async (...args: any[]): Promise<T | null> => {
      if (retryCountRef.current >= retryCount) {
        const errorMessage = `Failed after ${retryCount} retries`;
        setState(prev => ({ ...prev, error: errorMessage }));
        onError?.(errorMessage);
        return null;
      }

      retryCountRef.current += 1;
      
      // Add delay before retry
      if (retryCountRef.current > 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }

      return execute(...args);
    },
    [execute, retryCount, retryDelay, onError]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null,
    });
    retryCountRef.current = 0;
  }, []);

  // Execute immediately if requested
  if (immediate && !state.data && !state.loading && !state.error) {
    execute();
  }

  return {
    ...state,
    execute,
    reset,
    retry,
    setData: (data: T) => setState(prev => ({ ...prev, data })),
  };
}

// Specialized hooks for common API patterns
export function useDataFetching<T = any>(
  fetchFunction: () => Promise<T>,
  options: ApiCallOptions = {}
): ApiCallResult<T> {
  return useApiCall(fetchFunction, options);
}

export function useDataMutation<T = any, R = any>(
  mutationFunction: (data: T) => Promise<R>,
  options: ApiCallOptions = {}
): ApiCallResult<R> & { mutate: (data: T) => Promise<R | null> } {
  const result = useApiCall(mutationFunction, options);
  
  const mutate = useCallback(
    async (data: T): Promise<R | null> => {
      return result.execute(data);
    },
    [result]
  );

  return {
    ...result,
    mutate,
  };
}

// Hook for optimistic updates
export function useOptimisticUpdate<T = any>(
  updateFunction: (data: T) => Promise<T>,
  options: ApiCallOptions = {}
): ApiCallResult<T> & { 
  optimisticUpdate: (data: T, optimisticData: T) => Promise<T | null> 
} {
  const result = useApiCall(updateFunction, options);
  
  const optimisticUpdate = useCallback(
    async (data: T, optimisticData: T): Promise<T | null> => {
      // Set optimistic data immediately
      result.setData(optimisticData);
      
      try {
        const response = await result.execute(data);
        return response;
      } catch (error) {
        // Revert to previous data on error
        if (result.data) {
          result.setData(result.data);
        }
        throw error;
      }
    },
    [result]
  );

  return {
    ...result,
    optimisticUpdate,
  };
}

// Hook for pagination
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export function usePaginatedData<T = any>(
  fetchFunction: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
  pageSize: number = 10,
  options: ApiCallOptions = {}
) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize,
    total: 0,
    hasMore: true,
  });

  const [allData, setAllData] = useState<T[]>([]);
  
  const result = useApiCall(
    async (page: number, pageSize: number) => {
      const response = await fetchFunction(page, pageSize);
      return response;
    },
    options
  );

  const loadMore = useCallback(async () => {
    if (!pagination.hasMore || result.loading) return;

    const nextPage = pagination.page + 1;
    const response = await result.execute(nextPage, pagination.pageSize);
    
    if (response) {
      setAllData(prev => [...prev, ...response.data]);
      setPagination(prev => ({
        ...prev,
        page: nextPage,
        total: response.total,
        hasMore: allData.length + response.data.length < response.total,
      }));
    }
  }, [pagination, result, allData.length]);

  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || result.loading) return;

    const response = await result.execute(page, pagination.pageSize);
    
    if (response) {
      setAllData(response.data);
      setPagination(prev => ({
        ...prev,
        page,
        total: response.total,
        hasMore: response.data.length === pagination.pageSize && 
                 response.data.length * page < response.total,
      }));
    }
  }, [pagination.pageSize, result]);

  const refresh = useCallback(async () => {
    setAllData([]);
    setPagination(prev => ({ ...prev, page: 1, hasMore: true }));
    await goToPage(1);
  }, [goToPage]);

  return {
    ...result,
    data: allData,
    pagination,
    loadMore,
    goToPage,
    refresh,
  };
} 