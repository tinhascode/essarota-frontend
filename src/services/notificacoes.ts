import { request } from '@/services/http';
import type { CriarNotificacaoRequest, NotificacaoResponse } from '@/types/api';

export async function minhasNotificacoes() {
  const notificacoes = await request<NotificacaoResponse[]>('/notificacoes/me');
  return [...notificacoes].sort((a, b) => b.enviadoEm.localeCompare(a.enviadoEm));
}

export function buscarNotificacao(id: string) {
  return request<NotificacaoResponse>(`/notificacoes/${id}`);
}

export function registrarNotificacao(body: CriarNotificacaoRequest) {
  return request<NotificacaoResponse>('/notificacoes', { method: 'POST', body });
}
