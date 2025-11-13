import { Program, Status } from "@prisma/client";
import { nowInBrazil } from "./timezone";

/**
 * Calcula o status de um beneficiário com base nas regras do programa, datas de registro e uma data de referência.
 *
 * @param program O programa de fidelidade (LATAM, SMILES, AZUL).
 * @param issueDate A data de cadastro/emissão do beneficiário.
 * @param changeDate A data de alteração (relevante para AZUL). Padrão: null.
 * @param refDate A data de referência usada para a verificação de status. Padrão: data atual.
 * @param isNewForAzul Indica se este é o beneficiário substituto no fluxo de AZUL. Padrão: false.
 * @returns O status calculado (UTILIZADO, LIBERADO, PENDENTE).
 */
export function computeStatus(
  program: Program,
  issueDate: Date,
  changeDate: Date | null = null,
  refDate: Date = nowInBrazil(),
  isNewForAzul: boolean = false
): Status {
  if (program === "LATAM") {
    // LATAM: Status Liberado após 12 meses da issueDate.
    const oneYear = new Date(issueDate);
    oneYear.setFullYear(oneYear.getFullYear() + 1);
    return refDate < oneYear ? Status.UTILIZADO : Status.LIBERADO;
  }

  if (program === "SMILES") {
    // SMILES: Status Liberado no 1º de Janeiro do ano seguinte à issueDate.
    if (issueDate.getFullYear() < refDate.getFullYear()) return Status.LIBERADO;
    const resetDate = new Date(issueDate.getFullYear() + 1, 0, 1);
    return refDate < resetDate ? Status.UTILIZADO : Status.LIBERADO;
  }

  if (program === "AZUL") {
    // AZUL: Lógica de status PENDENTE baseada em changeDate (30 dias).
    if (changeDate) {
      // 30 dias em milissegundos
      const finish = new Date(changeDate.getTime() + 30 * 24 * 60 * 60 * 1000); 
      if (refDate < finish) return Status.PENDENTE;
      
      // Após o período PENDENTE, o status depende se é o novo (UTILIZADO) ou o antigo (LIBERADO) beneficiário.
      return isNewForAzul ? Status.UTILIZADO : Status.LIBERADO;
    }

    // Padrão: UTILIZADO se não houver changeDate.
    return Status.UTILIZADO;
  }

  // Retorno padrão para programas não mapeados (ou como fallback).
  return Status.UTILIZADO;
}