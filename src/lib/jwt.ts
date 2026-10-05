const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/** Decodes the JWT payload without validating the signature (the backend does that). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split('.');
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = atob(padded);
    const utf8 = Array.from(binary, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('');
    return JSON.parse(decodeURIComponent(utf8)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Returns the user UUID if the token carries it in a common claim. */
export function userIdFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const candidate = [payload.sub, payload.id, payload.userId, payload.usuarioId].find(isUuid);
  return candidate ?? null;
}
