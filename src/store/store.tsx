import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react';

import type { Agendamento, Cliente, Config, Servico, State } from '@/types';

import { estadoExemplo } from './seed';

/**
 * Por enquanto os dados ficam salvos só no aparelho (AsyncStorage).
 * Quando o backend existir, é aqui que as ações passam a chamar a API.
 */
const CHAVE = 'barbearia:v1';

type Action =
  | { type: 'carregar'; state: State }
  | { type: 'addCliente'; cliente: Cliente }
  | { type: 'updateCliente'; id: string; patch: Partial<Cliente> }
  | { type: 'removeCliente'; id: string }
  | { type: 'addAgendamento'; agendamento: Agendamento }
  | { type: 'updateAgendamento'; id: string; patch: Partial<Agendamento> }
  | { type: 'removeAgendamento'; id: string }
  | { type: 'addServico'; servico: Servico }
  | { type: 'removeServico'; id: string }
  | { type: 'setConfig'; patch: Partial<Config> };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'carregar':
      return action.state;
    case 'addCliente':
      return { ...state, clientes: [...state.clientes, action.cliente] };
    case 'updateCliente':
      return {
        ...state,
        clientes: state.clientes.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
      };
    case 'removeCliente':
      return {
        ...state,
        clientes: state.clientes.filter((c) => c.id !== action.id),
        agendamentos: state.agendamentos.filter((a) => a.clienteId !== action.id),
      };
    case 'addAgendamento':
      return { ...state, agendamentos: [...state.agendamentos, action.agendamento] };
    case 'updateAgendamento':
      return {
        ...state,
        agendamentos: state.agendamentos.map((a) =>
          a.id === action.id ? { ...a, ...action.patch } : a,
        ),
      };
    case 'removeAgendamento':
      return { ...state, agendamentos: state.agendamentos.filter((a) => a.id !== action.id) };
    case 'addServico':
      return { ...state, servicos: [...state.servicos, action.servico] };
    case 'removeServico':
      return { ...state, servicos: state.servicos.filter((s) => s.id !== action.id) };
    case 'setConfig':
      return { ...state, config: { ...state.config, ...action.patch } };
  }
}

type Ctx = { state: State; dispatch: (action: Action) => void };
const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, estadoExemplo);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then((json) => {
        if (json) dispatch({ type: 'carregar', state: JSON.parse(json) as State });
      })
      .catch(() => {})
      .finally(() => setCarregado(true));
  }, []);

  useEffect(() => {
    if (carregado) AsyncStorage.setItem(CHAVE, JSON.stringify(state)).catch(() => {});
  }, [state, carregado]);

  if (!carregado) return null;
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore precisa estar dentro de <StoreProvider>');
  return ctx;
}

export const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
