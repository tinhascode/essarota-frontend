import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { storage, StorageKeys } from '@/lib/storage';
import { minhasNotificacoes } from '@/services/notificacoes';
import type { NotificacaoResponse } from '@/types/api';

export const INBOX_POLL_MS = 30_000;

async function readSeenIds(): Promise<Set<string>> {
  const raw = await storage.get(StorageKeys.lastSeenNotificacoes);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function persistSeenIds(ids: Set<string>) {
  return storage.set(StorageKeys.lastSeenNotificacoes, JSON.stringify([...ids]));
}

type InboxContextValue = {
  notificacoes: NotificacaoResponse[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markAllSeen: (ids: string[]) => void;
};

const InboxContext = createContext<InboxContextValue | null>(null);

export function InboxProvider({ children }: { children: ReactNode }) {
  const [notificacoes, setNotificacoes] = useState<NotificacaoResponse[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string> | null>(null);

  const refresh = useCallback(async () => {
    try {
      setNotificacoes(await minhasNotificacoes());
    } catch {
      // Keep the last known list so the badge does not flicker on a transient error.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      void refresh();
    };

    void readSeenIds().then((ids) => {
      if (!cancelled) setSeenIds(ids);
    });

    const timer = setInterval(load, INBOX_POLL_MS);
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') load();
    });
    const timeout = setTimeout(load, 0);

    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(timeout);
      sub.remove();
    };
  }, [refresh]);

  const unreadCount = useMemo(() => {
    if (!seenIds) return 0;
    return notificacoes.filter((item) => !seenIds.has(item.id)).length;
  }, [notificacoes, seenIds]);

  const markAllSeen = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setSeenIds((current) => {
      const next = new Set(current ?? []);
      let changed = false;
      for (const id of ids) {
        if (next.has(id)) continue;
        next.add(id);
        changed = true;
      }
      if (!changed) return current;
      void persistSeenIds(next);
      return next;
    });
  }, []);

  const value = useMemo<InboxContextValue>(
    () => ({ notificacoes, unreadCount, refresh, markAllSeen }),
    [notificacoes, unreadCount, refresh, markAllSeen]
  );

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox(): InboxContextValue {
  const context = useContext(InboxContext);
  if (!context) {
    throw new Error('useInbox must be used within InboxProvider');
  }
  return context;
}
