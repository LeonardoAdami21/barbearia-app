import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Estende o app.json com o que depende de variáveis de ambiente.
 *
 * Login com Google no iOS: o plugin precisa do "iOS URL scheme" do cliente OAuth do tipo iOS
 * (Google Cloud Console → Credenciais → ID do cliente iOS → "Esquema de URL do iOS").
 * Sem a variável o plugin fica de fora: o Android funciona igual e o iOS só não terá o botão do Google.
 * Em builds do EAS, defina a variável no ambiente do EAS (eas env:create) ou no eas.json.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const iosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME;
  return {
    ...config,
    name: config.name ?? 'Barbearia',
    slug: config.slug ?? 'barbearia-app',
    plugins: [
      ...(config.plugins ?? []),
      ...(iosUrlScheme
        ? [['@react-native-google-signin/google-signin', { iosUrlScheme }] as [string, unknown]]
        : []),
    ],
  };
};
