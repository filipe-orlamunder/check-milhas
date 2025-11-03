"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token não fornecido." });
    }
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Aceita tanto "id" quanto "userId"
        const userId = decoded.id || decoded.userId;
        if (!userId) {
            return res.status(401).json({ error: "Token inválido (sem ID de usuário)." });
        }
        req.user = { id: userId };
        next();
    }
    catch (err) {
        console.error("Erro ao validar token:", err);
        return res.status(401).json({ error: "Token inválido ou expirado." });
    }
}
