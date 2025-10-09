// src/routes/profiles.ts

import { Router } from "express";
import { z, ZodError } from "zod";
import { prisma } from "../prisma";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware"; // Importe a interface
import { Prisma } from "@prisma/client";

const profilesRouter = Router();

// Zod schema for profile creation
const createProfileSchema = z.object({
  name: z.string().min(1, "O nome do perfil é obrigatório."),
  cpf: z.string().length(11, "O CPF deve ter 11 dígitos."),
});

// GET /profiles - Listar perfis do usuário autenticado
profilesRouter.get("/profiles", authMiddleware, async (req: AuthRequest, res) => { // Use a interface AuthRequest
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Usuário não autenticado." });
  }

  try {
    const profiles = await prisma.profile.findMany({
      where: { userId },
    });
    res.json(profiles);
  } catch (error) {
    console.error("Erro ao listar perfis:", error);
    res.status(500).json({ error: "Erro ao listar perfis" });
  }
});

// POST /profiles - Criar novo perfil
profilesRouter.post("/profiles", authMiddleware, async (req: AuthRequest, res) => { // Use a interface AuthRequest
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Usuário não autenticado." });
  }

  try {
    // 0. 🔹 Verifica se o usuário do token realmente existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ error: "Usuário do token não encontrado. Por favor, autentique-se novamente." });
    }

    // 1. Valida o corpo da requisição
    const { name, cpf } = createProfileSchema.parse(req.body);

    // 2. Verifica se o CPF já está cadastrado para este usuário
    const existingProfile = await prisma.profile.findUnique({
      where: {
        userId_cpf: {
          userId,
          cpf,
        },
      },
    });

    if (existingProfile) {
      return res.status(400).json({ error: "CPF já cadastrado para este usuário." });
    }

    // 3. Cria o novo perfil
    const created = await prisma.profile.create({
      data: {
        name,
        cpf,
        userId,
      },
    });

    res.status(201).json(created);
  } catch (error) {
    if (error instanceof ZodError) {
      // ✅ CORREÇÃO APLICADA AQUI
      return res.status(400).json({ errors: error.flatten().fieldErrors });
    }
    
    console.error("Erro ao criar perfil:", error);

    // Tratamento para o erro de chave estrangeira que você teve originalmente
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return res.status(401).json({ error: "Usuário do token inválido. Por favor, autentique-se novamente." });
    }
    
    return res.status(500).json({ error: "Erro interno ao criar o perfil." });
  }
});

// DELETE /profiles/:id - Excluir perfil por ID
profilesRouter.delete("/profiles/:id", authMiddleware, async (req: AuthRequest, res) => { // Use a interface AuthRequest
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "Usuário não autenticado." });
  }

  try {
    // Verifica se o perfil pertence ao usuário autenticado
    const profile = await prisma.profile.findFirst({
      where: { id, userId },
    });

    if (!profile) {
      return res.status(404).json({ error: "Perfil não encontrado ou não pertence ao usuário." });
    }

    // Exclui o perfil
    await prisma.profile.delete({
      where: { id },
    });

    res.json({ message: "Perfil excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir perfil:", error);
    res.status(500).json({ error: "Erro ao excluir perfil" });
  }
});

export default profilesRouter;