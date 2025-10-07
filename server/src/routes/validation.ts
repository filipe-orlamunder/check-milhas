// src/routes/validation.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { computeStatus } from "../utils/statusCalculator";
import { authMiddleware } from "../middleware/authMiddleware";
import { Program, Status } from "@prisma/client";

const router = Router();

/**
 * GET /validation-dynamic?date=YYYY-MM-DD
 * Retorna, para cada profile do usuário logado, quantos "disponíveis" existem por programa.
 */
router.get("/validation-dynamic", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const dateParam = req.query.date as string | undefined;
    const refDate = dateParam ? new Date(dateParam) : new Date();

    // carregar perfis do usuário com beneficiários
    const profiles = await prisma.profile.findMany({
      where: { userId },
      include: { beneficiaries: true }
    });

    const results = profiles.map(profile => {
      const progLimits: Record<Program, number> = { LATAM: 25, SMILES: 25, AZUL: 5 };

      const available: Record<string, number> = { LATAM: 0, SMILES: 0, AZUL: 0 };

      (["LATAM", "SMILES", "AZUL"] as Program[]).forEach(prog => {
        const bens = profile.beneficiaries.filter(b => b.program === prog);

        if (prog === "AZUL") {
          // AZUL: apenas vagas livres (não considerar pendente/liberado)
          const limit = progLimits[prog];
          const free = limit - bens.length;
          available[prog] = free < 0 ? 0 : free;
        } else {
          // LATAM / SMILES:
          const limit = progLimits[prog];
          const totalRegistered = bens.length;
          // contar quantos desses estarão LIBERADOS na refDate
          const liberados = bens.filter(b => {
            return computeStatus(prog, b.issueDate, b.changeDate ?? null, refDate) === Status.LIBERADO;
          }).length;
          // regra: disponíveis = (limit - totalRegistered) + liberados
          let val = (limit - totalRegistered) + liberados;
          if (val < 0) val = 0;
          available[prog] = val;
        }
      });

      return {
        profileId: profile.id,
        profileName: profile.name,
        profileCpf: profile.cpf,
        available
      };
    });

    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
