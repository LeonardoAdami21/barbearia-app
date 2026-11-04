import type { TextStyle } from 'react-native';

import type { Status } from '@/types';

/** Paleta escura com acento dourado, no clima de barbearia. */
export const C = {
  bg: '#121212',
  surface: '#1C1C1E',
  surface2: '#262628',
  border: '#34343A',
  text: '#F4F1EA',
  muted: '#A09C94',
  /** Contraste ≥ 4.5:1 sobre surface e surface2. */
  placeholder: '#908B83',
  accent: '#D4A24C',
  accentText: '#1A1406',
  success: '#4CAF7A',
  danger: '#E05D5D',
  onDanger: '#FFFFFF',
  warning: '#E8A23A',
  info: '#5B9BD5',
  whatsapp: '#25D366',
  onWhatsapp: '#06260F',
  cancelado: '#77777C',
  shadow: '#000000',
} as const;

export const STATUS: Record<Status, { label: string; cor: string }> = {
  agendado: { label: 'Agendado', cor: C.info },
  confirmado: { label: 'Confirmado', cor: C.success },
  concluido: { label: 'Concluído', cor: C.muted },
  faltou: { label: 'Faltou', cor: C.danger },
  cancelado: { label: 'Cancelado', cor: C.cancelado },
};

export const S = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 40 } as const;
export const R = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

/** Escala tipográfica. Combine com uma cor: `[T.body, { color: C.text }]`. */
export const T = {
  display: { fontSize: 36, fontWeight: '800' },
  h1: { fontSize: 28, fontWeight: '800' },
  stat: { fontSize: 24, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '800' },
  h2: { fontSize: 18, fontWeight: '700' },
  button: { fontSize: 16, fontWeight: '700' },
  input: { fontSize: 16 },
  body: { fontSize: 15 },
  bodyStrong: { fontSize: 15, fontWeight: '600' },
  small: { fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '600' },
  micro: { fontSize: 11 },
} as const satisfies Record<string, TextStyle>;

/** Altura mínima de áreas tocáveis. */
export const TOQUE = 44;
