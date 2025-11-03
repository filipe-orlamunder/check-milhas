import { describe, it, expect, vi } from 'vitest';
import { computeStatus, isCpfValid } from '../beneficiaryUtils';
import { Program } from '@prisma/client';

describe('server/utils/beneficiaryUtils', () => {
  it('isCpfValid aceita apenas 11 dígitos', () => {
    expect(isCpfValid('12345678901')).toBe(true);
    expect(isCpfValid('123.456.789-01')).toBe(false);
    expect(isCpfValid('')).toBe(false);
  });

  it('computeStatus LATAM/SMILES/AZUL (básico, com data atual)', () => {
    const now = new Date(2025, 0, 1);
    vi.setSystemTime(now);

    // LATAM
    expect(computeStatus(Program.LATAM, new Date('2024-12-15'))).toBe('UTILIZADO');
    expect(computeStatus(Program.LATAM, new Date('2023-12-15'))).toBe('LIBERADO');

    // SMILES
  expect(computeStatus(Program.SMILES, new Date('2024-06-01'))).toBe('LIBERADO');

    // AZUL
    expect(computeStatus(Program.AZUL, new Date('2024-06-01'))).toBe('UTILIZADO');
    // Com changeDate recente -> PENDENTE
    expect(computeStatus(Program.AZUL, new Date('2024-06-01'), new Date('2024-12-10'))).toBe('PENDENTE');
  });
});
