import { api } from '@/services/api';

export type Usuario = {
  id: string;
  name: string;
  email: string;
  hasPassword: boolean;
  googleLinked: boolean;
  twoFactorEnabled: boolean;
  /** Códigos de recuperação restantes (null quando o 2FA está desligado). */
  recoveryCodesLeft: number | null;
  createdAt: string;
};

export type Autenticado = { status: 'authenticated'; accessToken: string; user: Usuario };
export type PrecisaDoisFatores = { status: 'two_factor_required'; challengeToken: string };
export type RespostaLogin = Autenticado | PrecisaDoisFatores;
export type RespostaVerificacao = Autenticado & { usedRecoveryCode: boolean; recoveryCodesLeft: number };
export type ConfiguracaoDoisFatores = { secret: string; otpauthUrl: string };

export const authService = {
  cadastrar: (body: { name: string; email: string; password: string }) =>
    api<Autenticado>('/auth/register', { method: 'POST', body }),
  entrar: (body: { email: string; password: string }) =>
    api<RespostaLogin>('/auth/login', { method: 'POST', body }),
  entrarComGoogle: (idToken: string) =>
    api<RespostaLogin>('/auth/google', { method: 'POST', body: { idToken } }),
  verificarDoisFatores: (body: { challengeToken: string; code: string }) =>
    api<RespostaVerificacao>('/auth/2fa/verify', { method: 'POST', body }),
  eu: () => api<Usuario>('/auth/me'),

  iniciarDoisFatores: () => api<ConfiguracaoDoisFatores>('/auth/2fa/setup', { method: 'POST' }),
  ativarDoisFatores: (code: string) =>
    api<{ recoveryCodes: string[] }>('/auth/2fa/enable', { method: 'POST', body: { code } }),
  desativarDoisFatores: (code: string) =>
    api<null>('/auth/2fa/disable', { method: 'POST', body: { code } }),
};
