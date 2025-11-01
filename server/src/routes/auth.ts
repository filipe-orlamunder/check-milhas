import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z, ZodError } from "zod";

// --- Esquemas de Validação com Zod ---
const registerSchema = z.object({
  name: z.string().min(4, "O nome deve ter pelo menos 4 caracteres."),
  email: z.string().email("Formato de e-mail inválido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

const loginSchema = z.object({
  email: z.string().email("Formato de e-mail inválido."),
  password: z.string().min(1, "A senha é obrigatória."),
});


const router = Router();

// --- Rota de Registro de Usuário ---
router.post("/register", async (req: Request, res: Response) => {
  try {
    // 1. Valida o corpo da requisição
    const { name, email, password } = registerSchema.parse(req.body);

    // 2. Verifica a existência do e-mail no banco de dados
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "E-mail já cadastrado." }); // 409 Conflict
    }

    // 3. Criptografa a senha antes de armazenar
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Cria o usuário no banco, retornando apenas dados públicos
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true },
    });

    // 5. Gera o token JWT para autenticação
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    return res.status(201).json({ token, user });

  } catch (error) {
    // Trata erros de validação do Zod
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.flatten().fieldErrors });
    }
    console.error("Erro no registro:", error);
    return res.status(500).json({ error: "Erro interno ao registrar usuário." });
  }
});

// --- Rota de Login de Usuário ---
router.post("/login", async (req: Request, res: Response) => {
  try {
    // 1. Valida o corpo da requisição
    const { email, password } = loginSchema.parse(req.body);

    // 2. Busca o usuário pelo e-mail
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Usuário ou senha incorretos" }); // Mensagem genérica
    }

    // 3. Compara a senha enviada com o hash armazenado
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Usuário ou senha incorretos" }); // Mensagem genérica
    }

    // 4. Gera o token JWT para autenticação
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // 5. Retorna o token e dados do usuário
    return res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });

  } catch (error) {
     // Trata erros de validação do Zod
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.flatten().fieldErrors });
    }
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno ao tentar fazer login." });
  }
});

export default router;
