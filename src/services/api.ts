import { env } from '@/config/env';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(getErrorMessage(body) ?? `Erro na requisição (${status})`);
  }
}

/** Extrai a mensagem de erro do corpo padrão do NestJS ({ message: string | string[] }). */
function getErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object' || !('message' in body)) return undefined;
  const { message } = body as { message: unknown };
  if (Array.isArray(message)) return message.join('\n');
  return typeof message === 'string' ? message : undefined;
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Define o token JWT enviado em todas as requisições (null para remover). */
export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Função chamada quando a API responde 401 com um token salvo (expirado ou revogado). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function api<T>(path: string, { body, headers, ...init }: RequestOptions = {}): Promise<T> {
  if (!env.apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL não configurada. Copie .env.example para .env.');
  }
  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && authToken) onUnauthorized?.();
    throw new ApiError(response.status, data);
  }

  return data as T;
}

/** Mensagem amigável para mostrar na tela a partir de qualquer erro de requisição. */
export function mensagemDeErro(error: unknown, padrao401 = 'E-mail ou senha incorretos.') {
  if (error instanceof ApiError) {
    if (error.status === 401) return error.message || padrao401;
    if (error.status === 429) return 'Muitas tentativas. Aguarde um minuto e tente de novo.';
    if (error.status < 500) return error.message;
    return 'O servidor está com problemas. Tente novamente em instantes.';
  }
  if (error instanceof Error && error.message.startsWith('EXPO_PUBLIC_API_URL')) return error.message;
  return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
}
