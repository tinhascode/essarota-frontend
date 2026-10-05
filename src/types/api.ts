export type TipoTransporte = 'METRO' | 'TREM' | 'ONIBUS' | (string & {});
export type SeveridadeAlerta = 'BAIXA' | 'MEDIA' | 'ALTA' | 'GRAVE';
export type CanalNotificacao = 'WHATSAPP' | 'PUSH' | (string & {});

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string> | null;
  retryAfterSeconds?: number;
}

// Autenticação (/api/v1/auth)
export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  tipo: string;
}

// Usuários (/api/v1/usuarios)
export interface CriarUsuarioRequest {
  nome: string;
  email: string;
  senha: string;
  telefoneWhatsapp?: string | null;
}

export interface AtualizarUsuarioRequest {
  nome: string;
  email: string;
  senha?: string | null;
  telefoneWhatsapp?: string | null;
}

export interface UsuarioResponse {
  id: string;
  nome: string;
  email: string;
  telefoneWhatsapp: string | null;
}

// Linhas (/api/v1/linhas)
export interface CriarLinhaRequest {
  nome: string;
  tipo: TipoTransporte;
}

export interface AtualizarLinhaRequest {
  nome: string;
  tipo: TipoTransporte;
}

export interface LinhaResponse {
  id: string;
  nome: string;
  tipo: string;
}

// Trajetos (/api/v1/trajetos)
export interface CriarTrajetoRequest {
  origem: string;
  destino: string;
  tempoEstimadoMinutos?: number | null;
}

export interface AtualizarTrajetoRequest {
  origem: string;
  destino: string;
  tempoEstimadoMinutos?: number | null;
}

export interface TrajetoResponse {
  id: string;
  usuarioId: string;
  origem: string;
  destino: string;
  tempoEstimadoMinutos: number;
}

// Linhas do Trajeto (/api/v1/trajetos/{trajetoId}/linhas)
export interface AssociarLinhaTrajetoRequest {
  linhaId: string;
  ordem?: number;
}

export interface TrajetoLinhaResponse {
  id: string;
  trajetoId: string;
  linhaId: string;
  ordem: number;
}

// Alertas (/api/v1/alertas)
export interface CriarAlertaRequest {
  linhaId: string;
  descricao: string;
  severidade: SeveridadeAlerta;
}

export interface AlertaResponse {
  id: string;
  linhaId: string;
  descricao: string;
  severidade: SeveridadeAlerta;
  criadoEm: string;
}

// Notificações (/api/v1/notificacoes)
export interface CriarNotificacaoRequest {
  usuarioId: string;
  alertaId: string;
  canal: CanalNotificacao;
}

export interface NotificacaoResponse {
  id: string;
  usuarioId: string;
  alertaId: string;
  canal: string;
  enviadoEm: string;
}
