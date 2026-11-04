import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { C } from '@/constants/theme';
import { StoreProvider } from '@/store/store';

const tema = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.bg, card: C.surface, primary: C.accent, text: C.text, border: C.border },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={tema}>
      <StoreProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: C.surface },
            headerTintColor: C.text,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: C.bg },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="agendamento/novo" options={{ title: 'Novo agendamento', presentation: 'modal' }} />
          <Stack.Screen name="agendamento/[id]" options={{ title: 'Agendamento' }} />
          <Stack.Screen name="cliente/novo" options={{ title: 'Novo cliente', presentation: 'modal' }} />
          <Stack.Screen name="cliente/[id]" options={{ title: 'Cliente' }} />
        </Stack>
      </StoreProvider>
    </ThemeProvider>
  );
}
