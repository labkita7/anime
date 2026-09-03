import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { SearchItem } from '../types';

export function useSearch(closeSignal?: number) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(() => {
      api
        .search(q)
        .then((res) => {
          setResults(res.data ?? []);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  // sinyal dari parent (mis. navigasi selesai) untuk menutup dropdown
  useEffect(() => {
    if (closeSignal) setOpen(false);
  }, [closeSignal]);

  return { query, setQuery, results, open, setOpen, loading };
}
