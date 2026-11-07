import { Platform, TurboModuleRegistry } from 'react-native';

import { env } from '@/config/env';

/**
 * Login com Google via @react-native-google-signin/google-signin.
 *
 * A biblioteca tem código nativo: não existe no Expo Go, só em development build
 * (`npx expo run:android` ou `eas build --profile development`). Por isso ela é
 * carregada sob demanda e o botão some quando o módulo nativo não está disponível.
 */
export const googleDisponivel =
  Platform.OS !== 'web' &&
  !!env.googleWebClientId &&
  (Platform.OS !== 'ios' || !!env.googleIosClientId) &&
  TurboModuleRegistry.get('RNGoogleSignin') != null;

let configurado = false;

async function carregar() {
  const lib = await import('@react-native-google-signin/google-signin');
  if (!configurado) {
    lib.GoogleSignin.configure({
      // O idToken é emitido para o cliente WEB; é ele que a API confere como "audience".
      webClientId: env.googleWebClientId,
      iosClientId: env.googleIosClientId || undefined,
    });
    configurado = true;
  }
  return lib;
}

export class GoogleIndisponivelError extends Error {}

/** Abre a tela de contas do Google. Retorna o idToken, ou null se o usuário cancelou. */
export async function pedirIdTokenDoGoogle(): Promise<string | null> {
  if (!googleDisponivel) {
    throw new GoogleIndisponivelError('Login com Google indisponível neste app.');
  }
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = await carregar();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const resposta = await GoogleSignin.signIn();
    if (!isSuccessResponse(resposta)) return null;
    if (!resposta.data.idToken) throw new Error('O Google não retornou o idToken.');
    return resposta.data.idToken;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.IN_PROGRESS) return null;
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new GoogleIndisponivelError('Atualize o Google Play Services para entrar com o Google.');
      }
    }
    throw error;
  }
}

/** Esquece a conta Google escolhida, para o próximo login perguntar de novo. */
export async function sairDoGoogle() {
  if (!googleDisponivel) return;
  const { GoogleSignin } = await carregar();
  await GoogleSignin.signOut().catch(() => {});
}
