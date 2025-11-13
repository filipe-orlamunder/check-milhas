import { Program, Status } from "@prisma/client";
import { nowInBrazil } from "./timezone";

/**
 * Calcula o status de um beneficiário com base no programa e nas datas de emissão/alteração.
 * @param program O programa de fidelidade (LATAM, SMILES, AZUL).
 * @param issueDate A data de emissão/inclusão do beneficiário.
 * @param changeDate A data de alteração mais recente (opcional, relevante para AZUL).
 * @returns O status calculado (UTILIZADO, LIBERADO, PENDENTE).
 */
export function computeStatus(program: Program, issueDate: Date, changeDate?: Date | null): Status {
  const now = nowInBrazil();

  if (program === "LATAM") {
    const oneYear = new Date(issueDate);
    oneYear.setFullYear(oneYear.getFullYear() + 1);
    return now < oneYear ? Status.UTILIZADO : Status.LIBERADO;
  }

  if (program === "SMILES") {
    if (issueDate.getFullYear() < now.getFullYear()) return Status.LIBERADO;
    const resetDate = new Date(issueDate.getFullYear() + 1, 0, 1);
    return now < resetDate ? Status.UTILIZADO : Status.LIBERADO;
  }

  if (program === "AZUL") {
    if (changeDate) {
      const finish = new Date(changeDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      return now < finish ? Status.PENDENTE : Status.LIBERADO;
    }
    return Status.UTILIZADO;
  }

  return Status.UTILIZADO;
}

/**
 * Valida se a string fornecida corresponde a um CPF de 11 dígitos.
 * @param cpf A string a ser validada.
 * @returns true se o CPF for válido (apenas 11 dígitos numéricos), false caso contrário.
 */
export function isCpfValid(cpf: string) {
  return /^\d{11}$/.test(cpf);
}