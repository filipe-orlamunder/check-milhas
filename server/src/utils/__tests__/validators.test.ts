import { describe, it, expect } from 'vitest';
import { isNameValid, isCpfValid, isEmailValid } from '../validators';

describe('server/utils/validators', () => {
  it('valida nomes', () => {
    expect(isNameValid('João Silva')).toBe(true);
    expect(isNameValid(' a ')).toBe(false);
    expect(isNameValid('Nome-Composto')).toBe(true);
  });

  it('valida CPF simples (somente 11 dígitos)', () => {
    expect(isCpfValid('12345678901')).toBe(true);
    expect(isCpfValid('123.456.789-01')).toBe(false);
    expect(isCpfValid('')).toBe(false);
  });

  it('valida e-mail simples', () => {
    expect(isEmailValid('a@b.com')).toBe(true);
    expect(isEmailValid('a@b')).toBe(false);
  });
});
