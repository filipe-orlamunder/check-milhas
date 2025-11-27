import { describe, it, expect, vi } from 'vitest';
import { computeStatus, isCpfValid } from '../beneficiaryUtils';
import type { Program as ProgramEnum } from '@prisma/client';
import * as Prisma from '@prisma/client';

const fallbackProgram = {
  LATAM: 'LATAM',
  SMILES: 'SMILES',
  AZUL: 'AZUL',
} as const satisfies Record<string, ProgramEnum>;

const Program = (Prisma as Partial<typeof Prisma>).Program ?? fallbackProgram;

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
