import { Alert, Platform } from 'react-native';

/** Pergunta de confirmação que funciona no celular e no navegador. */
export function confirmar(titulo: string, mensagem: string, onOk: () => void, rotuloOk = 'Confirmar') {
  if (Platform.OS === 'web') {
    const ok = (globalThis as { confirm?: (m: string) => boolean }).confirm?.(`${titulo}\n\n${mensagem}`);
    if (ok) onOk();
    return;
  }
  Alert.alert(titulo, mensagem, [
    { text: 'Voltar', style: 'cancel' },
    { text: rotuloOk, style: 'destructive', onPress: onOk },
  ]);
}

export function avisar(titulo: string, mensagem: string) {
  if (Platform.OS === 'web') {
    (globalThis as { alert?: (m: string) => void }).alert?.(`${titulo}\n\n${mensagem}`);
    return;
  }
  Alert.alert(titulo, mensagem);
}
