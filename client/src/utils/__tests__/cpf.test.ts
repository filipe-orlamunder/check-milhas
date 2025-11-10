import { describe, it, expect } from "vitest";
import { isValidCPF } from "../cpf";

describe("utils/cpf", () => {
  it("aceita um CPF válido", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
  });

  it("rejeita CPFs com dígitos repetidos", () => {
    expect(isValidCPF("11111111111")).toBe(false);
  });

  it("rejeita CPFs com dígitos verificadores incorretos", () => {
    expect(isValidCPF("52998224724")).toBe(false);
  });

  it("rejeita CPFs com quantidade incorreta de dígitos", () => {
    expect(isValidCPF("1234567890")).toBe(false);
  });
});
