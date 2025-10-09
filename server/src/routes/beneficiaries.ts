// src/routes/beneficiaries.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { computeStatus } from "../utils/statusCalculator";
import { isCpfValid } from "../utils/validators";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware"; // 1. Importe a interface AuthRequest
import { Program, Status } from "@prisma/client";

const router = Router();

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

    const where: any = { profileId };
    if (programQ) where.program = programQ as Program;

    const list = await prisma.beneficiary.findMany({ where, orderBy: { createdAt: "desc" } });
    return res.json(list);
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

    const prog = (program as string).toUpperCase() as Program;
    const limit = prog === "AZUL" ? 5 : 25;

    const count = await prisma.beneficiary.count({ where: { profileId, program: prog } });
    if (count >= limit) return res.status(400).json({ error: `Limite de ${limit} atingido para ${prog}` });

    if (!isCpfValid(cpf)) return res.status(400).json({ error: "CPF inválido (11 dígitos)" });

    const exists = await prisma.beneficiary.findFirst({ where: { profileId, program: prog, cpf } });
    if (exists) return res.status(400).json({ error: "CPF já cadastrado nesse programa para este perfil" });

    const issue = new Date(issueDate);
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
    const userId = req.user?.id; // ✅ CORREÇÃO APLICADA

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const existing = await prisma.beneficiary.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Beneficiário não encontrado" });

    const profile = await prisma.profile.findUnique({ where: { id: existing.profileId } });
    if (!profile) return res.status(404).json({ error: "Perfil não encontrado" });
    if (profile.userId !== userId) return res.status(403).json({ error: "Acesso negado" });

    if (existing.program === "AZUL") {
      const changed = (name && name !== existing.name) || (cpf && cpf !== existing.cpf) || (issueDate && new Date(issueDate).getTime() !== existing.issueDate.getTime());
      if (!changed) return res.status(400).json({ error: "Nenhuma alteração detectada" });
      if (cpf && !isCpfValid(cpf)) return res.status(400).json({ error: "CPF inválido" });
      const dup = cpf ? await prisma.beneficiary.findFirst({ where: { profileId: existing.profileId, program: existing.program, cpf, NOT: { id } } }) : null;
      if (dup) return res.status(400).json({ error: "CPF já cadastrado nesse programa" });

      const updated = await prisma.beneficiary.update({
        where: { id },
        data: {
          previousName: existing.name,
          previousCpf: existing.cpf,
          previousDate: existing.issueDate,
          name: name ?? existing.name,
          cpf: cpf ?? existing.cpf,
          issueDate: issueDate ? new Date(issueDate) : existing.issueDate,
          changeDate: new Date(),
          status: Status.PENDENTE
        }
      });
      return res.json(updated);
    }

    // LATAM/SMILES
    if (cpf && !isCpfValid(cpf)) return res.status(400).json({ error: "CPF inválido" });
    if (cpf && cpf !== existing.cpf) {
      const dup = await prisma.beneficiary.findFirst({ where: { profileId: existing.profileId, program: existing.program, cpf } });
      if (dup) return res.status(400).json({ error: "CPF já cadastrado nesse programa" });
    }

    const newIssue = issueDate ? new Date(issueDate) : existing.issueDate;
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
  } catch (err) {
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

    const reverted = await prisma.beneficiary.update({
      where: { id },
      data: {
        name: existing.previousName ?? existing.name,
        cpf: existing.previousCpf ?? existing.cpf,
        issueDate: existing.previousDate ?? existing.issueDate,
        previousName: null,
        previousCpf: null,
        previousDate: null,
        changeDate: null,
        status: Status.LIBERADO
      }
    });

    return res.json(reverted);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
