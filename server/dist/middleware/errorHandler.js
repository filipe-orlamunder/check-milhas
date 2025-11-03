"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    if (err?.status) {
        return res.status(err.status).json({ error: err.message || "Erro" });
    }
    console.error("Erro não tratado:", err);
    return res.status(500).json({ error: "Erro interno" });
}
