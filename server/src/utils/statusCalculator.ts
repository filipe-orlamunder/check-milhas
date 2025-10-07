// src/utils/statusCalculator.ts
import { Program, Status } from "@prisma/client";

/**
 * Calcula o status de um beneficiário com base em:
 * - program: LATAM | SMILES | AZUL
 * - issueDate: data do cadastro/emissão
 * - changeDate: se houve alteração (aplica para AZUL)
 * - refDate: data de referência (para validar liberado até tal data)
 */
export function computeStatus(
  program: Program,
  issueDate: Date,
  changeDate: Date | null = null,
  refDate: Date = new Date()
): Status {
  if (program === "LATAM") {
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    return (refDate.getTime() - issueDate.getTime()) < oneYearMs ? Status.UTILIZADO : Status.LIBERADO;
  }

  if (program === "SMILES") {
    const endOfYear = new Date(issueDate.getFullYear(), 11, 31, 23, 59, 59);
    return refDate <= endOfYear ? Status.UTILIZADO : Status.LIBERADO;
  }

  if (program === "AZUL") {
    if (changeDate) {
      const finish = new Date(changeDate.getTime() + 60 * 24 * 60 * 60 * 1000);
      return refDate < finish ? Status.PENDENTE : Status.LIBERADO;
    }
    return Status.UTILIZADO;
  }

  return Status.UTILIZADO;
}
