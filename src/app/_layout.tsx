import { DarkTheme, SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { C } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { StoreProvider } from '@/store/store';

// Mantém a splash visível até sabermos se existe uma sessão salva.
void SplashScreen.preventAutoHideAsync();

const tema = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.bg, card: C.surface, primary: C.accent, text: C.text, border: C.border },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={tema}>
      <AuthProvider>
        <StoreProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { status } = useAuth();

  if (status === 'loading') return null;
  SplashScreen.hide();

  const logado = status === 'signedIn';

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: C.surface },
        headerTintColor: C.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: C.bg },
      }}>
      {/* Ao entrar ou sair, o Expo Router troca de grupo sozinho. */}
      <Stack.Protected guard={logado}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="agendamento/novo" options={{ title: 'Novo agendamento', presentation: 'modal' }} />
        <Stack.Screen name="agendamento/[id]" options={{ title: 'Agendamento' }} />
        <Stack.Screen name="cliente/novo" options={{ title: 'Novo cliente', presentation: 'modal' }} />
        <Stack.Screen name="cliente/[id]" options={{ title: 'Cliente' }} />
        <Stack.Screen name="conta/seguranca" options={{ title: 'Segurança' }} />
      </Stack.Protected>

      <Stack.Protected guard={!logado}>
        <Stack.Screen name="entrar" options={{ headerShown: false }} />
        <Stack.Screen name="cadastro" options={{ title: '', headerTransparent: true, headerBackTitle: 'Entrar' }} />
        <Stack.Screen name="verificacao" options={{ title: '', headerTransparent: true, gestureEnabled: false }} />
      </Stack.Protected>
    </Stack>
  );
}
