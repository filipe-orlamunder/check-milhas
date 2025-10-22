import { Program, Status } from "@prisma/client";

/**
 * Calcula o status de utilização de um beneficiário com base nas regras do programa.
 *
 * NOTA: Esta função utiliza a data atual (`new Date()`) como referência.
 * @param program O programa de fidelidade (LATAM, SMILES, AZUL).
 * @param issueDate Data de inclusão/emissão do beneficiário.
 * @param changeDate Data da última alteração (relevante apenas para AZUL).
 * @returns O status calculado.
 */
export function computeStatus(program: Program, issueDate: Date, changeDate?: Date | null): Status {
  // Define a data atual como ponto de referência para todos os cálculos.
  const now = new Date();

  if (program === "LATAM") {
    // LATAM: Status UTILIZADO durante 1 ano a partir da issueDate.
    const oneYear = new Date(issueDate);
    oneYear.setFullYear(oneYear.getFullYear() + 1);
    return now < oneYear ? "UTILIZADO" : "LIBERADO";
  }

  if (program === "SMILES") {
    // SMILES: Liberado se a emissão ocorreu em um ano anterior ao ano atual.
    if (issueDate.getFullYear() < now.getFullYear()) return "LIBERADO";
    // UTILIZADO até 1º de janeiro do ano seguinte.
    const resetDate = new Date(issueDate.getFullYear() + 1, 0, 1);
    return now < resetDate ? "UTILIZADO" : "LIBERADO";
  }

  if (program === "AZUL") {
    // AZUL: Regra de PENDENTE (60 dias) após uma alteração.
    if (changeDate) {
      // 60 dias em milissegundos.
      const finish = new Date(changeDate.getTime() + 60 * 24 * 60 * 60 * 1000);
      return now < finish ? "PENDENTE" : "LIBERADO";
    }
    // Caso padrão sem alteração: UTILIZADO.
    return "UTILIZADO";
  }

  return "UTILIZADO";
}

/**
 * Valida se a string fornecida contém exatamente 11 dígitos.
 * @param cpf A string a ser validada.
 * @returns Verdadeiro se o CPF for válido (11 dígitos).
 */
export function isCpfValid(cpf: string) {
  return /^\d{11}$/.test(cpf);
}
