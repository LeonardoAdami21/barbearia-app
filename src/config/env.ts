/**
 * Variáveis de ambiente do app. O Expo só embute variáveis EXPO_PUBLIC_* e
 * apenas quando acessadas de forma estática (process.env.EXPO_PUBLIC_X).
 * https://docs.expo.dev/guides/environment-variables/
 */
export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
} as const;
