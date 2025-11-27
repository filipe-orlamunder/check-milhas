import { describe, it, expect } from 'vitest';
import type { Program as ProgramEnum, Status as StatusEnum } from '@prisma/client';
import * as Prisma from '@prisma/client';
import { computeStatus } from '../statusCalculator';

const fallbackProgram = {
  LATAM: 'LATAM',
  SMILES: 'SMILES',
  AZUL: 'AZUL',
} as const satisfies Record<string, ProgramEnum>;

const fallbackStatus = {
  UTILIZADO: 'UTILIZADO',
  LIBERADO: 'LIBERADO',
  PENDENTE: 'PENDENTE',
} as const satisfies Record<string, StatusEnum>;

const Program = Prisma.Program ?? fallbackProgram;
const Status = Prisma.Status ?? fallbackStatus;

describe('server/utils/statusCalculator.computeStatus', () => {
  it('LATAM: libera após 12 meses da issueDate', () => {
    const issue = new Date('2024-06-01');
    expect(computeStatus(Program.LATAM, issue, null, new Date('2025-05-31'))).toBe(Status.UTILIZADO);
    expect(computeStatus(Program.LATAM, issue, null, new Date('2025-06-01'))).toBe(Status.LIBERADO);
  });

  it('SMILES: libera no 1º de janeiro do ano seguinte', () => {
    const issue = new Date('2024-10-10');
    expect(computeStatus(Program.SMILES, issue, null, new Date('2024-12-31'))).toBe(Status.UTILIZADO);
    // Usa Date local para evitar diferenças de fuso
    expect(computeStatus(Program.SMILES, issue, null, new Date(2025, 0, 1))).toBe(Status.LIBERADO);
  });

  it('AZUL: pendente por 30 dias após changeDate; depois depende se é novo/antigo', () => {
    const issue = new Date('2024-01-01');
    const change = new Date('2024-12-20');
    expect(computeStatus(Program.AZUL, issue, change, new Date('2025-01-10'))).toBe(Status.PENDENTE);
    // Após ~30 dias
    expect(computeStatus(Program.AZUL, issue, change, new Date('2025-01-21'), true)).toBe(Status.UTILIZADO);
    expect(computeStatus(Program.AZUL, issue, change, new Date('2025-01-21'), false)).toBe(Status.LIBERADO);
  });
});
