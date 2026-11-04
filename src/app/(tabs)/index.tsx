import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Empty, StatusTag, Tag, st } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import {
  buscarCliente,
  buscarServico,
  estatisticasCliente,
  formatarPreco,
  precisaMarcarPresenca,
} from '@/lib/agenda';
import { addDias, diaDoMes, diaSemanaCurto, hoje, mesCurto, rotuloDia } from '@/lib/datas';
import { useStore } from '@/store/store';

export default function AgendaScreen() {
  const { state } = useStore();
  const insets = useSafeAreaInsets();
  const [dia, setDia] = useState(hoje());
  const dias = Array.from({ length: 21 }, (_, i) => addDias(hoje(), i - 3));

  const doDia = state.agendamentos
    .filter((a) => a.data === dia)
    .sort((a, b) => a.hora.localeCompare(b.hora));
  const validos = doDia.filter((a) => a.status !== 'cancelado' && a.status !== 'faltou');
  const confirmados = doDia.filter((a) => a.status === 'confirmado').length;
  const previsto = validos.reduce((soma, a) => soma + (buscarServico(state, a.servicoId)?.preco ?? 0), 0);
  const contagem = (iso: string) =>
    state.agendamentos.filter((a) => a.data === iso && a.status !== 'cancelado').length;

  return (
    <View style={[st.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={st.muted}>{state.config.nomeBarbearia}</Text>
          <Text style={st.h1}>{rotuloDia(dia)}</Text>
        </View>
        {dia !== hoje() && (
          <Pressable onPress={() => setDia(hoje())} style={styles.hojeBtn}>
            <Text style={styles.hojeTxt}>Hoje</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dias}
        contentOffset={{ x: 3 * 64 - S.lg, y: 0 }}>
        {dias.map((d) => {
          const sel = d === dia;
          const n = contagem(d);
          return (
            <Pressable key={d} onPress={() => setDia(d)} style={[styles.dia, sel && styles.diaSel]}>
              <Text style={[styles.diaSemana, sel && styles.diaTxtSel]}>{diaSemanaCurto(d)}</Text>
              <Text style={[styles.diaNum, sel && styles.diaTxtSel]}>{diaDoMes(d)}</Text>
              <Text style={[styles.diaMes, sel && styles.diaTxtSel]}>
                {n > 0 ? `${n} hr` : mesCurto(d)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={[st.scroll, { gap: S.md }]}>
        <View style={styles.resumo}>
          <Resumo valor={String(validos.length)} rotulo="horários" />
          <Resumo valor={String(confirmados)} rotulo="confirmados" />
          <Resumo valor={`R$ ${Math.round(previsto)}`} rotulo="previsto" />
        </View>

        {doDia.length === 0 ? (
          <Empty
            icon="cut-outline"
            title="Nenhum horário marcado"
            subtitle="Toque no + para agendar um cliente neste dia."
          />
        ) : (
          doDia.map((a) => {
            const cliente = buscarCliente(state, a.clienteId);
            const servico = buscarServico(state, a.servicoId);
            const stats = estatisticasCliente(state, a.clienteId);
            const pendente = precisaMarcarPresenca(a);
            const apagado = a.status === 'cancelado';
            return (
              <Card
                key={a.id}
                onPress={() => router.push(`/agendamento/${a.id}`)}
                style={[styles.item, apagado && { opacity: 0.5 }]}>
                <Text style={styles.hora}>{a.hora}</Text>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={st.h2} numberOfLines={1}>
                    {cliente?.nome ?? 'Cliente removido'}
                  </Text>
                  <Text style={st.muted}>
                    {servico?.nome ?? 'Serviço'} · {formatarPreco(servico?.preco ?? 0)}
                  </Text>
                  <View style={styles.tags}>
                    <StatusTag status={a.status} />
                    {pendente && <Tag label="Marcar presença" cor={C.warning} icon="time-outline" />}
                    {stats.alerta && !apagado && (
                      <Tag label={`${stats.faltas} faltas`} cor={C.danger} icon="alert-circle" />
                    )}
                    {a.confirmacaoEnviada && a.status === 'agendado' && (
                      <Tag label="Aguardando resposta" cor={C.whatsapp} icon="logo-whatsapp" />
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.muted} />
              </Card>
            );
          })
        )}
      </ScrollView>

      <Pressable
        accessibilityLabel="Novo agendamento"
        onPress={() => router.push({ pathname: '/agendamento/novo', params: { data: dia } })}
        style={({ pressed }) => [styles.fab, pressed && st.pressed]}>
        <Ionicons name="add" size={30} color={C.accentText} />
      </Pressable>
    </View>
  );
}

function Resumo({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <View style={styles.resumoItem}>
      <Text style={styles.resumoValor} numberOfLines={1}>
        {valor}
      </Text>
      <Text style={st.muted}>{rotulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: S.lg,
    paddingTop: S.md,
    paddingBottom: S.sm,
  },
  hojeBtn: {
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: R.pill,
    paddingHorizontal: S.md,
    paddingVertical: 6,
    marginBottom: 4,
  },
  hojeTxt: { color: C.accent, fontWeight: '700' },
  dias: { paddingHorizontal: S.lg, paddingVertical: S.sm, gap: S.sm },
  dia: {
    width: 56,
    paddingVertical: S.sm,
    borderRadius: R.md,
    backgroundColor: C.surface,
    alignItems: 'center',
    gap: 2,
  },
  diaSel: { backgroundColor: C.accent },
  diaSemana: { color: C.muted, fontSize: 12, fontWeight: '600' },
  diaNum: { color: C.text, fontSize: 20, fontWeight: '800' },
  diaMes: { color: C.muted, fontSize: 11 },
  diaTxtSel: { color: C.accentText },
  resumo: { flexDirection: 'row', gap: S.sm },
  resumoItem: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: S.md,
    gap: 2,
  },
  resumoValor: { color: C.text, fontSize: 20, fontWeight: '800' },
  item: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  hora: { color: C.accent, fontSize: 20, fontWeight: '800', width: 60 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fab: {
    position: 'absolute',
    right: S.lg,
    bottom: S.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
