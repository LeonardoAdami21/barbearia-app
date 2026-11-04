import { addDias, hoje } from '@/lib/datas';
import type { Config, Servico, State } from '@/types';

export const configPadrao: Config = {
  nomeBarbearia: 'Minha Barbearia',
  abertura: '09:00',
  fechamento: '19:00',
  intervaloMin: 30,
  limiteFaltas: 2,
  msgConfirmacao:
    'Olá, {nome}! Seu horário na {barbearia} está marcado para {data} às {hora} ({servico}). ' +
    'Responda SIM para confirmar ou avise se precisar remarcar. 💈',
  msgLembrete:
    'Oi, {nome}! Passando para lembrar do seu horário {data} às {hora} na {barbearia}. ' +
    'Se não puder vir, avise para liberarmos o horário. Até já!',
};

export const servicosPadrao: Servico[] = [
  { id: 'corte', nome: 'Corte', duracaoMin: 30, preco: 40 },
  { id: 'barba', nome: 'Barba', duracaoMin: 30, preco: 30 },
  { id: 'corte-barba', nome: 'Corte + barba', duracaoMin: 60, preco: 65 },
  { id: 'sobrancelha', nome: 'Sobrancelha', duracaoMin: 15, preco: 15 },
];

/** Estado vazio (sem clientes nem agendamentos). */
export const estadoVazio = (): State => ({
  clientes: [],
  agendamentos: [],
  servicos: servicosPadrao,
  config: configPadrao,
});

/** Dados de exemplo para ver o app funcionando no primeiro uso. */
export function estadoExemplo(): State {
  const h = hoje();
  const agora = new Date().toISOString();
  return {
    ...estadoVazio(),
    clientes: [
      { id: 'c1', nome: 'João Silva', telefone: '27999990001', criadoEm: agora },
      { id: 'c2', nome: 'Pedro Santos', telefone: '27999990002', criadoEm: agora, obs: 'Prefere máquina 2 nas laterais' },
      { id: 'c3', nome: 'Lucas Oliveira', telefone: '27999990003', criadoEm: agora },
    ],
    agendamentos: [
      { id: 'a1', clienteId: 'c1', servicoId: 'corte', data: h, hora: '10:00', status: 'confirmado', confirmacaoEnviada: true, criadoEm: agora },
      { id: 'a2', clienteId: 'c2', servicoId: 'corte-barba', data: h, hora: '14:00', status: 'agendado', criadoEm: agora },
      { id: 'a3', clienteId: 'c3', servicoId: 'barba', data: h, hora: '16:30', status: 'agendado', criadoEm: agora },
      { id: 'a4', clienteId: 'c1', servicoId: 'barba', data: addDias(h, 1), hora: '11:00', status: 'agendado', criadoEm: agora },
      { id: 'a5', clienteId: 'c2', servicoId: 'corte', data: addDias(h, -7), hora: '15:00', status: 'faltou', criadoEm: agora },
      { id: 'a6', clienteId: 'c2', servicoId: 'corte', data: addDias(h, -14), hora: '09:30', status: 'faltou', criadoEm: agora },
      { id: 'a7', clienteId: 'c3', servicoId: 'corte', data: addDias(h, -10), hora: '17:00', status: 'concluido', criadoEm: agora },
    ],
  };
}
