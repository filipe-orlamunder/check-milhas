// src/utils/validators.ts
export function isNameValid(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (trimmed.length < 4 || trimmed.length > 60) return false;
  // aceita letras (incluindo acentos), espaços, hífen e apóstrofo
  return /^[A-Za-zÀ-ÖØ-öø-ÿ'\-\s]+$/.test(trimmed);
}

export function isCpfValid(cpf: string): boolean {
  if (!cpf) return false;
  return /^\d{11}$/.test(cpf);
}

export function isEmailValid(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
