export type Status = 'agendado' | 'confirmado' | 'concluido' | 'faltou' | 'cancelado';

export type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  obs?: string;
  criadoEm: string;
};

export type Servico = {
  id: string;
  nome: string;
  duracaoMin: number;
  preco: number;
  /** false = removido: some dos novos agendamentos, mas o nome continua no histórico. */
  ativo: boolean;
};

export type Agendamento = {
  id: string;
  clienteId: string;
  servicoId: string;
  /** YYYY-MM-DD */
  data: string;
  /** HH:MM */
  hora: string;
  status: Status;
  obs?: string;
  confirmacaoEnviada: boolean;
  lembreteEnviado: boolean;
  /** Duração e preço do serviço no momento em que o horário foi marcado. */
  duracaoMin: number;
  preco: number;
  criadoEm: string;
};

export type Config = {
  nomeBarbearia: string;
  abertura: string;
  fechamento: string;
  intervaloMin: number;
  /** A partir de quantas faltas o cliente recebe alerta. */
  limiteFaltas: number;
  msgConfirmacao: string;
  msgLembrete: string;
};

export type State = {
  clientes: Cliente[];
  servicos: Servico[];
  agendamentos: Agendamento[];
  config: Config;
};
