"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNameValid = isNameValid;
exports.isCpfValid = isCpfValid;
exports.isEmailValid = isEmailValid;
// src/utils/validators.ts
function isNameValid(name) {
    if (!name)
        return false;
    const trimmed = name.trim();
    if (trimmed.length < 4 || trimmed.length > 60)
        return false;
    // aceita letras (incluindo acentos), espaços, hífen e apóstrofo
    return /^[A-Za-zÀ-ÖØ-öø-ÿ'\-\s]+$/.test(trimmed);
}
function isCpfValid(cpf) {
    if (!cpf)
        return false;
    return /^\d{11}$/.test(cpf);
}
function isEmailValid(email) {
    if (!email)
        return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
