import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FECHAR_TECLADO, st } from '@/components/ui';
import { C, R, S, T } from '@/constants/theme';

/** Moldura das telas de login, cadastro e verificação: centralizada e com largura limitada. */
export function AuthLayout({
  titulo,
  subtitulo,
  icone = 'cut',
  children,
  topo = true,
}: {
  titulo: string;
  subtitulo?: string;
  icone?: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  /** false quando a tela já tem cabeçalho de navegação (não precisa da área segura de cima). */
  topo?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={st.screen} behavior="padding">
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: (topo ? insets.top : 0) + S.xl, paddingBottom: insets.bottom + S.xl }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={FECHAR_TECLADO}>
        <View style={styles.conteudo}>
          <View style={styles.cabecalho}>
            <View style={styles.logo}>
              <Ionicons name={icone} size={32} color={C.accentText} />
            </View>
            <Text style={styles.titulo} accessibilityRole="header">
              {titulo}
            </Text>
            {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
          </View>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Linha "ou" entre o login normal e o do Google. */
export function Divisor({ texto = 'ou' }: { texto?: string }) {
  return (
    <View style={styles.divisor} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.linha} />
      <Text style={st.muted}>{texto}</Text>
      <View style={styles.linha} />
    </View>
  );
}

/** Mensagem de erro geral do formulário (ex.: senha incorreta, sem internet). */
export function ErroFormulario({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <View style={styles.erro} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <Ionicons name="alert-circle" size={18} color={C.danger} />
      <Text style={styles.erroTexto}>{mensagem}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: S.lg },
  conteudo: { width: '100%', maxWidth: 420, alignSelf: 'center', gap: S.lg },
  cabecalho: { alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  logo: {
    width: 64,
    height: 64,
    borderRadius: R.pill,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.xs,
  },
  titulo: { ...T.h1, color: C.text, textAlign: 'center' },
  subtitulo: { ...T.body, color: C.muted, textAlign: 'center', lineHeight: 21 },
  divisor: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  linha: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: C.border },
  erro: {
    flexDirection: 'row',
    gap: S.sm,
    alignItems: 'flex-start',
    padding: S.md,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.danger,
    backgroundColor: C.surface,
  },
  erroTexto: { ...T.small, color: C.text, flex: 1, lineHeight: 20 },
});
