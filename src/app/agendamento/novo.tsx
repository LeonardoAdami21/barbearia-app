import { router, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Aviso, Btn, Card, Chip, Empty, FECHAR_TECLADO, Field, Section, st } from '@/components/ui';
import { C, S } from '@/constants/theme';
import { colunas, useLayout } from '@/hooks/useLayout';
import { buscarCliente, estatisticasCliente, formatarPreco, horariosDoDia, servicosAtivos } from '@/lib/agenda';
import { avisar } from '@/lib/confirmar';
import { addDias, hoje, rotuloDia } from '@/lib/datas';
import { formatarTelefone, normalizarTelefone, telefoneValido } from '@/lib/whatsapp';
import { mensagemDeErro } from '@/services/api';
import type { NovoAgendamento as PedidoAgendamento } from '@/services/barbearia';
import { useStore } from '@/store/store';

export default function NovoAgendamento() {
  const params = useLocalSearchParams<{ data?: string; clienteId?: string }>();
  const { state, acoes } = useStore();
  const servicos = servicosAtivos(state);
  const [salvando, setSalvando] = useState(false);
  const headerHeight = useHeaderHeight();
  const { conteudo } = useLayout();
  const larguraHora = colunas(conteudo, 72, S.sm).item;

  const dataInicial = params.data && params.data >= hoje() ? params.data : hoje();
  const [clienteId, setClienteId] = useState(params.clienteId ?? '');
  const [busca, setBusca] = useState('');
  const [cadastrando, setCadastrando] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [servicoId, setServicoId] = useState(servicos[0]?.id ?? '');
  const [data, setData] = useState(dataInicial);
  const [hora, setHora] = useState('');
  const [obs, setObs] = useState('');

  const cliente = clienteId ? buscarCliente(state, clienteId) : undefined;
  const stats = cliente ? estatisticasCliente(state, cliente.id) : null;
  const termo = busca.trim().toLowerCase();
  const digitos = termo.replace(/\D/g, '');
  const sugestoes = termo
    ? state.clientes
        .filter((c) => c.nome.toLowerCase().includes(termo) || (digitos && c.telefone.includes(digitos)))
        .slice(0, 5)
    : [];
  const horarios = servicoId ? horariosDoDia(state, data, servicoId) : [];
  const dias = Array.from({ length: 21 }, (_, i) => addDias(hoje(), i));

  function trocarServicoOuData(acao: () => void) {
    acao();
    setHora('');
  }

  async function salvar() {
    const pedido: PedidoAgendamento = { servicoId, data, hora, obs: obs.trim() || undefined };
    if (clienteId) {
      pedido.clienteId = clienteId;
    } else {
      if (!cadastrando) return avisar('Falta o cliente', 'Busque um cliente ou cadastre um novo.');
      if (nome.trim().length < 2) return avisar('Nome do cliente', 'Informe o nome do cliente.');
      if (!telefoneValido(telefone))
        return avisar('Telefone inválido', 'Use DDD + número, por exemplo (27) 99999-9999.');
      // Telefone já cadastrado: usa o cliente que já existe (a API faz o mesmo).
      const existente = state.clientes.find(
        (c) => normalizarTelefone(c.telefone) === normalizarTelefone(telefone),
      );
      if (existente) pedido.clienteId = existente.id;
      else pedido.novoCliente = { nome: nome.trim(), telefone };
    }
    if (!servicoId) return avisar('Serviço', 'Cadastre um serviço em Ajustes.');
    if (!hora) return avisar('Horário', 'Escolha um horário livre.');

    setSalvando(true);
    try {
      const novo = await acoes.addAgendamento(pedido);
      router.replace(`/agendamento/${novo.id}`);
    } catch (error) {
      // Ex.: outro aparelho marcou o mesmo horário antes (a API responde 409).
      avisar('Não foi possível agendar', mensagemDeErro(error));
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={st.screen} behavior="padding" keyboardVerticalOffset={headerHeight}>
      <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode={FECHAR_TECLADO}>
        <Section title="Cliente">
          {cliente ? (
            <Card style={styles.clienteSel}>
              <View style={{ flex: 1 }}>
                <Text style={st.h2}>{cliente.nome}</Text>
                <Text style={st.muted}>{formatarTelefone(cliente.telefone)}</Text>
              </View>
              <Btn label="Trocar" variant="ghost" onPress={() => setClienteId('')} />
            </Card>
          ) : cadastrando ? (
            <Card style={{ gap: S.md }}>
              <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Nome do cliente" autoFocus />
              <Field
                label="WhatsApp"
                value={telefone}
                onChangeText={setTelefone}
                placeholder="(27) 99999-9999"
                keyboardType="phone-pad"
              />
              <Btn label="Buscar cliente já cadastrado" variant="ghost" onPress={() => setCadastrando(false)} />
            </Card>
          ) : (
            <View style={{ gap: S.sm }}>
              <Field label="Buscar por nome ou telefone" value={busca} onChangeText={setBusca} placeholder="Ex.: João" />
              {sugestoes.map((c) => (
                <Card key={c.id} onPress={() => setClienteId(c.id)} style={{ paddingVertical: S.md }}>
                  <Text style={st.body}>{c.nome}</Text>
                  <Text style={st.muted}>{formatarTelefone(c.telefone)}</Text>
                </Card>
              ))}
              <Btn
                label="Cadastrar novo cliente"
                icon="person-add-outline"
                variant="secondary"
                onPress={() => {
                  setCadastrando(true);
                  setNome(busca);
                }}
              />
            </View>
          )}
          {stats?.alerta && (
            <Aviso cor={C.danger}>
              {cliente?.nome} já faltou {stats.faltas} vezes. Considere pedir um sinal via Pix ou confirmar por ligação.
            </Aviso>
          )}
        </Section>

        <Section title="Serviço">
          <View style={styles.grade}>
            {servicos.map((s) => (
              <Chip
                key={s.id}
                label={s.nome}
                sub={`${s.duracaoMin} min · ${formatarPreco(s.preco)}`}
                selected={s.id === servicoId}
                onPress={() => trocarServicoOuData(() => setServicoId(s.id))}
              />
            ))}
          </View>
        </Section>

        <Section title="Dia">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm }}>
            {dias.map((d) => (
              <Chip key={d} label={rotuloDia(d)} selected={d === data} onPress={() => trocarServicoOuData(() => setData(d))} />
            ))}
          </ScrollView>
        </Section>

        <Section title="Horário">
          {horarios.some((h) => h.livre) ? (
            <View style={styles.grade}>
              {horarios.map((h) => (
                <Chip
                  key={h.hora}
                  label={h.hora}
                  selected={h.hora === hora}
                  disabled={!h.livre}
                  onPress={() => setHora(h.hora)}
                  style={{ width: larguraHora }}
                />
              ))}
            </View>
          ) : (
            <Empty icon="time-outline" title="Sem horários livres" subtitle="Escolha outro dia ou um serviço mais curto." />
          )}
        </Section>

        <Field label="Observação (opcional)" value={obs} onChangeText={setObs} placeholder="Ex.: degradê navalhado" multiline />

        <Btn label="Agendar" icon="checkmark" loading={salvando} onPress={salvar} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  clienteSel: { flexDirection: 'row', alignItems: 'center' },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
});
