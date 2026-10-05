import type { IconName } from '@/components/ui/icon';
import type { ThemeColor } from '@/constants/theme';
import type { CanalNotificacao, SeveridadeAlerta, TipoTransporte } from '@/types/api';

export const TIPOS_TRANSPORTE: { value: TipoTransporte; label: string }[] = [
  { value: 'METRO', label: 'Metrô' },
  { value: 'TREM', label: 'Trem' },
  { value: 'ONIBUS', label: 'Ônibus' },
];

export const SEVERIDADES: { value: SeveridadeAlerta; label: string }[] = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'GRAVE', label: 'Grave' },
];

export const CANAIS: { value: CanalNotificacao; label: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'PUSH', label: 'Push' },
];

export function tipoLabel(tipo: string): string {
  return TIPOS_TRANSPORTE.find((item) => item.value === tipo)?.label ?? tipo;
}

export function tipoIcon(tipo: string): IconName {
  if (tipo === 'ONIBUS') return 'bus';
  if (tipo === 'TREM') return 'trem';
  return 'train';
}

export function canalLabel(canal: string): string {
  return CANAIS.find((item) => item.value === canal)?.label ?? canal;
}

export function severidadeLabel(severidade: string): string {
  return SEVERIDADES.find((item) => item.value === severidade)?.label ?? severidade;
}

export function severidadeColors(severidade: string): { color: ThemeColor; background: ThemeColor } {
  switch (severidade) {
    case 'BAIXA':
      return { color: 'teal', background: 'tealSoft' };
    case 'MEDIA':
      return { color: 'warning', background: 'warningSoft' };
    case 'ALTA':
      return { color: 'orange', background: 'orangeSoft' };
    default:
      return { color: 'danger', background: 'dangerSoft' };
  }
}

export function formatDateTime(iso: string): string {
  // Hermes rejects ISO strings with more than 3 fractional digits (the API sends nanoseconds).
  const date = new Date(iso.replace(/(\.\d{3})\d+/, '$1'));
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function initials(nome: string | null | undefined, email: string): string {
  const source = nome?.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}
