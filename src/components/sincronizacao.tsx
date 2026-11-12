import { useState } from 'react';
import { RefreshControl } from 'react-native';

import { Aviso } from '@/components/ui';
import { C } from '@/constants/theme';
import { avisar } from '@/lib/confirmar';
import { mensagemDeErro } from '@/services/api';
import { useStore } from '@/store/store';

/** "Puxar para atualizar": busca tudo de novo na API. Use em `refreshControl` de um ScrollView. */
export function useAtualizarAoPuxar() {
  const { recarregar } = useStore();
  const [atualizando, setAtualizando] = useState(false);

  async function atualizar() {
    setAtualizando(true);
    try {
      await recarregar();
    } catch (error) {
      avisar('Não foi possível atualizar', mensagemDeErro(error));
    } finally {
      setAtualizando(false);
    }
  }

  return (
    <RefreshControl
      refreshing={atualizando}
      onRefresh={atualizar}
      tintColor={C.accent}
      colors={[C.accent]}
      progressBackgroundColor={C.surface}
    />
  );
}

/** Aparece quando a API não respondeu e a tela mostra a cópia salva no aparelho. */
export function AvisoSemConexao() {
  const { offline } = useStore();
  if (!offline) return null;
  return (
    <Aviso icon="cloud-offline-outline" cor={C.warning}>
      Sem conexão com o servidor. Mostrando os dados salvos neste aparelho; puxe para baixo para tentar de novo.
    </Aviso>
  );
}
