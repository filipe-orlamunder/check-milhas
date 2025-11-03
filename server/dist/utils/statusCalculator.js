"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeStatus = computeStatus;
const client_1 = require("@prisma/client");
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
function computeStatus(program, issueDate, changeDate = null, refDate = new Date(), isNewForAzul = false) {
    if (program === "LATAM") {
        // LATAM: Status Liberado após 12 meses da issueDate.
        const oneYear = new Date(issueDate);
        oneYear.setFullYear(oneYear.getFullYear() + 1);
        return refDate < oneYear ? client_1.Status.UTILIZADO : client_1.Status.LIBERADO;
    }
    if (program === "SMILES") {
        // SMILES: Status Liberado no 1º de Janeiro do ano seguinte à issueDate.
        if (issueDate.getFullYear() < refDate.getFullYear())
            return client_1.Status.LIBERADO;
        const resetDate = new Date(issueDate.getFullYear() + 1, 0, 1);
        return refDate < resetDate ? client_1.Status.UTILIZADO : client_1.Status.LIBERADO;
    }
    if (program === "AZUL") {
        // AZUL: Lógica de status PENDENTE baseada em changeDate (60 dias).
        if (changeDate) {
            // 60 dias em milissegundos
            const finish = new Date(changeDate.getTime() + 60 * 24 * 60 * 60 * 1000);
            if (refDate < finish)
                return client_1.Status.PENDENTE;
            // Após o período PENDENTE, o status depende se é o novo (UTILIZADO) ou o antigo (LIBERADO) beneficiário.
            return isNewForAzul ? client_1.Status.UTILIZADO : client_1.Status.LIBERADO;
        }
        // Padrão: UTILIZADO se não houver changeDate.
        return client_1.Status.UTILIZADO;
    }
    // Retorno padrão para programas não mapeados (ou como fallback).
    return client_1.Status.UTILIZADO;
}
