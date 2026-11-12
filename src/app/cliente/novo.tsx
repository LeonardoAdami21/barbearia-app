import { router } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView } from 'react-native';

import { Btn, FECHAR_TECLADO, Field, st } from '@/components/ui';
import { avisar } from '@/lib/confirmar';
import { normalizarTelefone, telefoneValido } from '@/lib/whatsapp';
import { mensagemDeErro } from '@/services/api';
import { useStore } from '@/store/store';

export default function NovoCliente() {
  const { state, acoes } = useStore();
  const [salvando, setSalvando] = useState(false);
  const headerHeight = useHeaderHeight();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [obs, setObs] = useState('');

  async function salvar() {
    if (nome.trim().length < 2) return avisar('Nome', 'Informe o nome do cliente.');
    if (!telefoneValido(telefone)) return avisar('Telefone inválido', 'Use DDD + número, por exemplo (27) 99999-9999.');
    const repetido = state.clientes.find((c) => normalizarTelefone(c.telefone) === normalizarTelefone(telefone));
    if (repetido) return avisar('Telefone já cadastrado', `Este número é de ${repetido.nome}.`);
    setSalvando(true);
    try {
      await acoes.addCliente({ nome: nome.trim(), telefone, obs: obs.trim() || undefined });
      router.back();
    } catch (error) {
      avisar('Não foi possível salvar', mensagemDeErro(error));
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={st.screen} behavior="padding" keyboardVerticalOffset={headerHeight}>
      <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode={FECHAR_TECLADO}>
        <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Nome do cliente" autoFocus />
        <Field label="WhatsApp" value={telefone} onChangeText={setTelefone} placeholder="(27) 99999-9999" keyboardType="phone-pad" />
        <Field label="Observações (opcional)" value={obs} onChangeText={setObs} placeholder="Preferências de corte, alergias…" multiline />
        <Btn label="Salvar cliente" icon="checkmark" loading={salvando} onPress={salvar} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
