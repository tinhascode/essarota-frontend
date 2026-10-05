import { ApiError } from '@/services/http';

export function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof ApiError ? reason.message : fallback;
}

export function errorStatus(reason: unknown): number | null {
  return reason instanceof ApiError ? reason.status : null;
}
