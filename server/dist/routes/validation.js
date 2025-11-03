"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const statusCalculator_1 = require("../utils/statusCalculator");
const dateUtils_1 = __importStar(require("../utils/dateUtils"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Regex para validar o formato de data YYYY-MM-DD (centralizada em utils/dateUtils)
// GET /validation-dynamic — vagas por programa para cada perfil do usuário
router.get("/validation-dynamic", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: "Usuário não autenticado." });
        const dateParam = req.query.date;
        if (dateParam && !dateUtils_1.DATE_RE.test(dateParam)) {
            return res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD' });
        }
        const refDate = dateParam ? (0, dateUtils_1.default)(dateParam) : new Date();
        // Carrega perfis e beneficiários do usuário
        const profiles = await prisma_1.prisma.profile.findMany({
            where: { userId },
            include: { beneficiaries: true }
        });
        const results = profiles.map(profile => {
            // Limites por programa
            const progLimits = { LATAM: 25, SMILES: 25, AZUL: 5 };
            const available = { LATAM: 0, SMILES: 0, AZUL: 0 };
            ["LATAM", "SMILES", "AZUL"].forEach(prog => {
                const bens = profile.beneficiaries.filter(b => b.program === prog);
                if (prog === "AZUL") {
                    // AZUL: vagas livres sem considerar status
                    const limit = progLimits[prog];
                    const free = limit - bens.length;
                    available[prog] = free < 0 ? 0 : free;
                }
                else {
                    // LATAM/SMILES: considera apenas LIBERADOS na refDate
                    const limit = progLimits[prog];
                    const totalRegistered = bens.length;
                    const liberados = bens.filter(b => {
                        return (0, statusCalculator_1.computeStatus)(prog, b.issueDate, b.changeDate ?? null, refDate) === client_1.Status.LIBERADO;
                    }).length;
                    // Cálculo de vagas disponíveis
                    let val = (limit - totalRegistered) + liberados;
                    if (val < 0)
                        val = 0;
                    available[prog] = val;
                }
            });
            return {
                profileId: profile.id,
                profileName: profile.name,
                profileCpf: profile.cpf,
                available
            };
        });
        return res.json(results);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Erro interno" });
    }
});
exports.default = router;
