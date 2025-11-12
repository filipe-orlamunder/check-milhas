import { Router } from "express";
import { prisma } from "../prisma";
import { computeStatus } from "../utils/statusCalculator";
import parseDateOnlyToLocal, { DATE_RE } from "../utils/dateUtils";
import { nowInBrazil } from "../utils/timezone";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import { Program, Status } from "@prisma/client";

const router = Router();

// Regex para validar o formato de data YYYY-MM-DD (centralizada em utils/dateUtils)

// GET /validation-dynamic — vagas por programa para cada perfil do usuário
router.get("/validation-dynamic", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Usuário não autenticado." });
    const dateParam = req.query.date as string | undefined;

    if (dateParam && !DATE_RE.test(dateParam)) {
      return res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD' });
    }
  const refDate = dateParam ? parseDateOnlyToLocal(dateParam) : nowInBrazil();

    // Carrega perfis e beneficiários do usuário
    const profiles = await prisma.profile.findMany({
      where: { userId },
      include: { beneficiaries: true }
    });

    const results = profiles.map(profile => {
  // Limites por programa
      const progLimits: Record<Program, number> = { LATAM: 25, SMILES: 25, AZUL: 5 };

      const available: Record<string, number> = { LATAM: 0, SMILES: 0, AZUL: 0 };

      (["LATAM", "SMILES", "AZUL"] as Program[]).forEach(prog => {
        const bens = profile.beneficiaries.filter(b => b.program === prog);

        if (prog === "AZUL") {
          // AZUL: vagas livres sem considerar status
          const limit = progLimits[prog];
          const free = limit - bens.length;
          available[prog] = free < 0 ? 0 : free;
        } else {
          // LATAM/SMILES: considera apenas LIBERADOS na refDate
          const limit = progLimits[prog];
          const totalRegistered = bens.length;
          
          const liberados = bens.filter(b => {
            return computeStatus(prog, b.issueDate, b.changeDate ?? null, refDate) === Status.LIBERADO;
          }).length;
          
          // Cálculo de vagas disponíveis
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