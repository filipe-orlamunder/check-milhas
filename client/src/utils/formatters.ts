/**
 * Utilitários de formatação de strings e documentos.
 */

/** Remove todos os caracteres não numéricos. */
export const onlyDigits = (s: string) => s.replace(/\D/g, "");

/**
 * Formata um CPF no padrão XXX.XXX.XXX-XX.
 * Mantém o valor original caso não tenha exatamente 11 dígitos.
 */
export const formatCPF = (cpf: string): string => {
  const d = onlyDigits(cpf ?? "");
  if (d.length !== 11) return cpf ?? "";
  return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
};
