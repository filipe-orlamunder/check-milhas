"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beneficiariesStore = void 0;
exports.generateId = generateId;
const crypto_1 = require("crypto");
// estrutura em memória: userId -> lista de beneficiários
exports.beneficiariesStore = {};
// função util para criar ID
function generateId() {
    return (0, crypto_1.randomUUID)();
}
