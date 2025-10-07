import { Program, Status } from "@prisma/client";

export function computeStatus(program: Program, issueDate: Date, changeDate?: Date | null): Status {
  const now = new Date();

  if (program === "LATAM") {
    const oneYearMs = 1000 * 60 * 60 * 24 * 365;
    return (now.getTime() - issueDate.getTime()) < oneYearMs ? "UTILIZADO" : "LIBERADO";
  }

  if (program === "SMILES") {
    const endOfYear = new Date(issueDate.getFullYear(), 11, 31, 23, 59, 59);
    return now <= endOfYear ? "UTILIZADO" : "LIBERADO";
  }

  if (program === "AZUL") {
    if (changeDate) {
      const finish = new Date(changeDate.getTime() + 60 * 24 * 60 * 60 * 1000);
      return now < finish ? "PENDENTE" : "LIBERADO";
    }
    return "UTILIZADO";
  }

  return "UTILIZADO";
}

export function isCpfValid(cpf: string) {
  return /^\d{11}$/.test(cpf);
}
