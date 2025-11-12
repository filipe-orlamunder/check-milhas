// src/services/beneficiariesService.ts
// Regras de domínio e utilitários de beneficiários (sem alterar comportamento)
import { prisma } from "../prisma";
import { Status } from "@prisma/client";
import { nowInBrazil, startOfDayBR } from "../utils/timezone";

/**
 * Garante que o perfil exista e pertença ao usuário autenticado.
 */
export async function ensureProfileBelongsToUser(profileId: string, userId: string) {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) throw { status: 404, message: "Perfil não encontrado" };
  if (profile.userId !== userId) throw { status: 403, message: "Acesso negado" };
  return profile;
}

/**
 * Reconcilia alterações pendentes do programa AZUL.
 * - Finaliza alterações após 30 dias, removendo o antigo e consolidando o novo.
 * - Elimina registros órfãos antigos após 60 dias da changeDate.
 */
export async function reconcileAzulPending(profileIdToCheck?: string) {
  const dayMs = 24 * 60 * 60 * 1000;
  const pendingLimitDays = 30;
  const fallbackRemovalDays = 60;

  const today = startOfDayBR(nowInBrazil());

  const baseFilter = {
    program: "AZUL" as const,
    status: "PENDENTE" as const,
    ...(profileIdToCheck ? { profileId: profileIdToCheck } : {}),
  };

  // Novos registros (substitutos) criados em trocas, com previous* preenchido
  const pendingNew = await prisma.beneficiary.findMany({
    where: {
      ...baseFilter,
      NOT: { previousCpf: null },
    },
  });

  for (const pending of pendingNew) {
    try {
  const baseDate = startOfDayBR(new Date(pending.issueDate));
      const diffDays = Math.floor((today.getTime() - baseDate.getTime()) / dayMs);
      if (diffDays < pendingLimitDays) continue;

      if (pending.previousCpf && pending.changeDate) {
        const previous = await prisma.beneficiary.findFirst({
          where: {
            profileId: pending.profileId,
            program: "AZUL",
            cpf: pending.previousCpf,
            changeDate: pending.changeDate,
          },
        });
        if (previous) {
          await prisma.beneficiary.delete({ where: { id: previous.id } });
        }
      }

      await prisma.beneficiary.update({
        where: { id: pending.id },
        data: {
          status: Status.UTILIZADO,
          changeDate: null,
          previousName: null,
          previousCpf: null,
          previousDate: null,
        },
      });
    } catch (err) {
      console.error("Erro finalizando troca AZUL", err);
    }
  }

  // Antigos órfãos (sem previous*), expirados após 60 dias
  const orphanOld = await prisma.beneficiary.findMany({
    where: {
      ...baseFilter,
      previousCpf: null,
      previousName: null,
    },
  });

  for (const old of orphanOld) {
    try {
      if (!old.changeDate) continue;
  const baseDate = startOfDayBR(new Date(old.changeDate));
      const diffDays = Math.floor((today.getTime() - baseDate.getTime()) / dayMs);
      if (diffDays >= fallbackRemovalDays) {
        await prisma.beneficiary.delete({ where: { id: old.id } });
      }
    } catch (err) {
      console.error("Erro removendo beneficiário AZUL órfão", err);
    }
  }
}
