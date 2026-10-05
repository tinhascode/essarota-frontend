import { request } from '@/services/http';
import type { AlertaResponse, CriarAlertaRequest } from '@/types/api';

export async function listarAlertas(linhaId?: string) {
  const alertas = await request<AlertaResponse[]>('/alertas', { query: { linhaId } });
  return [...alertas].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export function buscarAlerta(id: string) {
  return request<AlertaResponse>(`/alertas/${id}`);
}

export function criarAlerta(body: CriarAlertaRequest) {
  return request<AlertaResponse>('/alertas', { method: 'POST', body });
}

export function excluirAlerta(id: string) {
  return request<void>(`/alertas/${id}`, { method: 'DELETE' });
}
