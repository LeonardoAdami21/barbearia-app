import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Card, FECHAR_TECLADO, Field, RIPPLE_ICONE, Section, st } from '@/components/ui';
import { C, S } from '@/constants/theme';
import { useLayout } from '@/hooks/useLayout';
import { formatarPreco } from '@/lib/agenda';
import { avisar, confirmar } from '@/lib/confirmar';
import { horaParaMin, horaValida } from '@/lib/datas';
import { estadoExemplo, estadoVazio } from '@/store/seed';
import { novoId, useStore } from '@/store/store';

export default function AjustesScreen() {
  const { state, dispatch } = useStore();
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

  function salvarConfig() {
    const int = parseInt(intervalo, 10);
    const lim = parseInt(limite, 10);
    if (!nomeBarbearia.trim()) return avisar('Nome', 'Informe o nome da barbearia.');
    if (!horaValida(abertura) || !horaValida(fechamento))
      return avisar('Horário', 'Use o formato HH:MM, por exemplo 09:00.');
    if (horaParaMin(fechamento) <= horaParaMin(abertura))
      return avisar('Horário', 'O fechamento precisa ser depois da abertura.');
    if (!(int >= 5 && int <= 120)) return avisar('Intervalo', 'Use um intervalo entre 5 e 120 minutos.');
    if (!(lim >= 1)) return avisar('Limite de faltas', 'Use um número a partir de 1.');
    dispatch({
      type: 'setConfig',
      patch: {
        nomeBarbearia: nomeBarbearia.trim(),
        abertura,
        fechamento,
        intervaloMin: int,
        limiteFaltas: lim,
        msgConfirmacao,
        msgLembrete,
      },
    });
    avisar('Pronto', 'Ajustes salvos.');
  }

  function addServico() {
    const dur = parseInt(svDuracao, 10);
    const preco = parseFloat(svPreco.replace(',', '.'));
    if (!svNome.trim()) return avisar('Serviço', 'Informe o nome do serviço.');
    if (!(dur >= 5)) return avisar('Duração', 'Informe a duração em minutos.');
    if (!(preco >= 0)) return avisar('Preço', 'Informe o preço, por exemplo 45,00.');
    dispatch({ type: 'addServico', servico: { id: novoId(), nome: svNome.trim(), duracaoMin: dur, preco } });
    setSvNome('');
    setSvPreco('');
  }

  function removerServico(id: string, nome: string) {
    if (state.servicos.length === 1) return avisar('Serviço', 'Mantenha pelo menos um serviço.');
    confirmar('Remover serviço?', `"${nome}" não aparecerá mais para novos agendamentos.`, () =>
      dispatch({ type: 'removeServico', id }), 'Remover');
  }

  function recarregar(dados: 'vazio' | 'exemplo') {
    const texto = dados === 'vazio' ? 'Clientes e agendamentos serão apagados deste aparelho.' : 'Os dados atuais serão trocados pelos dados de exemplo.';
    confirmar('Tem certeza?', texto, () => {
      const novo = dados === 'vazio' ? estadoVazio() : estadoExemplo();
      dispatch({ type: 'carregar', state: { ...novo, config: state.config, servicos: dados === 'vazio' ? state.servicos : novo.servicos } });
    }, 'Continuar');
  }

  return (
    <KeyboardAvoidingView style={[st.screen, { paddingTop: insets.top }]} behavior="padding">
      <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode={FECHAR_TECLADO}>
        <Text style={st.h1}>Ajustes</Text>

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

        <Btn label="Salvar ajustes" icon="checkmark" onPress={salvarConfig} />

        <Section title="Serviços">
          {state.servicos.map((s) => (
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
            <Btn label="Adicionar serviço" icon="add" variant="secondary" onPress={addServico} />
          </Card>
        </Section>

        <Section title="Dados">
          <Text style={st.dica}>
            Por enquanto os dados ficam salvos só neste aparelho. Com o backend, eles passam a ficar na nuvem.
          </Text>
          <Btn label="Carregar dados de exemplo" icon="sparkles-outline" variant="secondary" onPress={() => recarregar('exemplo')} />
          <Btn label="Apagar clientes e agendamentos" icon="trash-outline" variant="danger" onPress={() => recarregar('vazio')} />
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'flex-end', gap: S.md },
  coluna: { gap: S.md },
  metade: { flex: 1 },
  servico: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.md },
});
