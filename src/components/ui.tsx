import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { C, R, S, STATUS, T, TOQUE } from '@/constants/theme';
import type { Status } from '@/types';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (!onPress) return <View style={[st.card, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.card, style, pressed && st.pressed]}>
      {children}
    </Pressable>
  );
}

const VARIANTES = {
  primary: { bg: C.accent, fg: C.accentText, borda: C.accent },
  secondary: { bg: C.surface2, fg: C.text, borda: C.border },
  success: { bg: 'transparent', fg: C.success, borda: C.success },
  danger: { bg: 'transparent', fg: C.danger, borda: C.danger },
  whatsapp: { bg: C.whatsapp, fg: C.onWhatsapp, borda: C.whatsapp },
  ghost: { bg: 'transparent', fg: C.muted, borda: 'transparent' },
} as const;

export function Btn({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: keyof typeof VARIANTES;
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = VARIANTES[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        st.btn,
        { backgroundColor: v.bg, borderColor: v.borda },
        pressed && st.pressed,
        disabled && st.disabled,
        style,
      ]}>
      {icon && <Ionicons name={icon} size={18} color={v.fg} />}
      <Text style={[st.btnText, { color: v.fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  sub,
  selected,
  disabled,
  onPress,
  style,
}: {
  label: string;
  sub?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        st.chip,
        selected && st.chipSel,
        disabled && st.chipOff,
        pressed && st.pressed,
        style,
      ]}>
      <Text style={[st.chipText, selected && { color: C.accentText }, disabled && st.riscado]}>
        {label}
      </Text>
      {sub ? (
        <Text style={[st.chipSub, selected && { color: C.accentText }]}>{sub}</Text>
      ) : null}
    </Pressable>
  );
}

export function StatusTag({ status }: { status: Status }) {
  const s = STATUS[status];
  return <Tag label={s.label} cor={s.cor} />;
}

export function Tag({ label, cor, icon }: { label: string; cor: string; icon?: IconName }) {
  return (
    <View style={[st.tag, { borderColor: cor }]}>
      {icon && <Ionicons name={icon} size={12} color={cor} />}
      <Text style={[st.tagText, { color: cor }]}>{label}</Text>
    </View>
  );
}

export function Field({ label, style, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: S.xs }}>
      <Text style={st.label}>{label}</Text>
      <TextInput
        placeholderTextColor={C.placeholder}
        style={[st.input, props.multiline && { minHeight: 130, textAlignVertical: 'top' }, style]}
        {...props}
      />
    </View>
  );
}

export function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: S.sm }}>
      <View style={st.sectionHead}>
        <Text style={st.sectionTitle}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Empty({ icon, title, subtitle }: { icon: IconName; title: string; subtitle?: string }) {
  return (
    <View style={st.empty}>
      <Ionicons name={icon} size={36} color={C.muted} />
      <Text style={st.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={st.emptySub}>{subtitle}</Text> : null}
    </View>
  );
}

export function Aviso({ icon = 'alert-circle', cor = C.warning, children }: { icon?: IconName; cor?: string; children: ReactNode }) {
  return (
    <View style={[st.aviso, { borderColor: cor }]}>
      <Ionicons name={icon} size={20} color={cor} />
      <Text style={st.avisoText}>{children}</Text>
    </View>
  );
}

export const st = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    padding: S.lg,
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
  btn: {
    minHeight: 48,
    borderRadius: R.md,
    borderWidth: 1.5,
    paddingHorizontal: S.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
  },
  btnText: T.button,
  chip: {
    minHeight: TOQUE,
    paddingHorizontal: S.md,
    paddingVertical: S.sm,
    borderRadius: R.md,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSel: { backgroundColor: C.accent, borderColor: C.accent },
  chipOff: { opacity: 0.45 },
  chipText: { ...T.bodyStrong, color: C.text },
  chipSub: { ...T.caption, fontWeight: '400', color: C.muted, marginTop: S.xxs },
  riscado: { textDecorationLine: 'line-through' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    borderWidth: 1,
    borderRadius: R.pill,
    paddingHorizontal: S.sm,
    paddingVertical: S.xxs,
    alignSelf: 'flex-start',
  },
  tagText: { ...T.caption, fontWeight: '700' },
  label: { ...T.label, color: C.muted },
  input: {
    backgroundColor: C.surface2,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    ...T.input,
    color: C.text,
    paddingHorizontal: S.md,
    paddingVertical: S.md,
    minHeight: 48,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: {
    ...T.label,
    fontWeight: '700',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  empty: { alignItems: 'center', paddingVertical: S.xxl, gap: S.sm },
  emptyTitle: { ...T.input, fontWeight: '600', color: C.text },
  emptySub: { ...T.small, color: C.muted, textAlign: 'center', maxWidth: 280 },
  aviso: {
    flexDirection: 'row',
    gap: S.sm,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: R.md,
    padding: S.md,
    backgroundColor: C.surface,
  },
  avisoText: { ...T.small, color: C.text, flex: 1, lineHeight: 20 },
  h1: { ...T.h1, color: C.text },
  h2: { ...T.h2, color: C.text },
  muted: { ...T.small, color: C.muted },
  body: { ...T.body, color: C.text },
  dica: { ...T.label, fontWeight: '400', color: C.muted, lineHeight: 18 },
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: S.lg, gap: S.xl, paddingBottom: 120 },
});
