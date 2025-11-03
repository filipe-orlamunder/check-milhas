import { describe, it, expect } from 'vitest';
import { onlyDigits, formatCPF } from '../formatters';

describe('utils/formatters', () => {
  it('onlyDigits remove não numéricos', () => {
    expect(onlyDigits('a1b2c3')).toBe('123');
    expect(onlyDigits('011.222.333-44')).toBe('01122233344');
    expect(onlyDigits('')).toBe('');
  });

  it('formatCPF formata CPF válido e preserva inválido', () => {
    expect(formatCPF('01122233344')).toBe('011.222.333-44');
    // Mantém se tamanho != 11
    expect(formatCPF('123')).toBe('123');
    // Mantém vazio
    expect(formatCPF('')).toBe('');
    // Strings com símbolos são normalizadas internamente
    expect(formatCPF('011.222.333-44')).toBe('011.222.333-44');
  });
});
