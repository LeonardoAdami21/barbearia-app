import { router } from 'expo-router';
import { useRef, useState } from 'react';

import { AuthLayout, ErroFormulario } from '@/components/auth-layout';
import { SecaoGoogle } from '@/components/google-button';
import { Btn, Field, PasswordField, type InputRef } from '@/components/ui';
import { emailValido, erroDeSenha } from '@/lib/validacao';
import { useAuth, type ResultadoLogin } from '@/providers/auth-provider';
import { mensagemDeErro } from '@/services/api';

type Erros = { nome?: string; email?: string; senha?: string; confirmacao?: string; form?: string };

export default function CadastroScreen() {
  const { cadastrar } = useAuth();
  const emailRef = useRef<InputRef>(null);
  const senhaRef = useRef<InputRef>(null);
  const confirmacaoRef = useRef<InputRef>(null);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erros, setErros] = useState<Erros>({});
  const [carregando, setCarregando] = useState(false);

  function seguir(resultado: ResultadoLogin) {
    if (resultado === 'precisa-2fa') router.push('/verificacao');
  }

  async function enviar() {
    const novos: Erros = {};
    if (nome.trim().length < 2) novos.nome = 'Informe seu nome.';
    if (!emailValido(email)) novos.email = 'Informe um e-mail válido.';
    novos.senha = erroDeSenha(senha);
    if (confirmacao !== senha) novos.confirmacao = 'As senhas não são iguais.';
    if (!novos.senha) delete novos.senha;
    setErros(novos);
    if (Object.keys(novos).length) return;

    setCarregando(true);
    try {
      await cadastrar(nome, email, senha);
    } catch (error) {
      setErros({ form: mensagemDeErro(error) });
      setCarregando(false);
    }
  }

  return (
    <AuthLayout titulo="Criar conta" subtitulo="Leva menos de um minuto." icone="person-add" topo={false}>
      <Field
        label="Nome"
        value={nome}
        onChangeText={setNome}
        error={erros.nome}
        placeholder="Como quer ser chamado"
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <Field
        ref={emailRef}
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
        placeholder="Pelo menos 8 caracteres"
        autoComplete="new-password"
        textContentType="newPassword"
        passwordRules="minlength: 8;"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => confirmacaoRef.current?.focus()}
      />
      <PasswordField
        ref={confirmacaoRef}
        label="Confirmar senha"
        value={confirmacao}
        onChangeText={setConfirmacao}
        error={erros.confirmacao}
        placeholder="Digite a senha de novo"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={enviar}
      />
      <ErroFormulario mensagem={erros.form} />
      <Btn label="Criar conta" icon="checkmark" loading={carregando} onPress={enviar} />

      <SecaoGoogle onResultado={seguir} onErro={(form) => setErros({ form })} disabled={carregando} />

      <Btn label="Já tenho conta" variant="ghost" onPress={() => router.back()} />
    </AuthLayout>
  );
}
