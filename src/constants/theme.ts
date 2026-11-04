import type { Status } from '@/types';

/** Paleta escura com acento dourado, no clima de barbearia. */
export const C = {
  bg: '#121212',
  surface: '#1C1C1E',
  surface2: '#262628',
  border: '#34343A',
  text: '#F4F1EA',
  muted: '#A09C94',
  accent: '#D4A24C',
  accentText: '#1A1406',
  success: '#4CAF7A',
  danger: '#E05D5D',
  warning: '#E8A23A',
  info: '#5B9BD5',
  whatsapp: '#25D366',
} as const;

export const STATUS: Record<Status, { label: string; cor: string }> = {
  agendado: { label: 'Agendado', cor: C.info },
  confirmado: { label: 'Confirmado', cor: C.success },
  concluido: { label: 'Concluído', cor: C.muted },
  faltou: { label: 'Faltou', cor: C.danger },
  cancelado: { label: 'Cancelado', cor: '#77777C' },
};

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const R = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
