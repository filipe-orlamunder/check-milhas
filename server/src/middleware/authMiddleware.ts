import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret") as { userId: string };
    req.userId = decoded.userId;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
