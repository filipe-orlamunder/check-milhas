// src/utils/asyncHandler.ts
// Wrapper leve para handlers assíncronos, evitando try/catch repetidos.
import { Request, Response, NextFunction, RequestHandler } from "express";

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
