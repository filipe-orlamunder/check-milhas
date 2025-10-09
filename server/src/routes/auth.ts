// src/routes/auth.ts
import { Router } from "express";
import { z, ZodError } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma"; // Importar a instância do Prisma

// --- Boas Práticas: Garantir que a chave secreta JWT exista ---
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("ERRO FATAL: A variável de ambiente JWT_SECRET não está definida.");
  process.exit(1); // Encerra a aplicação se a chave não existir
}
// ----------------------------------------------------------------

const router = Router();

// esquemas de validação com Zod
const registerSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Formato de email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("Formato de email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.parse(req.body);

    // ✅ CORREÇÃO: Verificar se o usuário existe no banco de dados com Prisma
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Este email já está em uso" });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);

    // ✅ CORREÇÃO: Criar o novo usuário no banco de dados com Prisma
    const newUser = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        passwordHash,
      },
    });

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Retorna o usuário sem o hash da senha
    return res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.flatten().fieldErrors });
    }
    console.error("Erro no registro:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.parse(req.body);

    // ✅ CORREÇÃO: Buscar o usuário no banco de dados com Prisma
    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const isValid = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Retorna o usuário sem o hash da senha
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.flatten().fieldErrors });
    }
    console.error("Erro no login:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;