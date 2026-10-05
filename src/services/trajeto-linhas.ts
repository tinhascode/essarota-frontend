import { request } from '@/services/http';
import type { AssociarLinhaTrajetoRequest, TrajetoLinhaResponse } from '@/types/api';

export async function listarLinhasDoTrajeto(trajetoId: string) {
  const items = await request<TrajetoLinhaResponse[]>(`/trajetos/${trajetoId}/linhas`);
  return [...items].sort((a, b) => a.ordem - b.ordem);
}

export function associarLinha(trajetoId: string, body: AssociarLinhaTrajetoRequest) {
  return request<TrajetoLinhaResponse>(`/trajetos/${trajetoId}/linhas`, { method: 'POST', body });
}

export function removerLinha(trajetoId: string, linhaId: string) {
  return request<void>(`/trajetos/${trajetoId}/linhas/${linhaId}`, { method: 'DELETE' });
}
