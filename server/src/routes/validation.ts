import { Router } from "express";
import { prisma } from "../prisma";
import { computeStatus } from "../utils/statusCalculator";
import parseDateOnlyToLocal from "../utils/dateUtils";
import { authMiddleware } from "../middleware/authMiddleware";
import { Program, Status } from "@prisma/client";

const router = Router();

// Regex para validar o formato de data YYYY-MM-DD.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /validation-dynamic
 * Calcula o número de vagas "disponíveis" por programa para cada perfil do usuário logado.
 * Aceita um parâmetro de consulta 'date' opcional (YYYY-MM-DD) para cálculo de status.
 */
router.get("/validation-dynamic", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const dateParam = req.query.date as string | undefined;

    if (dateParam && !DATE_RE.test(dateParam)) {
      return res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD' });
    }
    const refDate = dateParam ? parseDateOnlyToLocal(dateParam) : new Date();

    // Carrega perfis do usuário, incluindo a lista de beneficiários.
    const profiles = await prisma.profile.findMany({
      where: { userId },
      include: { beneficiaries: true }
    });

    const results = profiles.map(profile => {
      // Define limites de beneficiários por programa.
      const progLimits: Record<Program, number> = { LATAM: 25, SMILES: 25, AZUL: 5 };

      const available: Record<string, number> = { LATAM: 0, SMILES: 0, AZUL: 0 };

      (["LATAM", "SMILES", "AZUL"] as Program[]).forEach(prog => {
        const bens = profile.beneficiaries.filter(b => b.program === prog);

        if (prog === "AZUL") {
          // Lógica para AZUL: calcula vagas livres sem considerar status.
          const limit = progLimits[prog];
          const free = limit - bens.length;
          available[prog] = free < 0 ? 0 : free;
        } else {
          // Lógica para LATAM/SMILES: considera beneficiários LIBERADOS na refDate.
          const limit = progLimits[prog];
          const totalRegistered = bens.length;
          
          const liberados = bens.filter(b => {
            return computeStatus(prog, b.issueDate, b.changeDate ?? null, refDate) === Status.LIBERADO;
          }).length;
          
          // Cálculo de vagas disponíveis.
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