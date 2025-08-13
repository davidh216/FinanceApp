import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiCall, useDataFetching, useDataMutation, usePaginatedData } from '../useApiCall';

// Mock timers for testing delays
jest.useFakeTimers();

describe('useApiCall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Basic functionality', () => {
    it('should handle successful API calls', async () => {
      const mockApi = jest.fn().mockResolvedValue('success data');
      
      const { result } = renderHook(() => useApiCall(mockApi));
      
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
      
      await act(async () => {
        await result.current.execute();
      });
      
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe('success data');
      expect(result.current.error).toBe(null);
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle API errors', async () => {
      const mockApi = jest.fn().mockRejectedValue(new Error('API Error'));
      
      const { result } = renderHook(() => useApiCall(mockApi));
      
      await act(async () => {
        await result.current.execute();
      });
      
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe('API Error');
    });

    it('should handle loading state', async () => {
      let resolvePromise: (value: string) => void;
      const mockApi = jest.fn().mockImplementation(() => 
        new Promise<string>(resolve => {
          resolvePromise = resolve;
        })
      );
      
      const { result } = renderHook(() => useApiCall(mockApi));
      
      act(() => {
        result.current.execute();
      });
      
      expect(result.current.loading).toBe(true);
      
      await act(async () => {
        resolvePromise!('success');
      });
      
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Retry functionality', () => {
    it('should retry failed calls', async () => {
      const mockApi = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('Success after retries');
      
      const { result } = renderHook(() => useApiCall(mockApi, { retryCount: 2 }));
      
      await act(async () => {
        await result.current.retry();
      });
      
      expect(mockApi).toHaveBeenCalledTimes(3);
      expect(result.current.data).toBe('Success after retries');
    });

    it('should stop retrying after max attempts', async () => {
      const mockApi = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      const { result } = renderHook(() => useApiCall(mockApi, { retryCount: 2 }));
      
      await act(async () => {
        await result.current.retry();
      });
      
      expect(mockApi).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(result.current.error).toBe('Failed after 2 retries');
    });

    it('should respect retry delay', async () => {
      const mockApi = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('Success');
      
      const { result } = renderHook(() => useApiCall(mockApi, { retryDelay: 1000 }));
      
      await act(async () => {
        result.current.retry();
        jest.advanceTimersByTime(1000);
      });
      
      expect(mockApi).toHaveBeenCalledTimes(2);
    });
  });

  describe('Callbacks', () => {
    it('should call onSuccess callback', async () => {
      const mockApi = jest.fn().mockResolvedValue('success');
      const onSuccess = jest.fn();
      
      const { result } = renderHook(() => useApiCall(mockApi, { onSuccess }));
      
      await act(async () => {
        await result.current.execute();
      });
      
      expect(onSuccess).toHaveBeenCalledWith('success');
    });

    it('should call onError callback', async () => {
      const mockApi = jest.fn().mockRejectedValue(new Error('API Error'));
      const onError = jest.fn();
      
      const { result } = renderHook(() => useApiCall(mockApi, { onError }));
      
      await act(async () => {
        await result.current.execute();
      });
      
      expect(onError).toHaveBeenCalledWith('API Error');
    });
  });

  describe('Reset functionality', () => {
    it('should reset state', async () => {
      const mockApi = jest.fn().mockResolvedValue('success');
      
      const { result } = renderHook(() => useApiCall(mockApi));
      
      await act(async () => {
        await result.current.execute();
      });
      
      expect(result.current.data).toBe('success');
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.lastUpdated).toBe(null);
    });
  });

  describe('Immediate execution', () => {
    it('should execute immediately when immediate is true', async () => {
      const mockApi = jest.fn().mockResolvedValue('success');
      
      const { result } = renderHook(() => useApiCall(mockApi, { immediate: true }));
      
      await waitFor(() => {
        expect(result.current.data).toBe('success');
      });
      
      expect(mockApi).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useDataFetching', () => {
  it('should work as a specialized useApiCall', async () => {
    const mockFetch = jest.fn().mockResolvedValue('fetched data');
    
    const { result } = renderHook(() => useDataFetching(mockFetch));
    
    await act(async () => {
      await result.current.execute();
    });
    
    expect(result.current.data).toBe('fetched data');
  });
});

describe('useDataMutation', () => {
  it('should provide mutate function', async () => {
    const mockMutation = jest.fn().mockResolvedValue('mutated data');
    
    const { result } = renderHook(() => useDataMutation(mockMutation));
    
    await act(async () => {
      await result.current.mutate('input data');
    });
    
    expect(mockMutation).toHaveBeenCalledWith('input data');
    expect(result.current.data).toBe('mutated data');
  });
});

describe('usePaginatedData', () => {
  it('should handle pagination correctly', async () => {
    const mockFetch = jest.fn()
      .mockResolvedValueOnce({ data: ['item1', 'item2'], total: 5 })
      .mockResolvedValueOnce({ data: ['item3', 'item4'], total: 5 });
    
    const { result } = renderHook(() => usePaginatedData(mockFetch, 2));
    
    await act(async () => {
      await result.current.goToPage(1);
    });
    
    expect(result.current.data).toEqual(['item1', 'item2']);
    expect(result.current.pagination.page).toBe(1);
    expect(result.current.pagination.total).toBe(5);
    expect(result.current.pagination.hasMore).toBe(true);
    
    await act(async () => {
      await result.current.loadMore();
    });
    
    expect(result.current.data).toEqual(['item1', 'item2', 'item3', 'item4']);
    expect(result.current.pagination.page).toBe(2);
    expect(result.current.pagination.hasMore).toBe(true);
  });

  it('should handle refresh correctly', async () => {
    const mockFetch = jest.fn()
      .mockResolvedValueOnce({ data: ['item1'], total: 1 })
      .mockResolvedValueOnce({ data: ['item1'], total: 1 });
    
    const { result } = renderHook(() => usePaginatedData(mockFetch, 1));
    
    await act(async () => {
      await result.current.goToPage(1);
    });
    
    expect(result.current.data).toEqual(['item1']);
    
    await act(async () => {
      await result.current.refresh();
    });
    
    expect(result.current.pagination.page).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
}); 