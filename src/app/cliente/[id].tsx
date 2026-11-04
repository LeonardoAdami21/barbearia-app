import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Aviso, Btn, Card, Empty, Field, Section, StatusTag, st } from '@/components/ui';
import { C, R, S, T } from '@/constants/theme';
import { buscarServico, estatisticasCliente } from '@/lib/agenda';
import { avisar, confirmar } from '@/lib/confirmar';
import { rotuloDia } from '@/lib/datas';
import { abrirWhatsApp, formatarTelefone, normalizarTelefone, telefoneValido } from '@/lib/whatsapp';
import { useStore } from '@/store/store';

export default function DetalheCliente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useStore();
  const cliente = state.clientes.find((c) => c.id === id);
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(cliente?.nome ?? '');
  const [telefone, setTelefone] = useState(cliente?.telefone ?? '');
  const [obs, setObs] = useState(cliente?.obs ?? '');

  if (!cliente) return <Empty icon="person-outline" title="Cliente não encontrado" />;

  const stats = estatisticasCliente(state, cliente.id);
  const historico = state.agendamentos
    .filter((a) => a.clienteId === cliente.id)
    .sort((a, b) => `${b.data}${b.hora}`.localeCompare(`${a.data}${a.hora}`));

  function salvar() {
    if (nome.trim().length < 2) return avisar('Nome', 'Informe o nome do cliente.');
    if (!telefoneValido(telefone)) return avisar('Telefone inválido', 'Use DDD + número.');
    const outro = state.clientes.find(
      (c) => c.id !== cliente!.id && normalizarTelefone(c.telefone) === normalizarTelefone(telefone),
    );
    if (outro) return avisar('Telefone já cadastrado', `Este número é de ${outro.nome}.`);
    dispatch({
      type: 'updateCliente',
      id: cliente!.id,
      patch: { nome: nome.trim(), telefone: telefone.replace(/\D/g, ''), obs: obs.trim() || undefined },
    });
    setEditando(false);
  }

  return (
    <ScrollView style={st.screen} contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
      {editando ? (
        <Card style={{ gap: S.md }}>
          <Field label="Nome" value={nome} onChangeText={setNome} />
          <Field label="WhatsApp" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
          <Field label="Observações" value={obs} onChangeText={setObs} multiline />
          <Btn label="Salvar" icon="checkmark" onPress={salvar} />
          <Btn label="Cancelar" variant="ghost" onPress={() => setEditando(false)} />
        </Card>
      ) : (
        <Card style={{ gap: S.sm }}>
          <Text style={st.h1}>{cliente.nome}</Text>
          <Text style={st.muted}>{formatarTelefone(cliente.telefone)}</Text>
          {cliente.obs ? <Text style={st.body}>{cliente.obs}</Text> : null}
          <Btn label="Editar dados" icon="create-outline" variant="ghost" onPress={() => setEditando(true)} style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} />
        </Card>
      )}

      <View style={styles.stats}>
        <Numero valor={String(stats.visitas)} rotulo="visitas" />
        <Numero valor={String(stats.faltas)} rotulo="faltas" cor={stats.faltas ? C.danger : undefined} />
        <Numero valor={stats.presenca === null ? '—' : `${stats.presenca}%`} rotulo="presença" />
      </View>

      {stats.alerta && (
        <Aviso cor={C.danger}>
          Passou do limite de {state.config.limiteFaltas} faltas. Para os próximos horários, peça um sinal via Pix ou confirme por ligação.
        </Aviso>
      )}

      <View style={{ gap: S.sm }}>
        <Btn
          label="Agendar horário"
          icon="calendar"
          onPress={() => router.push({ pathname: '/agendamento/novo', params: { clienteId: cliente.id } })}
        />
        <Btn label="Abrir conversa no WhatsApp" icon="logo-whatsapp" variant="whatsapp" onPress={() => abrirWhatsApp(cliente.telefone).catch(() => {})} />
      </View>

      <Section title="Histórico">
        {historico.length === 0 ? (
          <Text style={st.muted}>Nenhum agendamento ainda.</Text>
        ) : (
          historico.map((a) => (
            <Card key={a.id} onPress={() => router.push(`/agendamento/${a.id}`)} style={styles.hist}>
              <View style={{ flex: 1 }}>
                <Text style={st.body}>{rotuloDia(a.data)} · {a.hora}</Text>
                <Text style={st.muted}>{buscarServico(state, a.servicoId)?.nome ?? 'Serviço'}</Text>
              </View>
              <StatusTag status={a.status} />
            </Card>
          ))
        )}
      </Section>

      <Btn
        label="Excluir cliente"
        icon="trash-outline"
        variant="ghost"
        onPress={() =>
          confirmar('Excluir cliente?', 'O histórico de agendamentos dele também será apagado.', () => {
            dispatch({ type: 'removeCliente', id: cliente.id });
            router.back();
          }, 'Excluir')
        }
      />
    </ScrollView>
  );
}

function Numero({ valor, rotulo, cor }: { valor: string; rotulo: string; cor?: string }) {
  return (
    <View style={styles.num}>
      <Text style={[styles.numValor, cor ? { color: cor } : null]}>{valor}</Text>
      <Text style={st.muted}>{rotulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: S.sm },
  num: { flex: 1, backgroundColor: C.surface, borderRadius: R.md, padding: S.md, alignItems: 'center' },
  numValor: { ...T.stat, color: C.text },
  hist: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.md },
});
