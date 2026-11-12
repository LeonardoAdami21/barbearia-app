import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen } from 'expo-router';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Btn, st } from '@/components/ui';
import { C, S } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';
import { mensagemDeErro } from '@/services/api';
import {
  barbeariaService as svc,
  type AlteracaoAgendamento,
  type NovoAgendamento,
  type NovoCliente,
  type NovoServico,
} from '@/services/barbearia';
import type { Agendamento, Cliente, Config, State } from '@/types';

import { estadoVazio } from './seed';

/**
 * Dados da barbearia vindos da barbearia-api.
 *
 * - Ao entrar na conta, carrega tudo de GET /estado.
 * - Guarda uma cópia no aparelho: o app abre na hora e dá para consultar a agenda sem internet.
 * - Cada ação chama a API primeiro e só então atualiza a tela. Se a API recusar (ex.: horário
 *   ocupado, telefone repetido, sem internet) a ação lança o erro e nada muda.
 */
const CACHE = 'barbearia:estado:v2';
/** Chave usada antes da API existir (dados só no aparelho). Apagada ao sair da conta. */
const CHAVE_ANTIGA = 'barbearia:v1';

const sem = <T extends { id: string }>(lista: T[], id: string) => lista.filter((x) => x.id !== id);
const trocar = <T extends { id: string }>(lista: T[], item: T) =>
  lista.some((x) => x.id === item.id) ? lista.map((x) => (x.id === item.id ? item : x)) : [...lista, item];
/** A API devolve cliente com `estatisticas`; no estado elas são calculadas a partir da agenda. */
const soCliente = ({ id, nome, telefone, obs, criadoEm }: Cliente): Cliente => ({ id, nome, telefone, obs, criadoEm });

type Acoes = {
  salvarConfig: (patch: Partial<Config>) => Promise<void>;
  addServico: (servico: NovoServico) => Promise<void>;
  removerServico: (id: string) => Promise<void>;
  addCliente: (cliente: NovoCliente) => Promise<Cliente>;
  alterarCliente: (id: string, patch: Partial<NovoCliente>) => Promise<void>;
  removerCliente: (id: string) => Promise<void>;
  addAgendamento: (agendamento: NovoAgendamento) => Promise<Agendamento>;
  alterarAgendamento: (id: string, patch: AlteracaoAgendamento) => Promise<void>;
  removerAgendamento: (id: string) => Promise<void>;
};

type Ctx = {
  state: State;
  /** true enquanto o estado mostrado é a cópia do aparelho (a API não respondeu). */
  offline: boolean;
  /** Busca tudo de novo na API (puxar para atualizar). */
  recarregar: () => Promise<void>;
  acoes: Acoes;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  // Saiu da conta: os dados da barbearia não ficam no aparelho.
  useEffect(() => {
    if (status === 'signedOut') void AsyncStorage.multiRemove([CACHE, CHAVE_ANTIGA]).catch(() => {});
  }, [status]);

  // A key troca ao entrar/sair: o React remonta o store e o estado volta a ficar vazio.
  return (
    <StoreDaConta key={status === 'signedIn' ? 'logado' : 'deslogado'} logado={status === 'signedIn'}>
      {children}
    </StoreDaConta>
  );
}

function StoreDaConta({ logado, children }: { logado: boolean; children: ReactNode }) {
  const [state, setState] = useState<State>(estadoVazio);
  const [carregado, setCarregado] = useState(false);
  const [offline, setOffline] = useState(false);
  const [erro, setErro] = useState<string>();

  /** Aplica uma mudança no estado e atualiza a cópia do aparelho. */
  const aplicar = useCallback((mudar: (s: State) => State) => {
    setState((atual) => {
      const novo = mudar(atual);
      AsyncStorage.setItem(CACHE, JSON.stringify(novo)).catch(() => {});
      return novo;
    });
  }, []);

  const recarregar = useCallback(async () => {
    try {
      const novo = await svc.estado();
      aplicar(() => novo);
      setOffline(false);
      setErro(undefined);
      setCarregado(true);
    } catch (error) {
      setOffline(true);
      setErro(mensagemDeErro(error));
      throw error;
    }
  }, [aplicar]);

  useEffect(() => {
    if (!logado) return;
    let ativo = true;
    (async () => {
      const salvo = await AsyncStorage.getItem(CACHE).catch(() => null);
      if (salvo && ativo) {
        setState(JSON.parse(salvo) as State);
        setCarregado(true);
      }
      await recarregar().catch(() => {});
    })();
    return () => {
      ativo = false;
    };
  }, [logado, recarregar]);

  const acoes = useMemo<Acoes>(
    () => ({
      async salvarConfig(patch) {
        const config = await svc.salvarConfig(patch);
        aplicar((s) => ({ ...s, config }));
      },
      async addServico(servico) {
        const novo = await svc.criarServico(servico);
        aplicar((s) => ({ ...s, servicos: [...s.servicos, novo] }));
      },
      async removerServico(id) {
        await svc.removerServico(id);
        // O serviço continua no histórico, só não aparece para novos agendamentos.
        aplicar((s) => ({ ...s, servicos: s.servicos.map((x) => (x.id === id ? { ...x, ativo: false } : x)) }));
      },
      async addCliente(cliente) {
        const novo = soCliente(await svc.criarCliente(cliente));
        aplicar((s) => ({ ...s, clientes: [...s.clientes, novo] }));
        return novo;
      },
      async alterarCliente(id, patch) {
        const cliente = soCliente(await svc.alterarCliente(id, patch));
        aplicar((s) => ({ ...s, clientes: trocar(s.clientes, cliente) }));
      },
      async removerCliente(id) {
        await svc.removerCliente(id);
        aplicar((s) => ({
          ...s,
          clientes: sem(s.clientes, id),
          agendamentos: s.agendamentos.filter((a) => a.clienteId !== id),
        }));
      },
      async addAgendamento(agendamento) {
        const novo = await svc.criarAgendamento(agendamento);
        // Cliente cadastrado junto com o agendamento: busca para aparecer na lista.
        const cliente = agendamento.novoCliente ? soCliente(await svc.cliente(novo.clienteId)) : undefined;
        aplicar((s) => ({
          ...s,
          clientes: cliente ? trocar(s.clientes, cliente) : s.clientes,
          agendamentos: [...s.agendamentos, novo],
        }));
        return novo;
      },
      async alterarAgendamento(id, patch) {
        const agendamento = await svc.alterarAgendamento(id, patch);
        aplicar((s) => ({ ...s, agendamentos: trocar(s.agendamentos, agendamento) }));
      },
      async removerAgendamento(id) {
        await svc.removerAgendamento(id);
        aplicar((s) => ({ ...s, agendamentos: sem(s.agendamentos, id) }));
      },
    }),
    [aplicar],
  );

  const value = useMemo(() => ({ state, offline, recarregar, acoes }), [state, offline, recarregar, acoes]);

  // Logado, mas sem nada para mostrar ainda (primeiro acesso neste aparelho).
  if (logado && !carregado) {
    // O navegador ainda não montou: tira a splash para o carregamento (ou o erro) aparecer.
    SplashScreen.hide();
    return (
      <View style={[st.screen, styles.centro]}>
        {erro ? (
          <>
            <Text style={[st.body, styles.texto]}>Não foi possível carregar a barbearia.</Text>
            <Text style={[st.muted, styles.texto]}>{erro}</Text>
            <Btn label="Tentar de novo" icon="refresh" onPress={() => void recarregar().catch(() => {})} />
          </>
        ) : (
          <ActivityIndicator size="large" color={C.accent} />
        )}
      </View>
    );
  }

  return <StoreContext value={value}>{children}</StoreContext>;
}

export function useStore() {
  const ctx = use(StoreContext);
  if (!ctx) throw new Error('useStore precisa estar dentro de <StoreProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center', gap: S.md, padding: S.xl },
  texto: { textAlign: 'center' },
});
