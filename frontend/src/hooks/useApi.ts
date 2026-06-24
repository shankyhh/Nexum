import { useState, useCallback } from 'react';
import api from '../lib/api';
import type { ApiResponse } from '../types';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T = unknown>() {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: false, error: null });

  const execute = useCallback(async (
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    payload?: unknown
  ): Promise<T | null> => {
    setState({ data: null, loading: true, error: null });
    try {
      const res = await api[method]<ApiResponse<T>>(url, payload);
      const data = res.data.data ?? null;
      setState({ data, loading: false, error: null });
      return data;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'An error occurred';
      setState({ data: null, loading: false, error: msg });
      return null;
    }
  }, []);

  const get = useCallback((url: string) => execute('get', url), [execute]);
  const post = useCallback((url: string, data?: unknown) => execute('post', url, data), [execute]);
  const put = useCallback((url: string, data?: unknown) => execute('put', url, data), [execute]);
  const patch = useCallback((url: string, data?: unknown) => execute('patch', url, data), [execute]);
  const del = useCallback((url: string) => execute('delete', url), [execute]);

  return { ...state, get, post, put, patch, del };
}
