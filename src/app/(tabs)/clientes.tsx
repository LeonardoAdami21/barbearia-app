import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Empty, Tag, st } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { estatisticasCliente, plural } from '@/lib/agenda';
import { formatarTelefone } from '@/lib/whatsapp';
import { useStore } from '@/store/store';

export default function ClientesScreen() {
  const { state } = useStore();
  const insets = useSafeAreaInsets();
  const [busca, setBusca] = useState('');
  const [soAlerta, setSoAlerta] = useState(false);

  const termo = busca.trim().toLowerCase();
  const digitos = termo.replace(/\D/g, '');
  const lista = state.clientes
    .map((c) => ({ c, stats: estatisticasCliente(state, c.id) }))
    .filter(({ c, stats }) => {
      if (soAlerta && !stats.alerta) return false;
      if (!termo) return true;
      return c.nome.toLowerCase().includes(termo) || (!!digitos && c.telefone.includes(digitos));
    })
    .sort((a, b) => a.c.nome.localeCompare(b.c.nome, 'pt-BR'));
  const comAlerta = state.clientes.filter((c) => estatisticasCliente(state, c.id).alerta).length;

  return (
    <View style={[st.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={st.muted}>{state.clientes.length} cadastrados</Text>
          <Text style={st.h1}>Clientes</Text>
        </View>
        <Pressable
          accessibilityLabel="Novo cliente"
          onPress={() => router.push('/cliente/novo')}
          style={({ pressed }) => [styles.add, pressed && st.pressed]}>
          <Ionicons name="person-add" size={20} color={C.accentText} />
        </Pressable>
      </View>

      <View style={styles.filtros}>
        <View style={styles.busca}>
          <Ionicons name="search" size={18} color={C.muted} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar nome ou telefone"
            placeholderTextColor="#6E6A63"
            style={styles.buscaInput}
          />
        </View>
        {comAlerta > 0 && (
          <Pressable onPress={() => setSoAlerta(!soAlerta)} style={[styles.filtro, soAlerta && styles.filtroOn]}>
            <Text style={[styles.filtroTxt, soAlerta && { color: '#fff' }]}>
              Com faltas ({comAlerta})
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={[st.scroll, { gap: S.sm }]} keyboardShouldPersistTaps="handled">
        {lista.length === 0 ? (
          <Empty
            icon="people-outline"
            title={state.clientes.length ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
            subtitle={state.clientes.length ? undefined : 'Clientes também são cadastrados ao criar um agendamento.'}
          />
        ) : (
          lista.map(({ c, stats }) => (
            <Card key={c.id} onPress={() => router.push(`/cliente/${c.id}`)} style={styles.item}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>{c.nome.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={st.h2} numberOfLines={1}>{c.nome}</Text>
                <Text style={st.muted}>
                  {formatarTelefone(c.telefone)} · {plural(stats.visitas, 'visita', 'visitas')}
                </Text>
                {stats.alerta && <Tag label={`${stats.faltas} faltas · pedir sinal`} cor={C.danger} icon="alert-circle" />}
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.muted} />
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: S.lg, paddingTop: S.md, paddingBottom: S.sm },
  add: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  filtros: { paddingHorizontal: S.lg, gap: S.sm, paddingBottom: S.sm },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: C.surface,
    borderRadius: R.md,
    paddingHorizontal: S.md,
  },
  buscaInput: { flex: 1, color: C.text, fontSize: 16, minHeight: 46 },
  filtro: { alignSelf: 'flex-start', borderWidth: 1, borderColor: C.danger, borderRadius: R.pill, paddingHorizontal: S.md, paddingVertical: 6 },
  filtroOn: { backgroundColor: C.danger },
  filtroTxt: { color: C.danger, fontWeight: '700', fontSize: 13 },
  item: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: C.accent, fontSize: 18, fontWeight: '800' },
});
