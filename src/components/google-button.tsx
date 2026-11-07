import { useState } from 'react';

import { Divisor } from '@/components/auth-layout';
import { Btn } from '@/components/ui';
import { useAuth, type ResultadoLogin } from '@/providers/auth-provider';
import { mensagemDeErro } from '@/services/api';
import { GoogleIndisponivelError, googleDisponivel } from '@/services/google';

/**
 * Botão "Continuar com Google". Não aparece no Expo Go nem sem os client IDs configurados.
 * Avisa a tela pelo `onResultado` (para ir à verificação em duas etapas) ou pelo `onErro`.
 */
export function GoogleButton({
  onResultado,
  onErro,
  disabled,
}: {
  onResultado: (resultado: ResultadoLogin) => void;
  onErro: (mensagem: string) => void;
  disabled?: boolean;
}) {
  const { entrarComGoogle } = useAuth();
  const [carregando, setCarregando] = useState(false);

  if (!googleDisponivel) return null;

  async function entrar() {
    setCarregando(true);
    try {
      onResultado(await entrarComGoogle());
    } catch (error) {
      onErro(
        error instanceof GoogleIndisponivelError
          ? error.message
          : mensagemDeErro(error, 'Não foi possível entrar com o Google.'),
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Btn
      label="Continuar com Google"
      icon="logo-google"
      variant="google"
      loading={carregando}
      disabled={disabled}
      onPress={entrar}
    />
  );
}

/** Divisor "ou" + botão do Google. Some por inteiro quando o login com Google não está disponível. */
export function SecaoGoogle(props: Parameters<typeof GoogleButton>[0]) {
  if (!googleDisponivel) return null;
  return (
    <>
      <Divisor />
      <GoogleButton {...props} />
    </>
  );
}
