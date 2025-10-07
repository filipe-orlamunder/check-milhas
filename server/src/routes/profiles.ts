// src/routes/profiles.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { isNameValid, isCpfValid } from "../utils/validators";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// GET /profiles - lista os perfis do usuário logado
router.get("/profiles", authMiddleware, async (req, res) => {
  const userId = (req as any).userId;
  const profiles = await prisma.profile.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
  return res.json(profiles);
});

// POST /profiles - cria perfil (nome + cpf)
router.post("/profiles", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { name, cpf } = req.body;

    if (!isNameValid(name)) return res.status(400).json({ error: "Nome inválido (4-60 caracteres, apenas letras e espaços)." });
    if (!isCpfValid(cpf)) return res.status(400).json({ error: "CPF inválido (11 dígitos numéricos)." });

    const count = await prisma.profile.count({ where: { userId } });
    if (count >= 10) return res.status(400).json({ error: "Limite de 10 perfis por conta atingido." });

    // evitar cpf duplicado dentro do mesmo user
    const exists = await prisma.profile.findFirst({ where: { userId, cpf } });
    if (exists) return res.status(400).json({ error: "CPF já cadastrado em outro perfil desta conta." });

    const created = await prisma.profile.create({
      data: { userId, name, cpf }
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

// DELETE /profiles/:id - exclui perfil (com confirmações no front)
router.delete("/profiles/:id", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const profile = await prisma.profile.findUnique({ where: { id } });
    if (!profile) return res.status(404).json({ error: "Perfil não encontrado" });
    if (profile.userId !== userId) return res.status(403).json({ error: "Acesso negado" });

    // Remove beneficiários associados primeiro
    await prisma.beneficiary.deleteMany({ where: { profileId: id } });
    await prisma.profile.delete({ where: { id } });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
