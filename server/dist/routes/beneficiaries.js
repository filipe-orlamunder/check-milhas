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
// src/routes/beneficiaries.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const statusCalculator_1 = require("../utils/statusCalculator");
const dateUtils_1 = __importStar(require("../utils/dateUtils"));
const validators_1 = require("../utils/validators");
const authMiddleware_1 = require("../middleware/authMiddleware");
const client_1 = require("@prisma/client");
const beneficiariesService_1 = require("../services/beneficiariesService");
const router = (0, express_1.Router)();
// Validação de formato YYYY-MM-DD reutilizada de utils/dateUtils
// GET /profiles/:profileId/beneficiaries?program=LATAM
router.get("/profiles/:profileId/beneficiaries", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const { profileId } = req.params;
        const programQ = req.query.program?.toUpperCase();
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado." });
        }
        await (0, beneficiariesService_1.ensureProfileBelongsToUser)(profileId, userId);
        // Executa reconciliação apenas para este perfil (mantém comportamento)
        await (0, beneficiariesService_1.reconcileAzulPending)(profileId);
        const where = { profileId };
        if (programQ)
            where.program = programQ;
        const list = await prisma_1.prisma.beneficiary.findMany({ where, orderBy: { createdAt: "desc" } });
        // Recalcula o status com base na data atual
        const now = new Date();
        const mapped = list.map((b) => {
            const isNewForAzul = !!b.previousName;
            const status = (0, statusCalculator_1.computeStatus)(b.program, b.issueDate, b.changeDate ?? null, now, isNewForAzul);
            return { ...b, status };
        });
        return res.json(mapped);
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ error: err.message });
        console.error(err);
        return res.status(500).json({ error: "Erro interno" });
    }
});
// POST /profiles/:profileId/beneficiaries
router.post("/profiles/:profileId/beneficiaries", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const { profileId } = req.params;
        const { program, name, cpf, issueDate } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado." });
        }
        await (0, beneficiariesService_1.ensureProfileBelongsToUser)(profileId, userId);
        if (!program || !name || !cpf || !issueDate)
            return res.status(400).json({ error: "Campos obrigatórios faltando" });
        // Valida data no formato YYYY-MM-DD
        if (typeof issueDate === 'string' && !dateUtils_1.DATE_RE.test(issueDate)) {
            return res.status(400).json({ error: "Formato de data inválido. Use YYYY-MM-DD" });
        }
        // Impede datas futuras
        const providedDate = (0, dateUtils_1.default)(issueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const providedDateOnly = new Date(providedDate);
        providedDateOnly.setHours(0, 0, 0, 0);
        if (providedDateOnly > today)
            return res.status(400).json({ error: "Data de cadastro não pode ser futura" });
        const prog = program.toUpperCase();
        // Limites por programa
        if (prog === "AZUL") {
            const limit = 5;
            const count = await prisma_1.prisma.beneficiary.count({ where: { profileId, program: prog } });
            if (count >= limit)
                return res.status(400).json({ error: `Limite de ${limit} atingido para ${prog}` });
        }
        else if (prog === "LATAM") {
            // Janela móvel de 12 meses a partir da issueDate
            const issue = (0, dateUtils_1.default)(issueDate);
            const windowStart = new Date(issue.getTime() - 365 * 24 * 60 * 60 * 1000);
            const count = await prisma_1.prisma.beneficiary.count({ where: { profileId, program: prog, issueDate: { gte: windowStart, lte: issue } } });
            if (count >= 25)
                return res.status(400).json({ error: `Limite de 25 atingido para ${prog} no período de 12 meses` });
        }
        else if (prog === "SMILES") {
            // Ano civil da issueDate
            const issue = (0, dateUtils_1.default)(issueDate);
            const yearStart = new Date(issue.getFullYear(), 0, 1);
            const yearEnd = new Date(issue.getFullYear(), 11, 31, 23, 59, 59);
            const count = await prisma_1.prisma.beneficiary.count({ where: { profileId, program: prog, issueDate: { gte: yearStart, lte: yearEnd } } });
            if (count >= 25)
                return res.status(400).json({ error: `Limite de 25 atingido para ${prog} no ano ${issue.getFullYear()}` });
        }
        if (!(0, validators_1.isCpfValid)(cpf))
            return res.status(400).json({ error: "CPF inválido (11 dígitos)" });
        const exists = await prisma_1.prisma.beneficiary.findFirst({ where: { profileId, program: prog, cpf } });
        if (exists)
            return res.status(409).json({ error: "CPF já cadastrado" });
        const issue = (0, dateUtils_1.default)(issueDate);
        const status = (0, statusCalculator_1.computeStatus)(prog, issue, null, new Date());
        const created = await prisma_1.prisma.beneficiary.create({
            data: {
                profileId,
                program: prog,
                name,
                cpf,
                issueDate: issue,
                status
            }
        });
        return res.status(201).json(created);
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ error: err.message });
        // Conflito de unicidade (Prisma)
        if (err?.code === 'P2002') {
            return res.status(409).json({ error: "CPF já cadastrado" });
        }
        console.error(err);
        return res.status(500).json({ error: "Erro interno" });
    }
});
// PUT /beneficiaries/:id
router.put("/beneficiaries/:id", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, cpf, issueDate } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado." });
        }
        const existing = await prisma_1.prisma.beneficiary.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: "Beneficiário não encontrado" });
        const profile = await prisma_1.prisma.profile.findUnique({ where: { id: existing.profileId } });
        if (!profile)
            return res.status(404).json({ error: "Perfil não encontrado" });
        if (profile.userId !== userId)
            return res.status(403).json({ error: "Acesso negado" });
        if (existing.program === "AZUL") {
            // validar formato de issueDate se fornecida
            if (issueDate && typeof issueDate === 'string' && !dateUtils_1.DATE_RE.test(issueDate)) {
                return res.status(400).json({ error: "Formato de data inválido. Use YYYY-MM-DD" });
            }
            const changed = (name && name !== existing.name) || (cpf && cpf !== existing.cpf) || (issueDate && (0, dateUtils_1.default)(issueDate).getTime() !== existing.issueDate.getTime());
            if (!changed)
                return res.status(400).json({ error: "Nenhuma alteração detectada" });
            if (cpf && !(0, validators_1.isCpfValid)(cpf))
                return res.status(400).json({ error: "CPF inválido" });
            const dup = cpf ? await prisma_1.prisma.beneficiary.findFirst({ where: { profileId: existing.profileId, program: existing.program, cpf, NOT: { id } } }) : null;
            if (dup)
                return res.status(409).json({ error: "CPF já cadastrado" });
            // Sem troca de CPF: atualização simples
            if (!cpf || cpf === existing.cpf) {
                const newIssueDate = issueDate ? (0, dateUtils_1.default)(issueDate) : existing.issueDate;
                const newStatus = (0, statusCalculator_1.computeStatus)(existing.program, newIssueDate, existing.changeDate ?? null, new Date());
                const updated = await prisma_1.prisma.beneficiary.update({
                    where: { id },
                    data: {
                        name: name ?? existing.name,
                        issueDate: newIssueDate,
                        status: newStatus
                    }
                });
                return res.json(updated);
            }
            // Troca AZUL: cria novo registro e marca ambos como PENDENTE
            const now = new Date();
            const newIssueDate = issueDate ? (0, dateUtils_1.default)(issueDate) : now;
            // Impede data futura
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const newDateOnly = new Date(newIssueDate);
            newDateOnly.setHours(0, 0, 0, 0);
            if (newDateOnly > today)
                return res.status(400).json({ error: "A data de cadastro não pode ser futura" });
            // Marca registro antigo como PENDENTE
            await prisma_1.prisma.beneficiary.update({ where: { id }, data: { changeDate: now, status: client_1.Status.PENDENTE } });
            // Novo registro aponta para o anterior via previous*
            const createdNew = await prisma_1.prisma.beneficiary.create({
                data: {
                    profileId: existing.profileId,
                    program: existing.program,
                    name: name ?? existing.name,
                    cpf: cpf ?? existing.cpf,
                    issueDate: newIssueDate,
                    previousName: existing.name,
                    previousCpf: existing.cpf,
                    previousDate: existing.issueDate,
                    changeDate: now,
                    status: client_1.Status.PENDENTE
                }
            });
            const dayMs = 24 * 60 * 60 * 1000;
            const diffDays = Math.floor((today.getTime() - newDateOnly.getTime()) / dayMs);
            if (diffDays >= 30) {
                await prisma_1.prisma.beneficiary.delete({ where: { id } });
                const finalized = await prisma_1.prisma.beneficiary.update({
                    where: { id: createdNew.id },
                    data: {
                        status: client_1.Status.UTILIZADO,
                        changeDate: null,
                        previousName: null,
                        previousCpf: null,
                        previousDate: null,
                    },
                });
                return res.json(finalized);
            }
            return res.json(createdNew);
        }
        // LATAM/SMILES
        if (cpf && !(0, validators_1.isCpfValid)(cpf))
            return res.status(400).json({ error: "CPF inválido" });
        if (cpf && cpf !== existing.cpf) {
            const dup = await prisma_1.prisma.beneficiary.findFirst({ where: { profileId: existing.profileId, program: existing.program, cpf } });
            if (dup)
                return res.status(409).json({ error: "CPF já cadastrado" });
        }
        // validar formato de issueDate se fornecida (PUT geral)
        if (issueDate && typeof issueDate === 'string' && !dateUtils_1.DATE_RE.test(issueDate)) {
            return res.status(400).json({ error: "Formato de data inválido. Use YYYY-MM-DD" });
        }
        const newIssue = issueDate ? (0, dateUtils_1.default)(issueDate) : existing.issueDate;
        const newStatus = (0, statusCalculator_1.computeStatus)(existing.program, newIssue, existing.changeDate ?? null, new Date());
        const updated = await prisma_1.prisma.beneficiary.update({
            where: { id },
            data: {
                name: name ?? existing.name,
                cpf: cpf ?? existing.cpf,
                issueDate: newIssue,
                status: newStatus
            }
        });
        return res.json(updated);
    }
    catch (err) {
        if (err?.code === 'P2002') {
            return res.status(409).json({ error: "CPF já cadastrado" });
        }
        console.error(err);
        return res.status(500).json({ error: "Erro interno" });
    }
});
// DELETE /beneficiaries/:id
router.delete("/beneficiaries/:id", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado." });
        }
        const existing = await prisma_1.prisma.beneficiary.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: "Não encontrado" });
        const profile = await prisma_1.prisma.profile.findUnique({ where: { id: existing.profileId } });
        if (!profile)
            return res.status(404).json({ error: "Perfil não encontrado" });
        if (profile.userId !== userId)
            return res.status(403).json({ error: "Acesso negado" });
        await prisma_1.prisma.beneficiary.delete({ where: { id } });
        return res.json({ ok: true });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Erro interno" });
    }
});
// DELETE /profiles/:profileId/beneficiaries?program=LATAM (limpa por programa)
router.delete("/profiles/:profileId/beneficiaries", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const { profileId } = req.params;
        const programQ = req.query.program?.toUpperCase();
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado." });
        }
        await (0, beneficiariesService_1.ensureProfileBelongsToUser)(profileId, userId);
        if (!programQ)
            return res.status(400).json({ error: "Informe 'program' como query param" });
        await prisma_1.prisma.beneficiary.deleteMany({ where: { profileId, program: programQ } });
        return res.json({ ok: true });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ error: err.message });
        console.error(err);
        return res.status(500).json({ error: "Erro interno" });
    }
});
// POST /beneficiaries/:id/cancel-change (AZUL)
router.post("/beneficiaries/:id/cancel-change", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado." });
        }
        const existing = await prisma_1.prisma.beneficiary.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: "Não encontrado" });
        const profile = await prisma_1.prisma.profile.findUnique({ where: { id: existing.profileId } });
        if (!profile)
            return res.status(404).json({ error: "Perfil não encontrado" });
        if (profile.userId !== userId)
            return res.status(403).json({ error: "Acesso negado" });
        if (existing.program !== "AZUL" || existing.status !== "PENDENTE") {
            return res.status(400).json({ error: "Apenas alterações pendentes do Azul podem ser canceladas" });
        }
        // Se for o novo (tem previous*): apaga-o e reverte o antigo
        if (existing.previousName) {
            // previousCpf e changeDate devem existir neste fluxo
            const prevCpf = existing.previousCpf;
            const prevChange = existing.changeDate;
            const old = await prisma_1.prisma.beneficiary.findFirst({ where: { profileId: existing.profileId, program: "AZUL", cpf: prevCpf, changeDate: prevChange } });
            if (old) {
                await prisma_1.prisma.beneficiary.update({ where: { id: old.id }, data: { changeDate: null, status: client_1.Status.UTILIZADO } });
            }
            await prisma_1.prisma.beneficiary.delete({ where: { id: existing.id } });
            return res.json({ ok: true });
        }
        // Se for o antigo (sem previous*): remove o par novo e reverte o antigo
        const pairedNew = await prisma_1.prisma.beneficiary.findFirst({ where: { profileId: existing.profileId, program: "AZUL", previousCpf: existing.cpf, changeDate: existing.changeDate } });
        if (pairedNew) {
            await prisma_1.prisma.beneficiary.delete({ where: { id: pairedNew.id } });
        }
        const reverted = await prisma_1.prisma.beneficiary.update({ where: { id }, data: { changeDate: null, status: client_1.Status.UTILIZADO } });
        return res.json(reverted);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Erro interno" });
    }
});
exports.default = router;
