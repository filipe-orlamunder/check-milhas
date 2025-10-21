// client/src/api.ts

/**
 * URL base da API.
 */
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * Constrói os cabeçalhos de requisição padrão.
 * @param token Token de autenticação opcional.
 */
function buildHeaders(token?: string | null): Headers {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  // Adiciona o cabeçalho de Autorização se um token for fornecido.
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }
  return headers;
}

/**
 * Executa uma requisição POST à API.
 * @param path O endpoint da API.
 * @param body O corpo da requisição (payload).
 * @param token Token de autenticação opcional.
 * @returns A resposta da API.
 */
export async function apiPost(
  path: string,
  body: any,
  token?: string | null
): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  });

  // Tenta analisar o JSON da resposta, falhando para um objeto vazio em caso de erro.
  const data = await res.json().catch(() => ({}));

  // Lança um erro para respostas HTTP não-OK.
  if (!res.ok) {
    throw { status: res.status, body: data };
  }

  return data;
}

/**
 * Executa uma requisição GET à API.
 * @param path O endpoint da API.
 * @param token Token de autenticação opcional.
 * @returns A resposta da API.
 */
export async function apiGet(path: string, token?: string | null): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: buildHeaders(token),
  });

  // Tenta analisar o JSON da resposta, falhando para um objeto vazio em caso de erro.
  const data = await res.json().catch(() => ({}));

  // Lança um erro para respostas HTTP não-OK.
  if (!res.ok) {
    throw { status: res.status, body: data };
  }

  return data;
}
