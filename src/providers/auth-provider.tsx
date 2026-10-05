import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { userIdFromToken } from '@/lib/jwt';
import { storage, StorageKeys } from '@/lib/storage';
import { cadastrar, login } from '@/services/auth';
import { setAuthToken, setUnauthorizedHandler } from '@/services/http';
import { buscarUsuario, listarUsuarios } from '@/services/usuarios';
import type { CriarUsuarioRequest, LoginRequest, UsuarioResponse } from '@/types/api';

export type Profile = {
  id: string | null;
  email: string;
  nome: string | null;
  telefoneWhatsapp: string | null;
};

type AuthContextValue = {
  isLoading: boolean;
  token: string | null;
  profile: Profile | null;
  signIn: (credentials: LoginRequest) => Promise<void>;
  signUp: (data: CriarUsuarioRequest) => Promise<void>;
  /** `forget` also drops the cached profile (used after deleting the account). */
  signOut: (options?: { forget?: boolean }) => void;
  /** Reloads the profile from `GET /usuarios/{id}` (resolving the id first if needed). */
  refreshProfile: () => Promise<Profile | null>;
  /** Applies a `UsuarioResponse` returned by the API (e.g. after `PUT`). */
  applyUser: (usuario: UsuarioResponse) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readProfile(): Promise<Profile | null> {
  const raw = await storage.get(StorageKeys.session);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Profile> & { email: string };
    return {
      id: parsed.id ?? null,
      email: parsed.email,
      nome: parsed.nome ?? null,
      telefoneWhatsapp: parsed.telefoneWhatsapp ?? null,
    };
  } catch {
    return null;
  }
}

function persistProfile(profile: Profile) {
  return storage.set(StorageKeys.session, JSON.stringify(profile));
}

function profileFromUser(usuario: UsuarioResponse): Profile {
  return {
    id: usuario.id,
    email: usuario.email.toLowerCase(),
    nome: usuario.nome,
    telefoneWhatsapp: usuario.telefoneWhatsapp,
  };
}

/** The backend has no `/me`, so the id comes from the JWT or from matching the e-mail. */
async function resolveUserId(token: string, email: string): Promise<string | null> {
  const fromToken = userIdFromToken(token);
  if (fromToken) return fromToken;
  const usuarios = await listarUsuarios();
  return usuarios.find((usuario) => usuario.email.toLowerCase() === email)?.id ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const applyToken = useCallback((next: string | null) => {
    setAuthToken(next);
    setToken(next);
  }, []);

  const applyProfile = useCallback((next: Profile) => {
    setProfile(next);
    persistProfile(next);
  }, []);

  const signOut = useCallback(
    (options?: { forget?: boolean }) => {
      applyToken(null);
      storage.remove(StorageKeys.token);
      if (options?.forget) {
        storage.remove(StorageKeys.session);
        setProfile(null);
      }
    },
    [applyToken]
  );

  const loadProfile = useCallback(
    async (currentToken: string, base: Profile): Promise<Profile | null> => {
      try {
        const id = base.id ?? (await resolveUserId(currentToken, base.email));
        if (!id) return base;
        const next = profileFromUser(await buscarUsuario(id));
        applyProfile(next);
        return next;
      } catch {
        return base;
      }
    },
    [applyProfile]
  );

  useEffect(() => {
    Promise.all([storage.get(StorageKeys.token), readProfile()])
      .then(([storedToken, storedProfile]) => {
        applyToken(storedToken);
        setProfile(storedProfile);
        if (storedToken && storedProfile) loadProfile(storedToken, storedProfile);
      })
      .finally(() => setIsLoading(false));
  }, [applyToken, loadProfile]);

  useEffect(() => {
    setUnauthorizedHandler(() => signOut());
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const startSession = useCallback(
    async (credentials: LoginRequest, created: UsuarioResponse | null) => {
      const { token: newToken } = await login(credentials);
      const email = credentials.email.trim().toLowerCase();
      const previous = await readProfile();
      const nextProfile: Profile = created
        ? profileFromUser(created)
        : previous?.email === email
          ? previous
          : { id: null, email, nome: null, telefoneWhatsapp: null };
      await Promise.all([storage.set(StorageKeys.token, newToken), persistProfile(nextProfile)]);
      setProfile(nextProfile);
      applyToken(newToken);
      loadProfile(newToken, nextProfile);
    },
    [applyToken, loadProfile]
  );

  const profileId = profile?.id ?? null;
  const profileEmail = profile?.email ?? null;

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    if (!token || !profileEmail) return null;
    try {
      const id = profileId ?? (await resolveUserId(token, profileEmail));
      if (!id) return null;
      const next = profileFromUser(await buscarUsuario(id));
      applyProfile(next);
      return next;
    } catch {
      return null;
    }
  }, [token, profileId, profileEmail, applyProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      token,
      profile,
      signIn: (credentials) => startSession(credentials, null),
      signUp: async (data) => {
        const created = await cadastrar(data);
        await startSession({ email: data.email, senha: data.senha }, created);
      },
      signOut,
      refreshProfile,
      applyUser: (usuario) => applyProfile(profileFromUser(usuario)),
    }),
    [isLoading, token, profile, startSession, signOut, refreshProfile, applyProfile]
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
