"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureProfileBelongsToUser = ensureProfileBelongsToUser;
exports.reconcileAzulPending = reconcileAzulPending;
// src/services/beneficiariesService.ts
// Regras de domínio e utilitários de beneficiários (sem alterar comportamento)
const prisma_1 = require("../prisma");
const client_1 = require("@prisma/client");
/**
 * Garante que o perfil exista e pertença ao usuário autenticado.
 */
async function ensureProfileBelongsToUser(profileId, userId) {
    const profile = await prisma_1.prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile)
        throw { status: 404, message: "Perfil não encontrado" };
    if (profile.userId !== userId)
        throw { status: 403, message: "Acesso negado" };
    return profile;
}
/**
 * Reconcilia alterações pendentes do programa AZUL.
 * - Finaliza alterações após 30 dias, removendo o antigo e consolidando o novo.
 * - Elimina registros órfãos antigos após 60 dias da changeDate.
 */
async function reconcileAzulPending(profileIdToCheck) {
    const dayMs = 24 * 60 * 60 * 1000;
    const pendingLimitDays = 30;
    const fallbackRemovalDays = 60;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const baseFilter = {
        program: "AZUL",
        status: "PENDENTE",
        ...(profileIdToCheck ? { profileId: profileIdToCheck } : {}),
    };
    // Novos registros (substitutos) criados em trocas, com previous* preenchido
    const pendingNew = await prisma_1.prisma.beneficiary.findMany({
        where: {
            ...baseFilter,
            NOT: { previousCpf: null },
        },
    });
    for (const pending of pendingNew) {
        try {
            const baseDate = new Date(pending.issueDate);
            baseDate.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today.getTime() - baseDate.getTime()) / dayMs);
            if (diffDays < pendingLimitDays)
                continue;
            if (pending.previousCpf && pending.changeDate) {
                const previous = await prisma_1.prisma.beneficiary.findFirst({
                    where: {
                        profileId: pending.profileId,
                        program: "AZUL",
                        cpf: pending.previousCpf,
                        changeDate: pending.changeDate,
                    },
                });
                if (previous) {
                    await prisma_1.prisma.beneficiary.delete({ where: { id: previous.id } });
                }
            }
            await prisma_1.prisma.beneficiary.update({
                where: { id: pending.id },
                data: {
                    status: client_1.Status.UTILIZADO,
                    changeDate: null,
                    previousName: null,
                    previousCpf: null,
                    previousDate: null,
                },
            });
        }
        catch (err) {
            console.error("Erro finalizando troca AZUL", err);
        }
    }
    // Antigos órfãos (sem previous*), expirados após 60 dias
    const orphanOld = await prisma_1.prisma.beneficiary.findMany({
        where: {
            ...baseFilter,
            previousCpf: null,
            previousName: null,
        },
    });
    for (const old of orphanOld) {
        try {
            if (!old.changeDate)
                continue;
            const baseDate = new Date(old.changeDate);
            baseDate.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today.getTime() - baseDate.getTime()) / dayMs);
            if (diffDays >= fallbackRemovalDays) {
                await prisma_1.prisma.beneficiary.delete({ where: { id: old.id } });
            }
        }
        catch (err) {
            console.error("Erro removendo beneficiário AZUL órfão", err);
        }
    }
}
