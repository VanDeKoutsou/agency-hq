import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Φορτώνει έναν πίνακα και τον κρατά συγχρονισμένο σε πραγματικό χρόνο
 * (Supabase Realtime). Επιστρέφει και βοηθητικά upsert/remove για optimistic updates.
 */
export function useTable(table, { order, ascending = true, filter, keep } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const opts = useRef({ order, ascending, keep });
  opts.current = { order, ascending, keep };

  const sortRows = useCallback((list) => {
    const { order: o, ascending: asc } = opts.current;
    if (!o) return list;
    return [...list].sort((a, b) => {
      if (a[o] === b[o]) return 0;
      return (a[o] > b[o] ? 1 : -1) * (asc ? 1 : -1);
    });
  }, []);

  const upsert = useCallback(
    (input) => {
      const items = Array.isArray(input) ? input : [input];
      setRows((prev) => {
        const next = [...prev];
        items.forEach((row) => {
          if (!row) return;
          const i = next.findIndex((r) => r.id === row.id);
          if (i >= 0) next[i] = row;
          else next.push(row);
        });
        return sortRows(next);
      });
    },
    [sortRows]
  );

  const remove = useCallback((id) => setRows((prev) => prev.filter((r) => r.id !== id)), []);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      let q = supabase.from(table).select('*');
      if (filter) q = filter(q);
      if (order) q = q.order(order, { ascending });
      const { data, error: err } = await q;
      if (!alive) return;
      if (err) setError(err);
      else setRows(data);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`rt-${table}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setRows((prev) => prev.filter((r) => r.id !== payload.old.id));
          return;
        }
        const row = payload.new;
        const k = opts.current.keep;
        if (k && !k(row)) {
          setRows((prev) => prev.filter((r) => r.id !== row.id));
          return;
        }
        upsert(row);
      })
      .subscribe((status) => {
        // μετά από επανασύνδεση ξαναφορτώνουμε για να μη χαθεί κάτι
        if (status === 'SUBSCRIBED') load();
      });

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  return { rows, loading, error, upsert, remove };
}
