import { describe, it, expect } from 'vitest';
import { Program, Status } from '@prisma/client';
import { computeStatus } from '../statusCalculator';

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

  it('AZUL: pendente por 60 dias após changeDate; depois depende se é novo/antigo', () => {
    const issue = new Date('2024-01-01');
    const change = new Date('2024-12-20');
    expect(computeStatus(Program.AZUL, issue, change, new Date('2025-02-10'))).toBe(Status.PENDENTE);
    // Após ~60 dias
    expect(computeStatus(Program.AZUL, issue, change, new Date('2025-02-20'), true)).toBe(Status.UTILIZADO);
    expect(computeStatus(Program.AZUL, issue, change, new Date('2025-02-20'), false)).toBe(Status.LIBERADO);
  });
});
