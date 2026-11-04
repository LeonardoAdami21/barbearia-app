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

import { C, R, S, STATUS } from '@/constants/theme';
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
  whatsapp: { bg: C.whatsapp, fg: '#06260F', borda: C.whatsapp },
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
        placeholderTextColor="#6E6A63"
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
  btnText: { fontSize: 16, fontWeight: '700' },
  chip: {
    minHeight: 44,
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
  chipOff: { opacity: 0.35 },
  chipText: { color: C.text, fontSize: 15, fontWeight: '600' },
  chipSub: { color: C.muted, fontSize: 12, marginTop: 2 },
  riscado: { textDecorationLine: 'line-through' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: R.pill,
    paddingHorizontal: S.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  tagText: { fontSize: 12, fontWeight: '700' },
  label: { color: C.muted, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: C.surface2,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    fontSize: 16,
    paddingHorizontal: S.md,
    paddingVertical: S.md,
    minHeight: 48,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: {
    color: C.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  empty: { alignItems: 'center', paddingVertical: 40, gap: S.sm },
  emptyTitle: { color: C.text, fontSize: 16, fontWeight: '600' },
  emptySub: { color: C.muted, fontSize: 14, textAlign: 'center', maxWidth: 280 },
  aviso: {
    flexDirection: 'row',
    gap: S.sm,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: R.md,
    padding: S.md,
    backgroundColor: C.surface,
  },
  avisoText: { color: C.text, fontSize: 14, flex: 1, lineHeight: 20 },
  h1: { color: C.text, fontSize: 28, fontWeight: '800' },
  h2: { color: C.text, fontSize: 18, fontWeight: '700' },
  muted: { color: C.muted, fontSize: 14 },
  body: { color: C.text, fontSize: 15 },
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: S.lg, gap: S.xl, paddingBottom: 120 },
});
