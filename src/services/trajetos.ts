import { request } from '@/services/http';
import type { AtualizarTrajetoRequest, CriarTrajetoRequest, TrajetoResponse } from '@/types/api';

export function listarTrajetos() {
  return request<TrajetoResponse[]>('/trajetos');
}

export function buscarTrajeto(id: string) {
  return request<TrajetoResponse>(`/trajetos/${id}`);
}

export function criarTrajeto(body: CriarTrajetoRequest) {
  return request<TrajetoResponse>('/trajetos', { method: 'POST', body });
}

export function atualizarTrajeto(id: string, body: AtualizarTrajetoRequest) {
  return request<TrajetoResponse>(`/trajetos/${id}`, { method: 'PUT', body });
}

export function excluirTrajeto(id: string) {
  return request<void>(`/trajetos/${id}`, { method: 'DELETE' });
}
