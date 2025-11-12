import { describe, it, expect } from 'vitest';
import { dateOnlyInBrazil, startOfDayBR, getBrazilDateParts } from '../timezone';

// Esses testes validam que ao construir datas via helpers, o dia Brasil permanece estável em ambiente UTC.

describe('server/utils/timezone', () => {
  it('dateOnlyInBrazil preserva dia', () => {
    const d = dateOnlyInBrazil('2025-11-10');
    const { year, month, day } = getBrazilDateParts(d);
    expect(year).toBe(2025);
    expect(month).toBe(11);
    expect(day).toBe(10);
  });

  it('startOfDayBR normaliza horário equivalente a meia-noite Brasil', () => {
    const any = new Date('2025-11-10T15:23:00Z');
    const s = startOfDayBR(any);
    const { day } = getBrazilDateParts(s);
    expect(day).toBe(10);
    // Horário UTC deve ser 03:00:00 (aprox midnight UTC-3)
    expect(s.getUTCHours()).toBe(3);
    expect(s.getUTCMinutes()).toBe(0);
  });
});
