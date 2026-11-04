import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CORTAR_RIPPLE, Card, Empty, RIPPLE, RIPPLE_ESCURO, StatusTag, Tag, st } from '@/components/ui';
import { C, R, S, T, TOQUE } from '@/constants/theme';
import {
  buscarCliente,
  buscarServico,
  estatisticasCliente,
  formatarPreco,
  precisaMarcarPresenca,
} from '@/lib/agenda';
import { addDias, diaDoMes, diaSemanaCurto, hoje, mesCurto, rotuloDia } from '@/lib/datas';
import { useStore } from '@/store/store';

/** Largura de cada dia na faixa + espaçamento entre eles. */
const DIA_LARGURA = 56;
const DIA_GAP = S.sm;
const DIAS_ANTES = 3;

export default function AgendaScreen() {
  const { state } = useStore();
  const insets = useSafeAreaInsets();
  const [dia, setDia] = useState(hoje());
  const dias = Array.from({ length: 21 }, (_, i) => addDias(hoje(), i - DIAS_ANTES));

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
      <View style={[styles.header, st.limite]}>
        <View style={{ flex: 1 }}>
          <Text style={st.muted} numberOfLines={1}>
            {state.config.nomeBarbearia}
          </Text>
          <Text style={st.h1} numberOfLines={1} adjustsFontSizeToFit>
            {rotuloDia(dia)}
          </Text>
        </View>
        {dia !== hoje() && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para hoje"
            onPress={() => setDia(hoje())}
            hitSlop={S.sm}
            android_ripple={RIPPLE}
            style={({ pressed }) => [styles.hojeBtn, pressed && st.pressed]}>
            <Text style={styles.hojeTxt}>Hoje</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dias}
        contentOffset={{ x: DIAS_ANTES * (DIA_LARGURA + DIA_GAP), y: 0 }}>
        {dias.map((d) => {
          const sel = d === dia;
          const n = contagem(d);
          return (
            <Pressable
              key={d}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
              android_ripple={sel ? RIPPLE_ESCURO : RIPPLE}
              onPress={() => setDia(d)}
              style={({ pressed }) => [styles.dia, sel && styles.diaSel, pressed && st.pressed]}>
              <Text style={[styles.diaSemana, sel && styles.diaTxtSel]} maxFontSizeMultiplier={1.2}>
                {diaSemanaCurto(d)}
              </Text>
              <Text style={[styles.diaNum, sel && styles.diaTxtSel]} maxFontSizeMultiplier={1.2}>
                {diaDoMes(d)}
              </Text>
              <Text style={[styles.diaMes, sel && styles.diaTxtSel]} maxFontSizeMultiplier={1.2} numberOfLines={1}>
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
                <Text style={styles.hora} maxFontSizeMultiplier={1.3}>
                  {a.hora}
                </Text>
                <View style={{ flex: 1, gap: S.sm }}>
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
        accessibilityRole="button"
        android_ripple={RIPPLE_ESCURO}
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
      <Text style={styles.resumoValor} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {valor}
      </Text>
      <Text style={st.muted} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {rotulo}
      </Text>
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
    minHeight: TOQUE - S.xs,
    justifyContent: 'center',
    marginBottom: S.xxs,
    ...CORTAR_RIPPLE,
  },
  hojeTxt: { ...T.body, color: C.accent, fontWeight: '700' },
  dias: { paddingHorizontal: S.lg, paddingVertical: S.sm, gap: DIA_GAP },
  dia: {
    width: DIA_LARGURA,
    paddingVertical: S.sm,
    borderRadius: R.md,
    backgroundColor: C.surface,
    alignItems: 'center',
    gap: S.xxs,
    ...CORTAR_RIPPLE,
  },
  diaSel: { backgroundColor: C.accent },
  diaSemana: { ...T.caption, color: C.muted },
  diaNum: { ...T.title, color: C.text },
  diaMes: { ...T.micro, color: C.muted },
  diaTxtSel: { color: C.accentText },
  resumo: { flexDirection: 'row', gap: S.sm },
  resumoItem: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: S.md,
    gap: S.xxs,
  },
  resumoValor: { ...T.title, color: C.text },
  item: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  hora: { ...T.title, color: C.accent, minWidth: 60 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs },
  fab: {
    position: 'absolute',
    right: S.lg,
    bottom: S.lg,
    width: 60,
    height: 60,
    borderRadius: R.pill,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    ...CORTAR_RIPPLE,
    shadowColor: C.shadow,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
