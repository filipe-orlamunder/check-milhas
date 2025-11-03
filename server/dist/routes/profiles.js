"use strict";
// src/routes/profiles.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const authMiddleware_1 = require("../middleware/authMiddleware");
const client_1 = require("@prisma/client");
const profilesRouter = (0, express_1.Router)();
// Validação do payload de perfil
const createProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "O nome do perfil é obrigatório."),
    cpf: zod_1.z.string().length(11, "O CPF deve ter 11 dígitos."),
});
// GET /profiles — lista os perfis do usuário autenticado
profilesRouter.get("/profiles", authMiddleware_1.authMiddleware, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado." });
    }
    try {
        const profiles = await prisma_1.prisma.profile.findMany({
            where: { userId },
        });
        res.json(profiles);
    }
    catch (error) {
        console.error("Erro ao listar perfis:", error);
        res.status(500).json({ error: "Erro ao listar perfis" });
    }
});
// POST /profiles — cria perfil
profilesRouter.post("/profiles", authMiddleware_1.authMiddleware, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado." });
    }
    try {
        // Verifica se o usuário do token existe
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(401).json({ error: "Usuário do token não encontrado. Por favor, autentique-se novamente." });
        }
        // Valida corpo
        const { name, cpf } = createProfileSchema.parse(req.body);
        // Verifica duplicidade por CPF (único globalmente)
        const existingProfile = await prisma_1.prisma.profile.findFirst({
            where: { cpf },
        });
        if (existingProfile) {
            return res.status(409).json({ error: "CPF já cadastrado" });
        }
        // Cria perfil
        const created = await prisma_1.prisma.profile.create({
            data: {
                name,
                cpf,
                userId,
            },
        });
        res.status(201).json(created);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ errors: error.flatten().fieldErrors });
        }
        console.error("Erro ao criar perfil:", error);
        // Chave estrangeira inválida
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return res.status(401).json({ error: "Usuário do token inválido. Por favor, autentique-se novamente." });
        }
        // Violação de unicidade (CPF)
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({ error: "CPF já cadastrado" });
        }
        return res.status(500).json({ error: "Erro interno ao criar o perfil." });
    }
});
// DELETE /profiles/:id — exclui perfil por ID
profilesRouter.delete("/profiles/:id", authMiddleware_1.authMiddleware, async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado." });
    }
    try {
        // Verifica se o perfil pertence ao usuário autenticado
        const profile = await prisma_1.prisma.profile.findFirst({
            where: { id, userId },
        });
        if (!profile) {
            return res.status(404).json({ error: "Perfil não encontrado ou não pertence ao usuário." });
        }
        // Exclui o perfil
        await prisma_1.prisma.profile.delete({
            where: { id },
        });
        res.json({ message: "Perfil excluído com sucesso." });
    }
    catch (error) {
        console.error("Erro ao excluir perfil:", error);
        res.status(500).json({ error: "Erro ao excluir perfil" });
    }
});
exports.default = profilesRouter;
