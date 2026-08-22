import { useCallback, useEffect, useRef, useState } from 'react';
import { friendlyError } from '../services/apiClient';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setData: (value: T | null) => void;
}

/** Fetch helper with loading / error states and an optional localStorage cache
 *  so a returning user sees their last known data instantly. */
export function useAsync<T>(
fetcher: () => Promise<T>,
deps: unknown[] = [],
cacheKey?: string)
: AsyncState<T> {
  const [data, setData] = useState<T | null>(() => {
    if (!cacheKey) return null;
    try {
      const raw = localStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) as T : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (!mounted.current) return;
      setData(result);
      if (cacheKey) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result));
        } catch {

          /* ignore quota errors */}
      }
    } catch (err) {
      if (mounted.current) setError(friendlyError(err));
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void run();
  }, [run]);

  return { data, loading, error, reload: run, setData };
}