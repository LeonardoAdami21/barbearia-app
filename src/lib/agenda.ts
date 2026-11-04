import type { Agendamento, State, Status } from '@/types';

import { gerarHorarios, hoje, horaParaMin, jaPassou } from './datas';

/** Status que ocupam a cadeira. */
const OCUPA: Status[] = ['agendado', 'confirmado', 'concluido'];

export const buscarCliente = (s: State, id: string) => s.clientes.find((c) => c.id === id);
export const buscarServico = (s: State, id: string) => s.servicos.find((x) => x.id === id);

export function estatisticasCliente(s: State, clienteId: string) {
  const ags = s.agendamentos.filter((a) => a.clienteId === clienteId);
  const visitas = ags.filter((a) => a.status === 'concluido').length;
  const faltas = ags.filter((a) => a.status === 'faltou').length;
  const encerrados = visitas + faltas;
  return {
    total: ags.length,
    visitas,
    faltas,
    presenca: encerrados ? Math.round((visitas / encerrados) * 100) : null,
    alerta: faltas >= s.config.limiteFaltas,
  };
}

/** Já passou do horário e ninguém marcou se o cliente veio ou faltou. */
export const precisaMarcarPresenca = (a: Agendamento) =>
  (a.status === 'agendado' || a.status === 'confirmado') && jaPassou(a.data, a.hora);

export function horariosDoDia(s: State, data: string, servicoId: string, ignorarId?: string) {
  const { abertura, fechamento, intervaloMin } = s.config;
  const duracao = buscarServico(s, servicoId)?.duracaoMin ?? intervaloMin;
  const fim = horaParaMin(fechamento);
  const ocupados = s.agendamentos
    .filter((a) => a.data === data && a.id !== ignorarId && OCUPA.includes(a.status))
    .map((a) => {
      const ini = horaParaMin(a.hora);
      return [ini, ini + (buscarServico(s, a.servicoId)?.duracaoMin ?? intervaloMin)] as const;
    });

  return gerarHorarios(abertura, fechamento, intervaloMin).map((hora) => {
    const ini = horaParaMin(hora);
    const termino = ini + duracao;
    const conflito = ocupados.some(([a, b]) => a < termino && ini < b);
    const passado = data === hoje() && jaPassou(data, hora);
    return { hora, livre: !conflito && !passado && termino <= fim };
  });
}

export const formatarPreco = (v: number) =>
  `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

export const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
