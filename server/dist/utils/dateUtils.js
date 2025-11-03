"use strict";
// src/utils/dateUtils.ts
// Utilitários concisos para manipulação de datas em formato de dia.
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATE_RE = void 0;
exports.parseDateOnlyToLocal = parseDateOnlyToLocal;
// Valida strings no formato YYYY-MM-DD
exports.DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// Pequeno util para parsear strings no formato YYYY-MM-DD como data local 
function parseDateOnlyToLocal(input) {
    if (!input)
        return new Date();
    if (input instanceof Date)
        return input;
    const s = input;
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
        const y = Number(m[1]);
        const mo = Number(m[2]);
        const d = Number(m[3]);
        return new Date(y, mo - 1, d);
    }
    return new Date(s);
}
exports.default = parseDateOnlyToLocal;
