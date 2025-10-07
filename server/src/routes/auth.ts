// src/routes/auth.ts
import { Router } from "express";
import { z, ZodError } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// --- Boas Práticas: Garantir que a chave secreta JWT exista ---
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("ERRO FATAL: A variável de ambiente JWT_SECRET não está definida.");
  process.exit(1); // Encerra a aplicação se a chave não existir
}
// ----------------------------------------------------------------

const router = Router();

/**
 * TYPE: User (armazenamento em memória - somente para demo)
 * Em produção, troque por um banco de dados.
 */
type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

const users: User[] = []; // <- substitua por DB posteriormente

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

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// POST /auth/register
// ⭐ MELHORIA: Convertido para async/await
router.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.parse(req.body);

    const exists = users.find((u) => u.email === parsed.email);
    if (exists) {
      return res.status(409).json({ error: "Este email já está em uso" }); // 409 Conflict é mais específico
    }

    // ⭐ MELHORIA: Usando a versão assíncrona do bcrypt para não bloquear o servidor
    const passwordHash = await bcrypt.hash(parsed.password, 10);

    const newUser: User = {
      id: generateId(),
      name: parsed.name,
      email: parsed.email,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      // ✅ CORREÇÃO: Usando err.flatten() para um formato de erro amigável para a API
      return res.status(400).json({ errors: err.flatten().fieldErrors });
    }
    console.error(err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /auth/login
// ⭐ MELHORIA: Convertido para async/await
router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.parse(req.body);

    const user = users.find((u) => u.email === parsed.email);
    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" }); // 401 Unauthorized é mais apropriado
    }

    // ⭐ MELHORIA: Usando a versão assíncrona para comparar senhas
    const isValid = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Credenciais inválidas" }); // 401 Unauthorized
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      // ✅ CORREÇÃO: Usando err.flatten() aqui também
      return res.status(400).json({ errors: err.flatten().fieldErrors });
    }
    console.error(err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;