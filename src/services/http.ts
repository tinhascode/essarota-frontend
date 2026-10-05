import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { ApiErrorResponse } from '@/types/api';

const rawBaseUrl = (
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1'
).replace(/\/+$/, '');

const LOOPBACK = /localhost|127\.0\.0\.1/;

// On a device, "localhost" is the device itself: point to the machine running Metro instead.
export const API_BASE_URL = (() => {
  if (Platform.OS === 'web' || !LOOPBACK.test(rawBaseUrl)) return rawBaseUrl;
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (devHost && !LOOPBACK.test(devHost)) return rawBaseUrl.replace(LOOPBACK, devHost);
  if (Platform.OS === 'android') return rawBaseUrl.replace(LOOPBACK, '10.0.2.2');
  return rawBaseUrl;
})();

const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string> | null;
  readonly retryAfterSeconds: number | null;

  constructor(
    status: number,
    message: string,
    fieldErrors: Record<string, string> | null = null,
    retryAfterSeconds: number | null = null
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | undefined>;
};

export async function request<T>(path: string, { method = 'GET', body, query }: RequestOptions = {}): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, value);
  });

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const sentToken = authToken;
  if (sentToken) headers.Authorization = `Bearer ${sentToken}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão.');
  } finally {
    clearTimeout(timeout);
  }

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  const payload = await parseErrorBody(response);

  if (response.status === 401 && sentToken) {
    unauthorizedHandler?.();
    throw new ApiError(401, 'Sua sessão expirou. Entre novamente.');
  }

  if (response.status === 429) {
    const retryAfter =
      payload?.retryAfterSeconds ?? (Number(response.headers.get('Retry-After')) || 60);
    throw new ApiError(
      429,
      `Muitas requisições. Aguarde ${retryAfter}s e tente novamente.`,
      null,
      retryAfter
    );
  }

  throw new ApiError(
    response.status,
    payload?.message ?? 'Algo deu errado. Tente novamente.',
    payload?.fieldErrors ?? null
  );
}

async function parseErrorBody(response: Response): Promise<ApiErrorResponse | null> {
  try {
    return (await response.json()) as ApiErrorResponse;
  } catch {
    return null;
  }
}
