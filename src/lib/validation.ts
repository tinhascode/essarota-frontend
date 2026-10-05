export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WHATSAPP_REGEX = /^\+?[1-9]\d{8,14}$/;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Informe seu e-mail';
  if (!EMAIL_REGEX.test(email.trim())) return 'Formato de e-mail inválido';
}

export function validateSenha(senha: string): string | undefined {
  if (!senha) return 'Informe sua senha';
  if (senha.length < 6) return 'A senha deve ter no mínimo 6 caracteres';
}

export function validateNome(nome: string): string | undefined {
  const length = nome.trim().length;
  if (length < 2 || length > 100) return 'O nome deve ter entre 2 e 100 caracteres';
}

export function normalizeWhatsapp(value: string): string {
  return value.replace(/[\s()-]/g, '');
}

export function validateWhatsapp(value: string): string | undefined {
  if (!value.trim()) return;
  if (!WHATSAPP_REGEX.test(normalizeWhatsapp(value))) return 'Use o formato +5511999998888';
}

export function hasErrors<T extends string>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some(Boolean);
}
