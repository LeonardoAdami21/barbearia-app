import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ApiError, setAuthToken, setUnauthorizedHandler } from '@/services/api';
import { authService, type Autenticado, type RespostaLogin, type Usuario } from '@/services/auth';
import { pedirIdTokenDoGoogle, sairDoGoogle } from '@/services/google';
import { tokenStorage } from '@/services/token-storage';

type Status = 'loading' | 'signedIn' | 'signedOut';

/** Resultado de uma tentativa de login, para a tela decidir o próximo passo. */
export type ResultadoLogin = 'entrou' | 'precisa-2fa' | 'cancelado';

type AuthContextValue = {
  status: Status;
  /** Pode faltar se o app abriu sem internet: a sessão continua válida e os dados locais funcionam. */
  usuario: Usuario | null;
  /** Há um login esperando o código do app autenticador. */
  aguardandoCodigo: boolean;
  entrar: (email: string, senha: string) => Promise<ResultadoLogin>;
  entrarComGoogle: () => Promise<ResultadoLogin>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
  /** Segunda etapa do login. Retorna quantos códigos de recuperação sobraram, se um foi usado. */
  verificarCodigo: (codigo: string) => Promise<{ codigosRestantes: number | null }>;
  cancelarVerificacao: () => void;
  atualizarUsuario: () => Promise<void>;
  sair: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  const sair = useCallback(async () => {
    setAuthToken(null);
    setUsuario(null);
    setChallengeToken(null);
    setStatus('signedOut');
    await Promise.all([tokenStorage.remove(), sairDoGoogle()]);
  }, []);

  // Restaura a sessão salva ao abrir o app.
  useEffect(() => {
    let ativo = true;
    (async () => {
      const token = await tokenStorage.get().catch(() => null);
      if (!token) {
        if (ativo) setStatus('signedOut');
        return;
      }
      setAuthToken(token);
      try {
        const eu = await authService.eu();
        if (ativo) setUsuario(eu);
      } catch (error) {
        // Token recusado: precisa entrar de novo. Sem internet: segue logado com os dados locais.
        if (error instanceof ApiError && error.status === 401) {
          await tokenStorage.remove();
          setAuthToken(null);
          if (ativo) setStatus('signedOut');
          return;
        }
      }
      if (ativo) setStatus('signedIn');
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Token expirado durante o uso: desloga automaticamente.
  useEffect(() => {
    setUnauthorizedHandler(() => void sair());
    return () => setUnauthorizedHandler(null);
  }, [sair]);

  const concluir = useCallback(async ({ accessToken, user }: Autenticado) => {
    await tokenStorage.set(accessToken);
    setAuthToken(accessToken);
    setChallengeToken(null);
    setUsuario(user);
    setStatus('signedIn');
  }, []);

  const tratarLogin = useCallback(
    async (resposta: RespostaLogin): Promise<ResultadoLogin> => {
      if (resposta.status === 'two_factor_required') {
        setChallengeToken(resposta.challengeToken);
        return 'precisa-2fa';
      }
      await concluir(resposta);
      return 'entrou';
    },
    [concluir],
  );

  const entrar = useCallback(
    async (email: string, senha: string) =>
      tratarLogin(await authService.entrar({ email: email.trim(), password: senha })),
    [tratarLogin],
  );

  const entrarComGoogle = useCallback(async () => {
    const idToken = await pedirIdTokenDoGoogle();
    if (!idToken) return 'cancelado' as const;
    return tratarLogin(await authService.entrarComGoogle(idToken));
  }, [tratarLogin]);

  const cadastrar = useCallback(
    async (nome: string, email: string, senha: string) => {
      await concluir(await authService.cadastrar({ name: nome.trim(), email: email.trim(), password: senha }));
    },
    [concluir],
  );

  const verificarCodigo = useCallback(
    async (codigo: string) => {
      if (!challengeToken) throw new Error('Entre novamente para continuar.');
      const resposta = await authService.verificarDoisFatores({ challengeToken, code: codigo.trim() });
      await concluir(resposta);
      return { codigosRestantes: resposta.usedRecoveryCode ? resposta.recoveryCodesLeft : null };
    },
    [challengeToken, concluir],
  );

  const cancelarVerificacao = useCallback(() => setChallengeToken(null), []);

  const atualizarUsuario = useCallback(async () => {
    setUsuario(await authService.eu());
  }, []);

  const value = useMemo(
    () => ({
      status,
      usuario,
      aguardandoCodigo: challengeToken !== null,
      entrar,
      entrarComGoogle,
      cadastrar,
      verificarCodigo,
      cancelarVerificacao,
      atualizarUsuario,
      sair,
    }),
    [status, usuario, challengeToken, entrar, entrarComGoogle, cadastrar, verificarCodigo, cancelarVerificacao, atualizarUsuario, sair],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return context;
}
