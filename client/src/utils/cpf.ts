import { onlyDigits } from "./formatters";

/**
 * Realiza a validação oficial de CPF, incluindo cálculo dos dígitos verificadores.
 */
export const isValidCPF = (input: string): boolean => {
  const digits = onlyDigits(input ?? "");
  if (digits.length !== 11) return false;

  // Rejeita sequências com todos os dígitos iguais (ex.: 00000000000)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const computeCheckDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i += 1) {
      sum += Number(digits[i]) * (length + 1 - i);
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstCheck = computeCheckDigit(9);
  if (firstCheck !== Number(digits[9])) return false;

  const secondCheck = computeCheckDigit(10);
  if (secondCheck !== Number(digits[10])) return false;

  return true;
};
