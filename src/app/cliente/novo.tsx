import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { Btn, Field, st } from '@/components/ui';
import { avisar } from '@/lib/confirmar';
import { normalizarTelefone, telefoneValido } from '@/lib/whatsapp';
import { novoId, useStore } from '@/store/store';

export default function NovoCliente() {
  const { state, dispatch } = useStore();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [obs, setObs] = useState('');

  function salvar() {
    if (nome.trim().length < 2) return avisar('Nome', 'Informe o nome do cliente.');
    if (!telefoneValido(telefone)) return avisar('Telefone inválido', 'Use DDD + número, por exemplo (27) 99999-9999.');
    const repetido = state.clientes.find((c) => normalizarTelefone(c.telefone) === normalizarTelefone(telefone));
    if (repetido) return avisar('Telefone já cadastrado', `Este número é de ${repetido.nome}.`);
    dispatch({
      type: 'addCliente',
      cliente: {
        id: novoId(),
        nome: nome.trim(),
        telefone: telefone.replace(/\D/g, ''),
        obs: obs.trim() || undefined,
        criadoEm: new Date().toISOString(),
      },
    });
    router.back();
  }

  return (
    <KeyboardAvoidingView style={st.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
        <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Nome do cliente" autoFocus />
        <Field label="WhatsApp" value={telefone} onChangeText={setTelefone} placeholder="(27) 99999-9999" keyboardType="phone-pad" />
        <Field label="Observações (opcional)" value={obs} onChangeText={setObs} placeholder="Preferências de corte, alergias…" multiline />
        <Btn label="Salvar cliente" icon="checkmark" onPress={salvar} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
