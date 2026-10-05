import { request } from '@/services/http';
import type { CriarUsuarioRequest, LoginRequest, LoginResponse, UsuarioResponse } from '@/types/api';

export function login(body: LoginRequest) {
  return request<LoginResponse>('/auth/login', { method: 'POST', body });
}

export function cadastrar(body: CriarUsuarioRequest) {
  return request<UsuarioResponse>('/usuarios', { method: 'POST', body });
}
