import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { storage, StorageKeys } from '@/lib/storage';
import { cadastrar, login } from '@/services/auth';
import { setAuthToken, setUnauthorizedHandler } from '@/services/http';
import type { CriarUsuarioRequest, LoginRequest } from '@/types/api';

type Profile = {
  email: string;
  nome: string | null;
};

type AuthContextValue = {
  isLoading: boolean;
  token: string | null;
  profile: Profile | null;
  signIn: (credentials: LoginRequest) => Promise<void>;
  signUp: (data: CriarUsuarioRequest) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readProfile(): Promise<Profile | null> {
  const raw = await storage.get(StorageKeys.session);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const applyToken = useCallback((next: string | null) => {
    setAuthToken(next);
    setToken(next);
  }, []);

  const signOut = useCallback(() => {
    applyToken(null);
    storage.remove(StorageKeys.token);
  }, [applyToken]);

  useEffect(() => {
    Promise.all([storage.get(StorageKeys.token), readProfile()])
      .then(([storedToken, storedProfile]) => {
        applyToken(storedToken);
        setProfile(storedProfile);
      })
      .finally(() => setIsLoading(false));
  }, [applyToken]);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const startSession = useCallback(
    async (credentials: LoginRequest, nome: string | null) => {
      const { token: newToken } = await login(credentials);
      const email = credentials.email.trim().toLowerCase();
      const previous = await readProfile();
      const nextProfile: Profile = {
        email,
        nome: nome ?? (previous?.email === email ? previous.nome : null),
      };
      await Promise.all([
        storage.set(StorageKeys.token, newToken),
        storage.set(StorageKeys.session, JSON.stringify(nextProfile)),
      ]);
      setProfile(nextProfile);
      applyToken(newToken);
    },
    [applyToken]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      token,
      profile,
      signIn: (credentials) => startSession(credentials, null),
      signUp: async (data) => {
        await cadastrar(data);
        await startSession({ email: data.email, senha: data.senha }, data.nome);
      },
      signOut,
    }),
    [isLoading, token, profile, startSession, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
