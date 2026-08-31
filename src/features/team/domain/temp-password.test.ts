import { describe, expect, it } from "vitest";

import {
  generateTempPassword,
  isStrongTempPassword,
} from "@/features/team/domain/temp-password";

function fakeRandomBytes(size: number): Uint8Array {
  return Uint8Array.from({ length: size }, (_, index) => index * 7);
}

describe("generateTempPassword", () => {
  it("respeita o tamanho pedido", () => {
    expect(generateTempPassword({ length: 16 }).length).toBe(16);
  });

  it("nunca gera senha abaixo de 12 caracteres", () => {
    expect(generateTempPassword({ length: 4 }).length).toBe(12);
  });

  it("não usa caracteres ambíguos", () => {
    const password = generateTempPassword({
      length: 40,
      randomBytes: fakeRandomBytes,
    });

    expect(password).not.toMatch(/[0O1lI]/);
  });

  it("termina com símbolo para garantir variedade", () => {
    const password = generateTempPassword({ randomBytes: fakeRandomBytes });

    expect(password.at(-1)).toMatch(/[!@#$%&*]/);
  });

  it("gera senhas diferentes entre chamadas", () => {
    const first = generateTempPassword();
    const second = generateTempPassword();

    expect(first).not.toBe(second);
  });

  it("produz senha considerada forte", () => {
    expect(isStrongTempPassword(generateTempPassword())).toBe(true);
  });
});

describe("isStrongTempPassword", () => {
  it("recusa senha curta ou sem variedade", () => {
    expect(isStrongTempPassword("abc")).toBe(false);
    expect(isStrongTempPassword("abcdefghijklmno")).toBe(false);
    expect(isStrongTempPassword("ABCDEFGHIJKLMNO")).toBe(false);
    expect(isStrongTempPassword("abcdefgHijklmn9")).toBe(true);
  });
});
