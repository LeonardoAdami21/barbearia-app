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
  confirmacaoEnviada?: boolean;
  lembreteEnviado?: boolean;
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
