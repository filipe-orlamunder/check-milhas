// src/middleware/errorHandler.ts
// Middleware simples de tratamento de erros para respostas JSON consistentes.
import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err?.status) {
    return res.status(err.status).json({ error: err.message || "Erro" });
  }
  console.error("Erro não tratado:", err);
  return res.status(500).json({ error: "Erro interno" });
}
