const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_LONGOS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const hoje = () => toISO(new Date());

export function addDias(iso: string, n: number) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export const diaSemanaCurto = (iso: string) => DIAS[fromISO(iso).getDay()];
export const diaDoMes = (iso: string) => fromISO(iso).getDate();
export const mesCurto = (iso: string) => MESES[fromISO(iso).getMonth()];

/** "Hoje", "Amanhã" ou "Qui, 05/11" */
export function rotuloDia(iso: string) {
  if (iso === hoje()) return 'Hoje';
  if (iso === addDias(hoje(), 1)) return 'Amanhã';
  if (iso === addDias(hoje(), -1)) return 'Ontem';
  const d = fromISO(iso);
  return `${DIAS[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/** "quinta, 05/11" — usado nas mensagens de WhatsApp */
export function dataParaMensagem(iso: string) {
  if (iso === hoje()) return 'hoje';
  if (iso === addDias(hoje(), 1)) return 'amanhã';
  const d = fromISO(iso);
  return `${DIAS_LONGOS[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

export function horaParaMin(hora: string) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export const minParaHora = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

export const horaValida = (hora: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);

export function gerarHorarios(abertura: string, fechamento: string, intervalo: number) {
  const lista: string[] = [];
  if (!horaValida(abertura) || !horaValida(fechamento) || intervalo < 5) return lista;
  for (let m = horaParaMin(abertura); m < horaParaMin(fechamento); m += intervalo) {
    lista.push(minParaHora(m));
  }
  return lista;
}

export function jaPassou(data: string, hora: string) {
  const agora = new Date();
  const d = fromISO(data);
  const min = horaParaMin(hora);
  d.setHours(Math.floor(min / 60), min % 60);
  return d.getTime() < agora.getTime();
}
