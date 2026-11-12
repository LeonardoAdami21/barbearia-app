import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Card, FECHAR_TECLADO, Field, RIPPLE_ICONE, Section, Tag, st } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { useLayout } from '@/hooks/useLayout';
import { formatarPreco, servicosAtivos } from '@/lib/agenda';
import { avisar, confirmar } from '@/lib/confirmar';
import { horaParaMin, horaValida } from '@/lib/datas';
import { useAuth } from '@/providers/auth-provider';
import { mensagemDeErro } from '@/services/api';
import { useStore } from '@/store/store';

export default function AjustesScreen() {
  const { state, acoes } = useStore();
  const servicos = servicosAtivos(state);
  const [salvando, setSalvando] = useState<'config' | 'servico' | null>(null);
  const { usuario, sair } = useAuth();
  const insets = useSafeAreaInsets();
  const { compacto, fonteGrande } = useLayout();
  /** Em telas estreitas ou com fonte grande, os pares de campos ficam um embaixo do outro. */
  const empilhar = compacto || fonteGrande;
  const linha = empilhar ? styles.coluna : styles.linha;
  const metade = empilhar ? undefined : styles.metade;
  const cfg = state.config;

  const [nomeBarbearia, setNomeBarbearia] = useState(cfg.nomeBarbearia);
  const [abertura, setAbertura] = useState(cfg.abertura);
  const [fechamento, setFechamento] = useState(cfg.fechamento);
  const [intervalo, setIntervalo] = useState(String(cfg.intervaloMin));
  const [limite, setLimite] = useState(String(cfg.limiteFaltas));
  const [msgConfirmacao, setMsgConfirmacao] = useState(cfg.msgConfirmacao);
  const [msgLembrete, setMsgLembrete] = useState(cfg.msgLembrete);

  const [svNome, setSvNome] = useState('');
  const [svDuracao, setSvDuracao] = useState('30');
  const [svPreco, setSvPreco] = useState('');

  async function salvarConfig() {
    const int = parseInt(intervalo, 10);
    const lim = parseInt(limite, 10);
    if (!nomeBarbearia.trim()) return avisar('Nome', 'Informe o nome da barbearia.');
    if (!horaValida(abertura) || !horaValida(fechamento))
      return avisar('Horário', 'Use o formato HH:MM, por exemplo 09:00.');
    if (horaParaMin(fechamento) <= horaParaMin(abertura))
      return avisar('Horário', 'O fechamento precisa ser depois da abertura.');
    if (!(int >= 5 && int <= 120)) return avisar('Intervalo', 'Use um intervalo entre 5 e 120 minutos.');
    if (!(lim >= 1)) return avisar('Limite de faltas', 'Use um número a partir de 1.');
    setSalvando('config');
    try {
      await acoes.salvarConfig({
        nomeBarbearia: nomeBarbearia.trim(),
        abertura,
        fechamento,
        intervaloMin: int,
        limiteFaltas: lim,
        msgConfirmacao,
        msgLembrete,
      });
      avisar('Pronto', 'Ajustes salvos.');
    } catch (error) {
      avisar('Não foi possível salvar', mensagemDeErro(error));
    } finally {
      setSalvando(null);
    }
  }

  async function addServico() {
    const dur = parseInt(svDuracao, 10);
    const preco = parseFloat(svPreco.replace(',', '.'));
    if (!svNome.trim()) return avisar('Serviço', 'Informe o nome do serviço.');
    if (!(dur >= 5)) return avisar('Duração', 'Informe a duração em minutos.');
    if (!(preco >= 0)) return avisar('Preço', 'Informe o preço, por exemplo 45,00.');
    setSalvando('servico');
    try {
      await acoes.addServico({ nome: svNome.trim(), duracaoMin: dur, preco: Math.round(preco * 100) / 100 });
      setSvNome('');
      setSvPreco('');
    } catch (error) {
      avisar('Não foi possível adicionar', mensagemDeErro(error));
    } finally {
      setSalvando(null);
    }
  }

  function removerServico(id: string, nome: string) {
    if (servicos.length === 1) return avisar('Serviço', 'Mantenha pelo menos um serviço.');
    confirmar(
      'Remover serviço?',
      `"${nome}" não aparecerá mais para novos agendamentos. Os horários já marcados continuam.`,
      () => {
        acoes.removerServico(id).catch((error) => avisar('Não foi possível remover', mensagemDeErro(error)));
      },
      'Remover',
    );
  }

  return (
    <KeyboardAvoidingView style={[st.screen, { paddingTop: insets.top }]} behavior="padding">
      <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode={FECHAR_TECLADO}>
        <Text style={st.h1}>Ajustes</Text>

        <Section title="Conta">
          <Card style={styles.conta}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={C.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.body} numberOfLines={1}>
                {usuario?.name ?? 'Sem conexão'}
              </Text>
              <Text style={st.muted} numberOfLines={1}>
                {usuario?.email ?? 'Os dados da conta aparecem quando houver internet.'}
              </Text>
            </View>
          </Card>
          <Card onPress={() => router.push('/conta/seguranca')} style={styles.conta}>
            <Ionicons name="shield-checkmark-outline" size={22} color={C.muted} />
            <Text style={[st.body, { flex: 1 }]}>Verificação em duas etapas</Text>
            {usuario ? (
              <Tag
                label={usuario.twoFactorEnabled ? 'Ativa' : 'Desativada'}
                cor={usuario.twoFactorEnabled ? C.success : C.muted}
              />
            ) : null}
            <Ionicons name="chevron-forward" size={20} color={C.muted} />
          </Card>
          <Btn
            label="Sair da conta"
            icon="log-out-outline"
            variant="ghost"
            onPress={() => confirmar('Sair da conta?', 'Você vai precisar entrar de novo.', () => void sair(), 'Sair')}
          />
        </Section>

        <Section title="Barbearia">
          <Card style={{ gap: S.md }}>
            <Field label="Nome" value={nomeBarbearia} onChangeText={setNomeBarbearia} />
            <View style={linha}>
              <View style={metade}>
                <Field label="Abre às" value={abertura} onChangeText={setAbertura} placeholder="09:00" maxLength={5} />
              </View>
              <View style={metade}>
                <Field label="Fecha às" value={fechamento} onChangeText={setFechamento} placeholder="19:00" maxLength={5} />
              </View>
            </View>
            <View style={linha}>
              <View style={metade}>
                <Field label="Intervalo (min)" value={intervalo} onChangeText={setIntervalo} keyboardType="number-pad" />
              </View>
              <View style={metade}>
                <Field label="Alerta a partir de (faltas)" value={limite} onChangeText={setLimite} keyboardType="number-pad" />
              </View>
            </View>
          </Card>
        </Section>

        <Section title="Mensagens do WhatsApp">
          <Card style={{ gap: S.md }}>
            <Text style={st.dica}>
              Use {'{nome}'}, {'{data}'}, {'{hora}'}, {'{servico}'} e {'{barbearia}'} para preencher automaticamente.
            </Text>
            <Field label="Confirmação" value={msgConfirmacao} onChangeText={setMsgConfirmacao} multiline />
            <Field label="Lembrete" value={msgLembrete} onChangeText={setMsgLembrete} multiline />
          </Card>
        </Section>

        <Btn label="Salvar ajustes" icon="checkmark" loading={salvando === 'config'} onPress={salvarConfig} />

        <Section title="Serviços">
          {servicos.map((s) => (
            <Card key={s.id} style={styles.servico}>
              <View style={{ flex: 1 }}>
                <Text style={st.body}>{s.nome}</Text>
                <Text style={st.muted}>{s.duracaoMin} min · {formatarPreco(s.preco)}</Text>
              </View>
              <Pressable accessibilityLabel={`Remover ${s.nome}`} onPress={() => removerServico(s.id, s.nome)} hitSlop={12} android_ripple={RIPPLE_ICONE}>
                <Ionicons name="trash-outline" size={20} color={C.muted} />
              </Pressable>
            </Card>
          ))}
          <Card style={{ gap: S.md }}>
            <Field label="Novo serviço" value={svNome} onChangeText={setSvNome} placeholder="Ex.: Pigmentação" />
            <View style={linha}>
              <View style={metade}>
                <Field label="Duração (min)" value={svDuracao} onChangeText={setSvDuracao} keyboardType="number-pad" />
              </View>
              <View style={metade}>
                <Field label="Preço (R$)" value={svPreco} onChangeText={setSvPreco} keyboardType="decimal-pad" placeholder="45,00" />
              </View>
            </View>
            <Btn label="Adicionar serviço" icon="add" variant="secondary" loading={salvando === 'servico'} onPress={addServico} />
          </Card>
        </Section>

        <Text style={st.dica}>
          Clientes, agenda e ajustes ficam salvos na sua conta: entre em outro celular e está tudo lá.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'flex-end', gap: S.md },
  conta: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: S.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: R.pill,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coluna: { gap: S.md },
  metade: { flex: 1 },
  servico: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.md },
});
