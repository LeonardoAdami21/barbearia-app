import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { AuthLayout, ErroFormulario } from '@/components/auth-layout';
import { Btn, Field, st } from '@/components/ui';
import { avisar } from '@/lib/confirmar';
import { useAuth } from '@/providers/auth-provider';
import { mensagemDeErro } from '@/services/api';

/** Segunda etapa do login: código do app autenticador ou um código de recuperação. */
export default function VerificacaoScreen() {
  const { aguardandoCodigo, verificarCodigo, cancelarVerificacao } = useAuth();
  const [recuperacao, setRecuperacao] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string>();
  const [carregando, setCarregando] = useState(false);

  if (!aguardandoCodigo) {
    return (
      <AuthLayout titulo="Sessão expirada" subtitulo="Entre de novo com seu e-mail e senha." icone="time" topo={false}>
        <Btn label="Voltar para o login" onPress={() => router.replace('/entrar')} />
      </AuthLayout>
    );
  }

  async function enviar(valor = codigo) {
    const limpo = valor.trim();
    if (recuperacao ? limpo.length < 10 : !/^\d{6}$/.test(limpo)) {
      setErro(recuperacao ? 'Digite o código de recuperação completo.' : 'Digite os 6 números.');
      return;
    }
    setCarregando(true);
    setErro(undefined);
    try {
      const { codigosRestantes } = await verificarCodigo(limpo);
      if (codigosRestantes !== null) {
        avisar(
          'Código de recuperação usado',
          codigosRestantes > 0
            ? `Restam ${codigosRestantes}. Se perdeu o app autenticador, desative e ative de novo a verificação em Ajustes.`
            : 'Esse era o último. Desative e ative de novo a verificação em Ajustes para gerar novos códigos.',
        );
      }
    } catch (error) {
      setErro(mensagemDeErro(error, 'Código inválido ou expirado.'));
      setCodigo('');
      setCarregando(false);
    }
  }

  function digitar(valor: string) {
    if (recuperacao) return setCodigo(valor);
    const numeros = valor.replace(/\D/g, '').slice(0, 6);
    setCodigo(numeros);
    // Envia sozinho ao completar os 6 dígitos (inclusive quando colado ou preenchido pelo sistema).
    if (numeros.length === 6 && !carregando) void enviar(numeros);
  }

  function voltar() {
    cancelarVerificacao();
    router.back();
  }

  return (
    <AuthLayout
      titulo="Verificação em duas etapas"
      subtitulo={
        recuperacao
          ? 'Digite um dos códigos de recuperação que você guardou ao ativar a verificação.'
          : 'Abra o app autenticador (Google Authenticator, Authy…) e digite o código da Barbearia.'
      }
      icone="shield-checkmark"
      topo={false}>
      <Field
        key={recuperacao ? 'recuperacao' : 'totp'}
        label={recuperacao ? 'Código de recuperação' : 'Código de 6 dígitos'}
        value={codigo}
        onChangeText={digitar}
        placeholder={recuperacao ? 'abcde-fghij' : '000000'}
        keyboardType={recuperacao ? 'default' : 'number-pad'}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={recuperacao ? 'off' : 'one-time-code'}
        textContentType={recuperacao ? 'none' : 'oneTimeCode'}
        maxLength={recuperacao ? 16 : 6}
        autoFocus
        returnKeyType="go"
        onSubmitEditing={() => void enviar()}
        style={recuperacao ? undefined : { letterSpacing: 8, fontSize: 24, textAlign: 'center' }}
      />
      <ErroFormulario mensagem={erro} />
      <Btn label="Confirmar" icon="checkmark" loading={carregando} onPress={() => void enviar()} />
      <Btn
        label={recuperacao ? 'Usar o código do app autenticador' : 'Perdi o acesso ao app autenticador'}
        variant="ghost"
        onPress={() => {
          setRecuperacao(!recuperacao);
          setCodigo('');
          setErro(undefined);
        }}
      />
      <Btn label="Cancelar" variant="ghost" onPress={voltar} />
      <Text style={[st.dica, { textAlign: 'center' }]}>O código muda a cada 30 segundos.</Text>
    </AuthLayout>
  );
}
