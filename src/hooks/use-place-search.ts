import { useEffect, useState } from 'react';

import { searchPlaces, type GeoPlace } from '@/services/geocoding';

const DEBOUNCE_MS = 450;
const MIN_QUERY_LENGTH = 3;

type SearchState = {
  scope: string | null;
  query: string;
  results: GeoPlace[];
  error: string | null;
};

/**
 * Debounced address autocomplete. `scope` identifies the input being searched so
 * results from one field are never shown under another.
 */
export function usePlaceSearch(query: string | null, scope: string | null) {
  const [state, setState] = useState<SearchState>({ scope: null, query: '', results: [], error: null });

  const trimmed = query?.trim() ?? '';
  const enabled = trimmed.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      searchPlaces(trimmed, controller.signal)
        .then((results) => setState({ scope, query: trimmed, results, error: null }))
        .catch((reason: unknown) => {
          if (reason instanceof Error && reason.name === 'AbortError') return;
          setState({ scope, query: trimmed, results: [], error: 'Não foi possível buscar endereços agora.' });
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmed, enabled, scope]);

  const sameScope = state.scope === scope;
  const isFresh = sameScope && state.query === trimmed;

  return {
    enabled,
    // Previous results of the same field stay visible while the next query is in flight.
    results: enabled && sameScope ? state.results : [],
    loading: enabled && !isFresh,
    error: enabled && isFresh ? state.error : null,
  };
}
