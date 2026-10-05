import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import { errorMessage, errorStatus } from '@/lib/errors';

type FocusQuery<T> = {
  data: T | null;
  error: string | null;
  status: number | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  setData: Dispatch<SetStateAction<T | null>>;
};

/** Loads data every time the screen gains focus. `fetcher` must be memoized. */
export function useFocusQuery<T>(fetcher: () => Promise<T>, fallbackError: string): FocusQuery<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const result = await fetcher();
      if (id !== requestId.current) return;
      setData(result);
      setError(null);
      setStatus(null);
    } catch (reason) {
      if (id !== requestId.current) return;
      setError(errorMessage(reason, fallbackError));
      setStatus(errorStatus(reason));
    }
  }, [fetcher, fallbackError]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return { data, error, status, loading: data === null && error === null, refreshing, refresh, setData };
}
