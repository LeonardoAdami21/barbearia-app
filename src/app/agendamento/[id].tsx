import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Aviso, Btn, Card, Empty, Section, StatusTag, st } from '@/components/ui';
import { C, S, T } from '@/constants/theme';
import {
  buscarCliente,
  buscarServico,
  estatisticasCliente,
  formatarPreco,
  plural,
  precisaMarcarPresenca,
} from '@/lib/agenda';
import { confirmar } from '@/lib/confirmar';
import { dataParaMensagem, rotuloDia } from '@/lib/datas';
import { abrirWhatsApp, formatarTelefone, preencherModelo } from '@/lib/whatsapp';
import { useStore } from '@/store/store';
import type { Agendamento } from '@/types';

export default function DetalheAgendamento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useStore();
  const ag = state.agendamentos.find((a) => a.id === id);

  if (!ag) return <Empty icon="calendar-outline" title="Agendamento não encontrado" />;

  const cliente = buscarCliente(state, ag.clienteId);
  const servico = buscarServico(state, ag.servicoId);
  const stats = estatisticasCliente(state, ag.clienteId);
  const aberto = ag.status === 'agendado' || ag.status === 'confirmado';
  const pendente = precisaMarcarPresenca(ag);

  const atualizar = (patch: Partial<Agendamento>) => dispatch({ type: 'updateAgendamento', id: ag.id, patch });

  function enviar(tipo: 'confirmacao' | 'lembrete') {
    if (!cliente) return;
    const modelo = tipo === 'confirmacao' ? state.config.msgConfirmacao : state.config.msgLembrete;
    const msg = preencherModelo(modelo, {
      nome: cliente.nome.split(' ')[0],
      data: dataParaMensagem(ag!.data),
      hora: ag!.hora,
      servico: servico?.nome ?? '',
      barbearia: state.config.nomeBarbearia,
    });
    abrirWhatsApp(cliente.telefone, msg).catch(() => {});
    atualizar(tipo === 'confirmacao' ? { confirmacaoEnviada: true } : { lembreteEnviado: true });
  }

  return (
    <ScrollView style={st.screen} contentContainerStyle={st.scroll}>
      <Card style={{ gap: S.md }}>
        <View style={styles.topo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hora}>{ag.hora}</Text>
            <Text style={st.muted}>{rotuloDia(ag.data)}</Text>
          </View>
          <StatusTag status={ag.status} />
        </View>
        <View style={styles.linha}>
          <Ionicons name="cut-outline" size={18} color={C.muted} />
          <Text style={st.body}>
            {servico?.nome ?? 'Serviço'} · {servico?.duracaoMin ?? '?'} min · {formatarPreco(servico?.preco ?? 0)}
          </Text>
        </View>
        {cliente && (
          <Card onPress={() => router.push(`/cliente/${cliente.id}`)} style={styles.cliente}>
            <View style={{ flex: 1 }}>
              <Text style={st.h2}>{cliente.nome}</Text>
              <Text style={st.muted}>
                {formatarTelefone(cliente.telefone)} · {plural(stats.visitas, 'visita', 'visitas')} ·{' '}
                {plural(stats.faltas, 'falta', 'faltas')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.muted} />
          </Card>
        )}
        {ag.obs ? <Text style={st.muted}>Obs.: {ag.obs}</Text> : null}
      </Card>

      {stats.alerta && aberto && (
        <Aviso cor={C.danger}>
          Este cliente já faltou {stats.faltas} vezes. Vale pedir um sinal via Pix ou confirmar por ligação.
        </Aviso>
      )}

      {pendente && (
        <Aviso icon="time-outline">O horário já passou. Marque se o cliente compareceu ou faltou.</Aviso>
      )}

      {aberto && cliente && (
        <Section title="WhatsApp">
          <Btn
            label={ag.confirmacaoEnviada ? 'Reenviar confirmação' : 'Enviar confirmação'}
            icon="logo-whatsapp"
            variant="whatsapp"
            onPress={() => enviar('confirmacao')}
          />
          <Btn
            label={ag.lembreteEnviado ? 'Reenviar lembrete' : 'Enviar lembrete'}
            icon="notifications-outline"
            variant="secondary"
            onPress={() => enviar('lembrete')}
          />
          <Text style={st.dica}>
            {ag.confirmacaoEnviada ? '✓ Confirmação enviada. ' : ''}
            {ag.lembreteEnviado ? '✓ Lembrete enviado. ' : ''}
            O WhatsApp abre com a mensagem pronta; é só tocar em enviar.
          </Text>
        </Section>
      )}

      <Section title="Situação">
        {ag.status === 'agendado' && (
          <Btn label="Cliente confirmou" icon="checkmark-done" variant="success" onPress={() => atualizar({ status: 'confirmado' })} />
        )}
        {aberto && (
          <>
            <Btn label="Compareceu" icon="checkmark-circle" onPress={() => atualizar({ status: 'concluido' })} />
            <Btn
              label="Faltou"
              icon="close-circle"
              variant="danger"
              onPress={() =>
                confirmar('Registrar falta?', `${cliente?.nome ?? 'O cliente'} não compareceu.`, () =>
                  atualizar({ status: 'faltou' }), 'Registrar falta')
              }
            />
            <Btn
              label="Cancelar horário"
              icon="ban"
              variant="secondary"
              onPress={() =>
                confirmar('Cancelar horário?', 'O horário fica livre para outro cliente.', () =>
                  atualizar({ status: 'cancelado' }), 'Cancelar horário')
              }
            />
          </>
        )}
        {!aberto && (
          <Btn label="Reabrir agendamento" icon="refresh" variant="secondary" onPress={() => atualizar({ status: 'agendado' })} />
        )}
        <Btn
          label="Excluir agendamento"
          icon="trash-outline"
          variant="ghost"
          onPress={() =>
            confirmar('Excluir agendamento?', 'Isso não pode ser desfeito.', () => {
              dispatch({ type: 'removeAgendamento', id: ag.id });
              router.back();
            }, 'Excluir')
          }
        />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'flex-start' },
  hora: { ...T.display, color: C.accent },
  linha: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  cliente: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface2 },
});
