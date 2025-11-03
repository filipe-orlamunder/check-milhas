"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
// Validações (Zod)
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(4, "O nome deve ter pelo menos 4 caracteres."),
    email: zod_1.z.string().email("Formato de e-mail inválido."),
    password: zod_1.z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Formato de e-mail inválido."),
    password: zod_1.z.string().min(1, "A senha é obrigatória."),
});
const router = (0, express_1.Router)();
// POST /auth/register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = registerSchema.parse(req.body);
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: "E-mail já cadastrado." });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: { name, email, passwordHash },
            select: { id: true, name: true, email: true },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        return res.status(201).json({ token, user });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ errors: error.flatten().fieldErrors });
        }
        console.error("Erro no registro:", error);
        return res.status(500).json({ error: "Erro interno ao registrar usuário." });
    }
});
// POST /auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: "Usuário ou senha incorretos" });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Usuário ou senha incorretos" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        return res.status(200).json({
            token,
            user: { id: user.id, name: user.name, email: user.email },
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ errors: error.flatten().fieldErrors });
        }
        console.error("Erro no login:", error);
        return res.status(500).json({ error: "Erro interno ao tentar fazer login." });
    }
});
exports.default = router;
