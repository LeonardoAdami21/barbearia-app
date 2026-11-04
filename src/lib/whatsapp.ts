import { Linking } from 'react-native';

/** Deixa só os dígitos e adiciona o DDI 55 quando o número vem com DDD. */
export function normalizarTelefone(telefone: string) {
  let d = telefone.replace(/\D/g, '').replace(/^0+/, '');
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return d;
}

export function telefoneValido(telefone: string) {
  const d = normalizarTelefone(telefone);
  return d.length >= 12 && d.length <= 13;
}

/** (27) 99999-9999 */
export function formatarTelefone(telefone: string) {
  let d = telefone.replace(/\D/g, '');
  if (d.startsWith('55') && d.length > 11) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return telefone;
}

/** Troca {nome}, {data}, {hora}, {servico} e {barbearia} pelos valores. */
export function preencherModelo(modelo: string, vars: Record<string, string>) {
  return modelo.replace(/\{(\w+)\}/g, (trecho, chave: string) => vars[chave] ?? trecho);
}

/**
 * Abre o WhatsApp com a mensagem pronta. O envio automático (sem tocar em
 * "enviar") vai precisar do backend com a API oficial do WhatsApp Business.
 */
export async function abrirWhatsApp(telefone: string, mensagem = '') {
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : '';
  await Linking.openURL(`https://wa.me/${normalizarTelefone(telefone)}${texto}`);
}
