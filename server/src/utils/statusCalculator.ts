import { Program, Status } from "@prisma/client";

/**
 * Calcula o Status de fidelidade de um beneficiário com base nas regras do programa.
 *
 * @param program Programa de fidelidade (LATAM, SMILES, AZUL).
 * @param issueDate Data original de inclusão do beneficiário.
 * @param changeDate Data da última alteração (relevante apenas para AZUL).
 * @param refDate Data de referência para o cálculo (padrão: hoje).
 * @param isNewForAzul Indica se é o novo beneficiário na troca (afeta o status pós-PENDENTE no AZUL).
 * @returns O status calculado: LIBERADO, UTILIZADO ou PENDENTE.
 */
export function computeStatus(
  program: Program,
  issueDate: Date,
  changeDate: Date | null = null,
  refDate: Date = new Date(),
  isNewForAzul: boolean = false
): Status {
  // A data de referência é usada para todas as decisões de tempo.
  if (program === "LATAM") {
    // LATAM: Status UTILIZADO durante 12 meses.
    const oneYear = new Date(issueDate);
    oneYear.setFullYear(oneYear.getFullYear() + 1);
    return refDate < oneYear ? Status.UTILIZADO : Status.LIBERADO;
  }

  if (program === "SMILES") {
    // SMILES: UTILIZADO até o final do ano civil da issueDate.
    if (issueDate.getFullYear() < refDate.getFullYear()) return Status.LIBERADO;
    const resetDate = new Date(issueDate.getFullYear() + 1, 0, 1); // 1º Jan do ano seguinte.
    return refDate < resetDate ? Status.UTILIZADO : Status.LIBERADO;
  }

  if (program === "AZUL") {
    // AZUL: Lógica complexa de alteração.
    if (changeDate) {
      // Se houver troca, o status fica PENDENTE por 60 dias a partir da changeDate.
      const finish = new Date(changeDate.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 dias em milissegundos
      if (refDate < finish) return Status.PENDENTE;
      
      // Após 60 dias, o substituto fica UTILIZADO, e o substituído, LIBERADO.
      return isNewForAzul ? Status.UTILIZADO : Status.LIBERADO;
    }

    // Caso padrão sem troca: o beneficiário está UTILIZADO.
    return Status.UTILIZADO;
  }

  return Status.UTILIZADO;
}
