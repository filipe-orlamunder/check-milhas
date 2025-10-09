// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET as string;

  try {
    const decoded = jwt.verify(token, secret) as { id?: string; userId?: string };
    // Aceita tanto "id" quanto "userId"
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({ error: "Token inválido (sem ID de usuário)." });
    }

    req.user = { id: userId };
    next();
  } catch (err) {
    console.error("Erro ao validar token:", err);
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}
