import { randomUUID } from "crypto";

export type Program = "LATAM" | "SMILES" | "AZUL";
export type Status = "UTILIZADO" | "LIBERADO" | "PENDENTE";

export interface Beneficiary {
  id: string;
  program: Program;
  name: string;
  cpf: string;
  issueDate: Date;
  status: Status;
  // campos para Azul (alteração)
  previousName?: string;
  previousCpf?: string;
  previousDate?: Date;
  changeDate?: Date;
}

// estrutura em memória: userId -> lista de beneficiários
export const beneficiariesStore: Record<string, Beneficiary[]> = {};

// função util para criar ID
export function generateId() {
  return randomUUID();
}
