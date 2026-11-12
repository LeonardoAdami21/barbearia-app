import type { State } from '@/types';

/** Estado antes de carregar a barbearia da API (e depois de sair da conta). */
export const estadoVazio = (): State => ({
  clientes: [],
  agendamentos: [],
  servicos: [],
  config: {
    nomeBarbearia: '',
    abertura: '09:00',
    fechamento: '19:00',
    intervaloMin: 30,
    limiteFaltas: 2,
    msgConfirmacao: '',
    msgLembrete: '',
  },
});
