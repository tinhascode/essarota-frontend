import { request } from '@/services/http';
import type { AtualizarLinhaRequest, CriarLinhaRequest, LinhaResponse } from '@/types/api';

export function listarLinhas() {
  return request<LinhaResponse[]>('/linhas');
}

export function buscarLinha(id: string) {
  return request<LinhaResponse>(`/linhas/${id}`);
}

export function criarLinha(body: CriarLinhaRequest) {
  return request<LinhaResponse>('/linhas', { method: 'POST', body });
}

export function atualizarLinha(id: string, body: AtualizarLinhaRequest) {
  return request<LinhaResponse>(`/linhas/${id}`, { method: 'PUT', body });
}

export function excluirLinha(id: string) {
  return request<void>(`/linhas/${id}`, { method: 'DELETE' });
}
