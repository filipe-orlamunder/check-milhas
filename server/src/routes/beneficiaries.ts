// src/routes/beneficiaries.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { computeStatus } from "../utils/statusCalculator";
import parseDateOnlyToLocal from "../utils/dateUtils";
import { isCpfValid } from "../utils/validators";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware"; // 1. Importe a interface AuthRequest
import { Program, Status } from "@prisma/client";

const router = Router();

// Validação de formato YYYY-MM-DD 
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Helpers
 */
async function ensureProfileBelongsToUser(profileId: string, userId: string) {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) throw { status: 404, message: "Perfil não encontrado" };
  if (profile.userId !== userId) throw { status: 403, message: "Acesso negado" };
  return profile;
}

/**
 * GET /profiles/:profileId/beneficiaries?program=LATAM
 */
router.get("/profiles/:profileId/beneficiaries", authMiddleware, async (req: AuthRequest, res) => { // 2. Use a interface
  try {
    const { profileId } = req.params;
    const programQ = (req.query.program as string | undefined)?.toUpperCase();
    const userId = req.user?.id; // 3. Corrija o acesso ao ID do usuário

    if (!userId) { // 4. Adicione uma verificação de segurança
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    await ensureProfileBelongsToUser(profileId, userId);

    // Reconciliar alterações pendentes do AZUL que já passaram do período de carência (60 dias)
    const reconcileAzulPending = async (profileIdToCheck?: string) => {
      const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 dias atrás
      const wherePending: any = { program: 'AZUL', status: 'PENDENTE', changeDate: { lte: cutoff } };
      if (profileIdToCheck) wherePending.profileId = profileIdToCheck;

      const pendings = await prisma.beneficiary.findMany({ where: wherePending });
      for (const p of pendings) {
        try {
          if (p.previousName) {
            // este registro é o novo; encontre o antigo e atualize ambos
            if (p.previousCpf && p.changeDate) {
              const prev = await prisma.beneficiary.findFirst({ where: { profileId: p.profileId, program: 'AZUL', cpf: p.previousCpf, changeDate: p.changeDate } });
              if (prev) {
                await prisma.beneficiary.update({ where: { id: prev.id }, data: { status: Status.LIBERADO, changeDate: null } });
              }
            }
            await prisma.beneficiary.update({ where: { id: p.id }, data: { status: Status.UTILIZADO, changeDate: null } });
          } else {
            // este registro é o antigo (sem previousName) — encontre o novo e atualize
            if (p.changeDate) {
              const paired = await prisma.beneficiary.findFirst({ where: { profileId: p.profileId, program: 'AZUL', previousCpf: p.cpf, changeDate: p.changeDate } });
              if (paired) {
                await prisma.beneficiary.update({ where: { id: paired.id }, data: { status: Status.UTILIZADO, changeDate: null } });
              }
            }
            await prisma.beneficiary.update({ where: { id: p.id }, data: { status: Status.LIBERADO, changeDate: null } });
          }
        } catch (err) {
          console.error('Erro reconciliando AZUL pendente', err);
        }
      }
    };

    // Executa reconciliação apenas para este perfil (sempre seguro)
    await reconcileAzulPending(profileId);

    const where: any = { profileId };
    if (programQ) where.program = programQ as Program;

    const list = await prisma.beneficiary.findMany({ where, orderBy: { createdAt: "desc" } });

    // Recalcula o status para cada registro antes de enviar (para aplicar regras de tempo)
    const now = new Date();
    const mapped = list.map((b) => {
      const isNewForAzul = !!b.previousName; // novo registro em substituição traz previous*
      const status = computeStatus(b.program as Program, b.issueDate, b.changeDate ?? null, now, isNewForAzul as any);
      return { ...b, status };
    });

    return res.json(mapped);
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

/**
 * POST /profiles/:profileId/beneficiaries
 */
router.post("/profiles/:profileId/beneficiaries", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { profileId } = req.params;
    const { program, name, cpf, issueDate } = req.body;
    const userId = req.user?.id; // ✅ CORREÇÃO APLICADA

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    await ensureProfileBelongsToUser(profileId, userId);

  if (!program || !name || !cpf || !issueDate) return res.status(400).json({ error: "Campos obrigatórios faltando" });

  // Validar formato da data (YYYY-MM-DD) para evitar anos com mais de 4 dígitos
  if (typeof issueDate === 'string' && !DATE_RE.test(issueDate)) {
    return res.status(400).json({ error: "Formato de data inválido. Use YYYY-MM-DD" });
  }

  // Não permitir datas futuras (parseando YYYY-MM-DD como local)
  const providedDate = parseDateOnlyToLocal(issueDate as any);
  const today = new Date();
  today.setHours(0,0,0,0);
  const providedDateOnly = new Date(providedDate);
  providedDateOnly.setHours(0,0,0,0);
  if (providedDateOnly > today) return res.status(400).json({ error: "Data de cadastro não pode ser futura" });

    const prog = (program as string).toUpperCase() as Program;

    // Limites por programa (validação depende do período de emissão)
    if (prog === "AZUL") {
      const limit = 5;
      const count = await prisma.beneficiary.count({ where: { profileId, program: prog } });
      if (count >= limit) return res.status(400).json({ error: `Limite de ${limit} atingido para ${prog}` });
    } else if (prog === "LATAM") {
      // Contagem em janela móvel de 12 meses a partir da issueDate fornecida
  const issue = parseDateOnlyToLocal(issueDate as any);
      const windowStart = new Date(issue.getTime() - 365 * 24 * 60 * 60 * 1000);
      const count = await prisma.beneficiary.count({ where: { profileId, program: prog, issueDate: { gte: windowStart, lte: issue } } });
      if (count >= 25) return res.status(400).json({ error: `Limite de 25 atingido para ${prog} no período de 12 meses` });
    } else if (prog === "SMILES") {
      // Contagem no ano civil da issueDate fornecida
  const issue = parseDateOnlyToLocal(issueDate as any);
      const yearStart = new Date(issue.getFullYear(), 0, 1);
      const yearEnd = new Date(issue.getFullYear(), 11, 31, 23, 59, 59);
      const count = await prisma.beneficiary.count({ where: { profileId, program: prog, issueDate: { gte: yearStart, lte: yearEnd } } });
      if (count >= 25) return res.status(400).json({ error: `Limite de 25 atingido para ${prog} no ano ${issue.getFullYear()}` });
    }

    if (!isCpfValid(cpf)) return res.status(400).json({ error: "CPF inválido (11 dígitos)" });

  const exists = await prisma.beneficiary.findFirst({ where: { profileId, program: prog, cpf } });
  if (exists) return res.status(409).json({ error: "CPF já cadastrado" });

  const issue = parseDateOnlyToLocal(issueDate as any);
  const status = computeStatus(prog, issue, null, new Date());

    const created = await prisma.beneficiary.create({
      data: {
        profileId,
        program: prog,
        name,
        cpf,
        issueDate: issue,
        status
      }
    });

    return res.status(201).json(created);
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    // conflito de unicidade no banco
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: "CPF já cadastrado" });
    }
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

/**
 * PUT /beneficiaries/:id
 */
router.put("/beneficiaries/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, cpf, issueDate } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const existing = await prisma.beneficiary.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Beneficiário não encontrado" });

    const profile = await prisma.profile.findUnique({ where: { id: existing.profileId } });
    if (!profile) return res.status(404).json({ error: "Perfil não encontrado" });
    if (profile.userId !== userId) return res.status(403).json({ error: "Acesso negado" });

  if (existing.program === "AZUL") {
      // validar formato de issueDate se fornecida
      if (issueDate && typeof issueDate === 'string' && !DATE_RE.test(issueDate)) {
        return res.status(400).json({ error: "Formato de data inválido. Use YYYY-MM-DD" });
      }

      const changed = (name && name !== existing.name) || (cpf && cpf !== existing.cpf) || (issueDate && parseDateOnlyToLocal(issueDate as any).getTime() !== existing.issueDate.getTime());
      if (!changed) return res.status(400).json({ error: "Nenhuma alteração detectada" });
      if (cpf && !isCpfValid(cpf)) return res.status(400).json({ error: "CPF inválido" });
      const dup = cpf ? await prisma.beneficiary.findFirst({ where: { profileId: existing.profileId, program: existing.program, cpf, NOT: { id } } }) : null;
      if (dup) return res.status(409).json({ error: "CPF já cadastrado" });

      // Se o CPF não mudou, trate como atualização simples (não cria par pendente)
      if (!cpf || cpf === existing.cpf) {
        const newIssueDate = issueDate ? parseDateOnlyToLocal(issueDate as any) : existing.issueDate;
        const newStatus = computeStatus(existing.program, newIssueDate, existing.changeDate ?? null, new Date());
        const updated = await prisma.beneficiary.update({
          where: { id },
          data: {
            name: name ?? existing.name,
            issueDate: newIssueDate,
            status: newStatus
          }
        });
        return res.json(updated);
      }

      // Regra: alteração AZUL -> cria novo registro (novo beneficiário) e marca ambos PENDENTE com changeDate
      const now = new Date();
  const newIssueDate = issueDate ? parseDateOnlyToLocal(issueDate as any) : now;

        // Não permitir data de cadastro futura/ anterior à data atual
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newDateOnly = new Date(newIssueDate);
        newDateOnly.setHours(0, 0, 0, 0);
        if (newDateOnly > today) return res.status(400).json({ error: "A data de cadastro não pode ser futura" });
        if (newDateOnly < today) return res.status(400).json({ error: "A data de cadastro da alteração não pode ser anterior à data atual" });

      // Atualiza o registro antigo para PENDENTE
      await prisma.beneficiary.update({ where: { id }, data: { changeDate: now, status: Status.PENDENTE } });

      // Cria o novo registro com previous* apontando para o antigo
      const createdNew = await prisma.beneficiary.create({
        data: {
          profileId: existing.profileId,
          program: existing.program,
          name: name ?? existing.name,
          cpf: cpf ?? existing.cpf,
          issueDate: newIssueDate,
          previousName: existing.name,
          previousCpf: existing.cpf,
          previousDate: existing.issueDate,
          changeDate: now,
          status: Status.PENDENTE
        }
      });

      return res.json(createdNew);
    }

    // LATAM/SMILES
    if (cpf && !isCpfValid(cpf)) return res.status(400).json({ error: "CPF inválido" });
    if (cpf && cpf !== existing.cpf) {
      const dup = await prisma.beneficiary.findFirst({ where: { profileId: existing.profileId, program: existing.program, cpf } });
      if (dup) return res.status(409).json({ error: "CPF já cadastrado" });
    }

  // validar formato de issueDate se fornecida (PUT geral)
  if (issueDate && typeof issueDate === 'string' && !DATE_RE.test(issueDate)) {
    return res.status(400).json({ error: "Formato de data inválido. Use YYYY-MM-DD" });
  }

  const newIssue = issueDate ? parseDateOnlyToLocal(issueDate as any) : existing.issueDate;
  const newStatus = computeStatus(existing.program, newIssue, existing.changeDate ?? null, new Date());

    const updated = await prisma.beneficiary.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        cpf: cpf ?? existing.cpf,
        issueDate: newIssue,
        status: newStatus
      }
    });

    return res.json(updated);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: "CPF já cadastrado" });
    }
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

/**
 * DELETE /beneficiaries/:id
 */
router.delete("/beneficiaries/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // ✅ CORREÇÃO APLICADA

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    
    const existing = await prisma.beneficiary.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Não encontrado" });

    const profile = await prisma.profile.findUnique({ where: { id: existing.profileId } });
    if (!profile) return res.status(404).json({ error: "Perfil não encontrado" });
    if (profile.userId !== userId) return res.status(403).json({ error: "Acesso negado" });

    await prisma.beneficiary.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

/**
 * DELETE /profiles/:profileId/beneficiaries?program=LATAM (excluir todos do programa)
 */
router.delete("/profiles/:profileId/beneficiaries", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { profileId } = req.params;
    const programQ = (req.query.program as string | undefined)?.toUpperCase();
    const userId = req.user?.id; // ✅ CORREÇÃO APLICADA

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    await ensureProfileBelongsToUser(profileId, userId);

    if (!programQ) return res.status(400).json({ error: "Informe 'program' como query param" });

    await prisma.beneficiary.deleteMany({ where: { profileId, program: programQ as Program } });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

/**
 * POST /beneficiaries/:id/cancel-change  (AZUL)
 */
router.post("/beneficiaries/:id/cancel-change", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // ✅ CORREÇÃO APLICADA

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const existing = await prisma.beneficiary.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Não encontrado" });

    const profile = await prisma.profile.findUnique({ where: { id: existing.profileId } });
    if (!profile) return res.status(404).json({ error: "Perfil não encontrado" });
    if (profile.userId !== userId) return res.status(403).json({ error: "Acesso negado" });

    if (existing.program !== "AZUL" || existing.status !== "PENDENTE") {
      return res.status(400).json({ error: "Apenas alterações pendentes do Azul podem ser canceladas" });
    }

    // Se este registro representa o novo (tem previous*), então delete-o e reverta o antigo
    if (existing.previousName) {
      // Este registro é o novo (tem previous*). previousCpf e changeDate devem existir neste fluxo.
      const prevCpf = existing.previousCpf as string;
      const prevChange = existing.changeDate as Date;
      const old = await prisma.beneficiary.findFirst({ where: { profileId: existing.profileId, program: "AZUL", cpf: prevCpf, changeDate: prevChange } });
      if (old) {
        await prisma.beneficiary.update({ where: { id: old.id }, data: { changeDate: null, status: Status.UTILIZADO } });
      }
      await prisma.beneficiary.delete({ where: { id: existing.id } });
      return res.json({ ok: true });
    }

    // Caso este seja o registro antigo (sem previous*), encontre o novo e delete-o, revertendo o antigo
    const pairedNew = await prisma.beneficiary.findFirst({ where: { profileId: existing.profileId, program: "AZUL", previousCpf: existing.cpf, changeDate: existing.changeDate } });
    if (pairedNew) {
      await prisma.beneficiary.delete({ where: { id: pairedNew.id } });
    }
    const reverted = await prisma.beneficiary.update({ where: { id }, data: { changeDate: null, status: Status.UTILIZADO } });
    return res.json(reverted);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
