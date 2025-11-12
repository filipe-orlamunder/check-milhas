const BRAZIL_TZ = 'America/Sao_Paulo';

/** Retorna um Date representando o "agora" já alinhado ao fuso de Brasília. */
export function nowInBrazil(): Date {
  // new Date() sempre cria em UTC interno; para comparar dias do Brasil usamos formatação.
  return new Date();
}

/** Converte um Date para componentes (ano, mes, dia) segundo America/Sao_Paulo. */
export function getBrazilDateParts(d: Date) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: BRAZIL_TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = fmt.format(d).split('-');
  return { year: Number(parts[0]), month: Number(parts[1]), day: Number(parts[2]) };
}

/** Cria um Date preservando o dia calendário Brasil fornecido (YYYY-MM-DD). */
export function dateOnlyInBrazil(input: string): Date {
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return new Date(input);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  // Construção em local machine: new Date(y, mo-1, d) assume fuso local; para neutralidade criamos UTC e deixamos prisma salvar UTC.
  // Usamos Date.UTC para evitar offset do host.
  return new Date(Date.UTC(y, mo - 1, d, 3, 0, 0)); // 03:00 UTC ≈ meia-noite Brasília (UTC-3)
}

/** Normaliza para início do dia Brasil (00:00:00 America/Sao_Paulo). */
export function startOfDayBR(d: Date): Date {
  const { year, month, day } = getBrazilDateParts(d);
  return new Date(Date.UTC(year, month - 1, day, 3, 0, 0)); // 03:00 UTC corresponde a 00:00 BR.
}

/** Diferença em dias de calendário Brasil entre duas datas. */
export function diffBrazilDays(a: Date, b: Date): number {
  const aStart = startOfDayBR(a).getTime();
  const bStart = startOfDayBR(b).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((aStart - bStart) / dayMs);
}

export function addBrazilMonths(d: Date, months: number): Date {
  const { year, month, day } = getBrazilDateParts(d);
  const newMonthIndex = month - 1 + months;
  const y = year + Math.floor(newMonthIndex / 12);
  const m = (newMonthIndex % 12 + 12) % 12; // normaliza
  return new Date(Date.UTC(y, m, day, 3, 0, 0));
}

export function addBrazilYears(d: Date, years: number): Date {
  const { year, month, day } = getBrazilDateParts(d);
  return new Date(Date.UTC(year + years, month - 1, day, 3, 0, 0));
}

export { BRAZIL_TZ };
