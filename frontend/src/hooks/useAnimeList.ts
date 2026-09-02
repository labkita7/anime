import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import type { Page } from '../types';

interface State<T> {
  data: Page<T> | null;
  loading: boolean;
  error: ApiError | null;
}

export function useAnimeList<T>(kind: 'ongoing' | 'complete', page: number, limit = 24) {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    const fetcher = kind === 'ongoing' ? api.ongoing : api.complete;
    fetcher(page, limit)
      .then((data) => {
        if (alive) setState({ data: data as Page<T>, loading: false, error: null });
      })
      .catch((err: ApiError) => {
        if (alive) setState({ data: null, loading: false, error: err });
      });
    return () => {
      alive = false;
    };
  }, [kind, page, limit]);

  return state;
}
