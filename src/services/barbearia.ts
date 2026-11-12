import { api } from '@/services/api';
import type { Agendamento, Cliente, Config, Servico, State, Status } from '@/types';

export type NovoCliente = { nome: string; telefone: string; obs?: string };
export type NovoServico = { nome: string; duracaoMin: number; preco: number };
export type NovoAgendamento = {
  /** Cliente já cadastrado, ou `novoCliente` para cadastrar junto (se o telefone já existir, a API usa o cliente dele). */
  clienteId?: string;
  novoCliente?: NovoCliente;
  servicoId: string;
  data: string;
  hora: string;
  obs?: string;
};
export type AlteracaoAgendamento = Partial<{
  servicoId: string;
  data: string;
  hora: string;
  status: Status;
  /** "" apaga a observação. */
  obs: string;
  confirmacaoEnviada: boolean;
  lembreteEnviado: boolean;
}>;

/** Rotas da barbearia-api para os dados da barbearia (sempre do usuário logado). */
export const barbeariaService = {
  estado: () => api<State>('/estado'),

  salvarConfig: (patch: Partial<Config>) => api<Config>('/config', { method: 'PATCH', body: patch }),

  criarServico: (body: NovoServico) => api<Servico>('/servicos', { method: 'POST', body }),
  removerServico: (id: string) => api<null>(`/servicos/${id}`, { method: 'DELETE' }),

  cliente: (id: string) => api<Cliente>(`/clientes/${id}`),
  criarCliente: (body: NovoCliente) => api<Cliente>('/clientes', { method: 'POST', body }),
  alterarCliente: (id: string, body: Partial<NovoCliente>) =>
    api<Cliente>(`/clientes/${id}`, { method: 'PATCH', body }),
  removerCliente: (id: string) => api<null>(`/clientes/${id}`, { method: 'DELETE' }),

  criarAgendamento: (body: NovoAgendamento) => api<Agendamento>('/agendamentos', { method: 'POST', body }),
  alterarAgendamento: (id: string, body: AlteracaoAgendamento) =>
    api<Agendamento>(`/agendamentos/${id}`, { method: 'PATCH', body }),
  removerAgendamento: (id: string) => api<null>(`/agendamentos/${id}`, { method: 'DELETE' }),
};
