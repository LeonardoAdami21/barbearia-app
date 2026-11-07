import { router } from 'expo-router';
import { useRef, useState } from 'react';

import { AuthLayout, ErroFormulario } from '@/components/auth-layout';
import { SecaoGoogle } from '@/components/google-button';
import { Btn, Field, PasswordField, type InputRef } from '@/components/ui';
import { emailValido } from '@/lib/validacao';
import { useAuth, type ResultadoLogin } from '@/providers/auth-provider';
import { mensagemDeErro } from '@/services/api';

export default function EntrarScreen() {
  const { entrar } = useAuth();
  const senhaRef = useRef<InputRef>(null);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<{ email?: string; senha?: string; form?: string }>({});
  const [carregando, setCarregando] = useState(false);

  // Ao entrar, as rotas protegidas liberam e o app vai para a agenda sozinho.
  function seguir(resultado: ResultadoLogin) {
    if (resultado === 'precisa-2fa') router.push('/verificacao');
  }

  async function enviar() {
    const novos: typeof erros = {};
    if (!emailValido(email)) novos.email = 'Informe um e-mail válido.';
    if (!senha) novos.senha = 'Informe sua senha.';
    setErros(novos);
    if (Object.keys(novos).length) return;

    setCarregando(true);
    try {
      seguir(await entrar(email, senha));
    } catch (error) {
      setErros({ form: mensagemDeErro(error) });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthLayout titulo="Barbearia" subtitulo="Entre para ver a agenda e os clientes.">
      <Field
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        error={erros.email}
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => senhaRef.current?.focus()}
      />
      <PasswordField
        ref={senhaRef}
        label="Senha"
        value={senha}
        onChangeText={setSenha}
        error={erros.senha}
        placeholder="Sua senha"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={enviar}
      />
      <ErroFormulario mensagem={erros.form} />
      <Btn label="Entrar" icon="log-in-outline" loading={carregando} onPress={enviar} />

      <SecaoGoogle onResultado={seguir} onErro={(form) => setErros({ form })} disabled={carregando} />

      <Btn label="Não tem conta? Criar conta" variant="ghost" onPress={() => router.push('/cadastro')} />
    </AuthLayout>
  );
}
