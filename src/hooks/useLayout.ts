import { useWindowDimensions } from 'react-native';

import { LARGURA_MAX, S } from '@/constants/theme';

/**
 * Medidas da tela atual, atualizadas ao girar o aparelho ou mudar a fonte do sistema.
 * - `conteudo`: largura útil dentro do padding padrão das telas.
 * - `compacto`: celulares estreitos (ex.: 320–359dp).
 * - `fonteGrande`: usuário aumentou a fonte nas configurações do aparelho.
 */
export function useLayout() {
  const { width, fontScale } = useWindowDimensions();
  const conteudo = Math.min(width, LARGURA_MAX) - S.lg * 2;
  return {
    width,
    conteudo,
    compacto: width < 360,
    fonteGrande: fontScale >= 1.3,
  };
}

/** Quantas colunas cabem e a largura de cada uma, preenchendo a linha toda. */
export function colunas(disponivel: number, minItem: number, gap: number) {
  const n = Math.max(1, Math.floor((disponivel + gap) / (minItem + gap)));
  return { n, item: Math.floor((disponivel - gap * (n - 1)) / n) };
}
