import { describe, it, expect } from 'vitest';
import { computeStatus, daysRemainingForAzul } from '../statusCalculator';

describe('utils/statusCalculator', () => {
  it('LATAM: libera após 1 ano', () => {
    const issue = '2024-07-10';
    expect(computeStatus('latam', issue, null, new Date('2024-12-31'))).toBe('Utilizado');
    expect(computeStatus('latam', issue, null, new Date('2025-07-11'))).toBe('Liberado');
  });

  it('SMILES: libera no 1º de janeiro do ano seguinte', () => {
    const issue = '2024-06-20';
    expect(computeStatus('smiles', issue, null, new Date('2024-12-31'))).toBe('Utilizado');
    // Use Date local para evitar fuso horário ao criar a data de referência
    expect(computeStatus('smiles', issue, null, new Date(2025, 0, 1))).toBe('Liberado');
  });

  it('AZUL: pendente por 30 dias a partir de changeDate', () => {
    const change = '2024-12-15';
    expect(computeStatus('azul', '2024-01-01', change, new Date('2025-01-10'))).toBe('Pendente');
    // 30 dias após 2024-12-15 -> 2025-01-14 (aprox). Em 2025-01-15 não está mais pendente.
    expect(computeStatus('azul', '2024-01-01', change, new Date('2025-01-15'), true)).toBe('Utilizado');
    expect(computeStatus('azul', '2024-01-01', change, new Date('2025-01-15'), false)).toBe('Liberado');
  });

  it('AZUL: daysRemainingForAzul retorna 0 se não houver changeDate', () => {
    expect(daysRemainingForAzul(null)).toBe(0);
  });

  it('AZUL: daysRemainingForAzul retorna número não negativo', () => {
    // Data já no passado -> 0
    expect(daysRemainingForAzul('2024-01-01')).toBe(0);
  });
});
