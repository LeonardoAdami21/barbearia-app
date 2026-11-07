import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Aviso, Btn, Card, FECHAR_TECLADO, Field, Section, Tag, st } from '@/components/ui';
import { C, R, S, T } from '@/constants/theme';
import { avisar } from '@/lib/confirmar';
import { useAuth } from '@/providers/auth-provider';
import { mensagemDeErro } from '@/services/api';
import { authService, type ConfiguracaoDoisFatores } from '@/services/auth';

/**
 * Ativar e desativar a verificação em duas etapas.
 * Fluxo de ativação: gerar segredo → adicionar no app autenticador → confirmar 1º código → guardar códigos de recuperação.
 */
export default function SegurancaScreen() {
  const { usuario, atualizarUsuario } = useAuth();
  const [config, setConfig] = useState<ConfiguracaoDoisFatores | null>(null);
  const [codigosRecuperacao, setCodigosRecuperacao] = useState<string[] | null>(null);
  const [desativando, setDesativando] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string>();
  const [carregando, setCarregando] = useState(false);

  async function executar(acao: () => Promise<void>) {
    setCarregando(true);
    setErro(undefined);
    try {
      await acao();
    } catch (error) {
      setErro(mensagemDeErro(error, 'Código inválido ou expirado.'));
    } finally {
      setCarregando(false);
    }
  }

  const iniciar = () => executar(async () => setConfig(await authService.iniciarDoisFatores()));

  const ativar = () => {
    if (!/^\d{6}$/.test(codigo.trim())) return setErro('Digite os 6 números do app autenticador.');
    return executar(async () => {
      const { recoveryCodes } = await authService.ativarDoisFatores(codigo.trim());
      setCodigosRecuperacao(recoveryCodes);
      setConfig(null);
      setCodigo('');
      await atualizarUsuario();
    });
  };

  const desativar = () =>
    executar(async () => {
      await authService.desativarDoisFatores(codigo.trim());
      setDesativando(false);
      setCodigo('');
      await atualizarUsuario();
      avisar('Verificação desativada', 'Agora basta a senha (ou o Google) para entrar.');
    });

  async function abrirNoAutenticador() {
    if (!config) return;
    try {
      await Linking.openURL(config.otpauthUrl);
    } catch {
      avisar('Nenhum app autenticador encontrado', 'Instale o Google Authenticator ou o Authy, ou copie a chave manualmente.');
    }
  }

  async function copiar(texto: string, mensagem: string) {
    await Clipboard.setStringAsync(texto);
    avisar('Copiado', mensagem);
  }

  if (!usuario) {
    return (
      <View style={[st.screen, styles.centro]}>
        <Text style={st.muted}>Conecte-se à internet para ver as opções de segurança.</Text>
        <Btn label="Tentar de novo" variant="secondary" onPress={() => void atualizarUsuario().catch(() => {})} />
      </View>
    );
  }

  // Passo final: mostrar os códigos de recuperação uma única vez.
  if (codigosRecuperacao) {
    return (
      <ScrollView style={st.screen} contentContainerStyle={st.scroll}>
        <Aviso icon="checkmark-circle" cor={C.success}>
          Verificação em duas etapas ativada. A partir de agora o login pede o código do app autenticador.
        </Aviso>
        <Section title="Códigos de recuperação">
          <Text style={st.body}>
            Guarde estes códigos num lugar seguro (gerenciador de senhas, papel). Cada um serve uma vez para entrar se
            você perder o celular. Eles não serão mostrados de novo.
          </Text>
          <Card style={styles.codigos}>
            {codigosRecuperacao.map((c) => (
              <Text key={c} style={styles.codigo} selectable>
                {c}
              </Text>
            ))}
          </Card>
          <Btn
            label="Copiar códigos"
            icon="copy-outline"
            variant="secondary"
            onPress={() => copiar(codigosRecuperacao.join('\n'), 'Cole num lugar seguro.')}
          />
          <Btn label="Já guardei" icon="checkmark" onPress={() => setCodigosRecuperacao(null)} />
        </Section>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={st.screen} behavior="padding">
      <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode={FECHAR_TECLADO}>
        <Card style={{ gap: S.sm }}>
          <View style={styles.linha}>
            <Text style={[st.h2, { flex: 1 }]}>Verificação em duas etapas</Text>
            <Tag
              label={usuario.twoFactorEnabled ? 'Ativa' : 'Desativada'}
              cor={usuario.twoFactorEnabled ? C.success : C.muted}
              icon={usuario.twoFactorEnabled ? 'shield-checkmark' : 'shield-outline'}
            />
          </View>
          <Text style={st.muted}>
            Além da senha, o login pede um código de 6 dígitos gerado no seu celular por um app autenticador. Mesmo que
            alguém descubra sua senha, não consegue entrar.
          </Text>
          {usuario.twoFactorEnabled && usuario.recoveryCodesLeft !== null ? (
            <Text style={st.dica}>Códigos de recuperação restantes: {usuario.recoveryCodesLeft}</Text>
          ) : null}
        </Card>

        {usuario.twoFactorEnabled ? (
          desativando ? (
            <Section title="Desativar">
              <Field
                label="Código do app autenticador ou de recuperação"
                value={codigo}
                onChangeText={setCodigo}
                placeholder="000000"
                autoCapitalize="none"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                autoFocus
                error={erro}
              />
              <Btn label="Desativar verificação" icon="shield-outline" variant="danger" loading={carregando} onPress={desativar} />
              <Btn label="Cancelar" variant="ghost" onPress={() => setDesativando(false)} />
            </Section>
          ) : (
            <Btn label="Desativar verificação" variant="danger" icon="shield-outline" onPress={() => setDesativando(true)} />
          )
        ) : config ? (
          <>
            <Section title="1. Adicione no app autenticador">
              <Btn label="Abrir no app autenticador" icon="open-outline" onPress={abrirNoAutenticador} />
              <Text style={st.dica}>
                Se o app autenticador está em outro aparelho, escaneie o QR code com ele:
              </Text>
              <View style={styles.qr} accessibilityLabel="QR code para o app autenticador">
                <QRCode value={config.otpauthUrl} size={200} backgroundColor="#FFFFFF" color="#000000" />
              </View>
              <Text style={st.dica}>Ou digite esta chave no app:</Text>
              <Card onPress={() => copiar(config.secret, 'Cole a chave no app autenticador.')} style={styles.chave}>
                <Text style={styles.chaveTexto} selectable>
                  {config.secret.replace(/(.{4})/g, '$1 ').trim()}
                </Text>
                <Text style={st.dica}>Toque para copiar</Text>
              </Card>
            </Section>
            <Section title="2. Confirme o código">
              <Field
                label="Código de 6 dígitos"
                value={codigo}
                onChangeText={(v) => setCodigo(v.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={6}
                error={erro}
                returnKeyType="done"
                onSubmitEditing={ativar}
                style={{ letterSpacing: 8, fontSize: 22, textAlign: 'center' }}
              />
              <Btn label="Ativar verificação" icon="shield-checkmark" loading={carregando} onPress={ativar} />
              <Btn label="Cancelar" variant="ghost" onPress={() => setConfig(null)} />
            </Section>
          </>
        ) : (
          <>
            {erro ? <Aviso cor={C.danger}>{erro}</Aviso> : null}
            <Btn label="Ativar verificação" icon="shield-checkmark" loading={carregando} onPress={iniciar} />
            <Text style={st.dica}>
              Você vai precisar de um app autenticador, como Google Authenticator, Microsoft Authenticator ou Authy.
            </Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center', gap: S.md, padding: S.lg },
  linha: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  qr: { alignSelf: 'center', padding: S.md, backgroundColor: '#FFFFFF', borderRadius: R.md },
  chave: { alignItems: 'center', gap: S.xs },
  chaveTexto: { ...T.h2, color: C.text, fontVariant: ['tabular-nums'], letterSpacing: 1, textAlign: 'center' },
  codigos: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, justifyContent: 'center' },
  codigo: { ...T.h2, color: C.text, width: '45%', textAlign: 'center', fontVariant: ['tabular-nums'] },
});
