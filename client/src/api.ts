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
 * Tipado genericamente para facilitar o consumo.
 */
export async function apiPost<TResponse = any, TBody = any>(
  path: string,
  body: TBody,
  token?: string | null
): Promise<TResponse> {
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

  return data as TResponse;
}

/**
 * Executa uma requisição GET à API.
 * @param path O endpoint da API.
 * @param token Token de autenticação opcional.
 * @returns A resposta da API.
 */
export async function apiGet<TResponse = any>(path: string, token?: string | null): Promise<TResponse> {
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

  return data as TResponse;
}

/**
 * Executa uma requisição DELETE à API.
 * @param path O endpoint da API (ex.: "/profiles/:id").
 * @param token Token de autenticação opcional.
 * @returns A resposta da API (quando houver corpo) ou um objeto vazio.
 */
export async function apiDelete<TResponse = any>(path: string, token?: string | null): Promise<TResponse> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: buildHeaders(token),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw { status: res.status, body: data };
  }

  return data as TResponse;
}

/**
 * Executa uma requisição PUT à API.
 * Mantém as mesmas convenções de erro e headers dos demais métodos.
 */
export async function apiPut<TResponse = any, TBody = any>(
  path: string,
  body: TBody,
  token?: string | null
): Promise<TResponse> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw { status: res.status, body: data };
  }
  return data as TResponse;
}
