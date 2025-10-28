import { Program, Status } from "@prisma/client";

/**
 * Calcula o status de um beneficiário com base no programa e nas datas de emissão/alteração.
 * @param program O programa de fidelidade (LATAM, SMILES, AZUL).
 * @param issueDate A data de emissão/inclusão do beneficiário.
 * @param changeDate A data de alteração mais recente (opcional, relevante para AZUL).
 * @returns O status calculado (UTILIZADO, LIBERADO, PENDENTE).
 */
export function computeStatus(program: Program, issueDate: Date, changeDate?: Date | null): Status {
  const now = new Date();

  if (program === "LATAM") {
    // LATAM: Liberado após 1 ano da data de emissão.
    const oneYear = new Date(issueDate);
    oneYear.setFullYear(oneYear.getFullYear() + 1);
    return now < oneYear ? "UTILIZADO" : "LIBERADO";
  }

  if (program === "SMILES") {
    // SMILES: Liberado no início do ano seguinte à data de emissão.
    if (issueDate.getFullYear() < now.getFullYear()) return "LIBERADO";
    const resetDate = new Date(issueDate.getFullYear() + 1, 0, 1); // 1º de Janeiro do próximo ano
    return now < resetDate ? "UTILIZADO" : "LIBERADO";
  }

  if (program === "AZUL") {
    if (changeDate) {
      // AZUL: PENDENTE por 60 dias após a data de alteração (se houver).
      // 60 dias em milissegundos: 60 * 24 horas * 60 minutos * 60 segundos * 1000 ms
      const finish = new Date(changeDate.getTime() + 60 * 24 * 60 * 60 * 1000);
      return now < finish ? "PENDENTE" : "LIBERADO";
    }
    return "UTILIZADO";
  }

  return "UTILIZADO";
}

/**
 * Valida se a string fornecida corresponde a um CPF de 11 dígitos.
 * @param cpf A string a ser validada.
 * @returns true se o CPF for válido (apenas 11 dígitos numéricos), false caso contrário.
 */
export function isCpfValid(cpf: string) {
  return /^\d{11}$/.test(cpf);
}