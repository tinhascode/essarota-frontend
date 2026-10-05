import { request } from '@/services/http';
import type { AtualizarUsuarioRequest, UsuarioResponse } from '@/types/api';

export function listarUsuarios() {
  return request<UsuarioResponse[]>('/usuarios');
}

export function buscarUsuario(id: string) {
  return request<UsuarioResponse>(`/usuarios/${id}`);
}

export function atualizarUsuario(id: string, body: AtualizarUsuarioRequest) {
  return request<UsuarioResponse>(`/usuarios/${id}`, { method: 'PUT', body });
}

export function excluirUsuario(id: string) {
  return request<void>(`/usuarios/${id}`, { method: 'DELETE' });
}
