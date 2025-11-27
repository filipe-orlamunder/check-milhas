import type { Program as ProgramEnum, Status as StatusEnum } from "@prisma/client";
import * as Prisma from "@prisma/client";
import { nowInBrazil } from "./timezone";

const fallbackProgram = {
  LATAM: "LATAM",
  SMILES: "SMILES",
  AZUL: "AZUL",
} as const satisfies Record<string, ProgramEnum>;

const fallbackStatus = {
  UTILIZADO: "UTILIZADO",
  LIBERADO: "LIBERADO",
  PENDENTE: "PENDENTE",
} as const satisfies Record<string, StatusEnum>;

const Program = (Prisma as Partial<typeof Prisma>).Program ?? fallbackProgram;
const Status = (Prisma as Partial<typeof Prisma>).Status ?? fallbackStatus;

/**
 * Calcula o status de um beneficiário com base no programa e nas datas de emissão/alteração.
 * @param program O programa de fidelidade (LATAM, SMILES, AZUL).
 * @param issueDate A data de emissão/inclusão do beneficiário.
 * @param changeDate A data de alteração mais recente (opcional, relevante para AZUL).
 * @returns O status calculado (UTILIZADO, LIBERADO, PENDENTE).
 */
export function computeStatus(
  program: ProgramEnum,
  issueDate: Date,
  changeDate?: Date | null
): StatusEnum {
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