import { describe, expect, it } from "vitest";

import {
  formatCpfDisplay,
  isValidCpf,
  normalizeCpf,
} from "@/features/patients/domain/cpf";

describe("normalizeCpf", () => {
  it("remove caracteres não numéricos", () => {
    expect(normalizeCpf("123.456.789-09")).toBe("12345678909");
  });

  it("retorna null para string vazia", () => {
    expect(normalizeCpf("")).toBeNull();
    expect(normalizeCpf(null)).toBeNull();
  });
});

describe("isValidCpf", () => {
  it("aceita CPF válido", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
  });

  it("rejeita CPF inválido", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });
});

describe("formatCpfDisplay", () => {
  it("formata 11 dígitos", () => {
    expect(formatCpfDisplay("52998224725")).toBe("529.982.247-25");
  });
});
