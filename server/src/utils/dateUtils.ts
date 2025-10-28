// src/utils/dateUtils.ts
// Pequeno util para parsear strings no formato YYYY-MM-DD como data local 
export function parseDateOnlyToLocal(input: string | Date | undefined): Date {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  const s = input as string;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    return new Date(y, mo - 1, d);
  }
  return new Date(s);
}

export default parseDateOnlyToLocal;
