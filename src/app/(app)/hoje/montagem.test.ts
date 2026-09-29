import { describe, expect, it } from "vitest";

import {
  ATRASO_ENTRE_BLOCOS_MS,
  AVISO_BLOCO_FALHOU,
  atrasosDaLeva,
} from "@/app/(app)/hoje/lugar-reservado";
import { blocosDaHoje, ORDEM_BLOCO } from "@/app/(app)/hoje/page";

describe("atrasosDaLeva", () => {
  it("um bloco sozinho entra sem espera", () => {
    expect(atrasosDaLeva([ORDEM_BLOCO.estoque])).toEqual([0]);
  });

  it("blocos que chegam juntos seguem a ordem visual, de 50 em 50 ms", () => {
    expect(
      atrasosDaLeva([
        ORDEM_BLOCO.whatsapp,
        ORDEM_BLOCO.numeros,
        ORDEM_BLOCO.estoque,
      ]),
    ).toEqual([ATRASO_ENTRE_BLOCOS_MS, 0, ATRASO_ENTRE_BLOCOS_MS * 2]);
  });
});

describe("blocosDaHoje", () => {
  it("admin vê a página inteira, na ordem visual", () => {
    expect(blocosDaHoje("admin")).toEqual([
      "saudacao",
      "numeros",
      "whatsapp",
      "consultas",
      "falhas",
      "fila",
      "estoque",
    ]);
  });

  it("dentista e recepção veem o card de WhatsApp e não veem falhas de lembrete", () => {
    const esperado = [
      "saudacao",
      "numeros",
      "whatsapp",
      "consultas",
      "fila",
      "estoque",
    ];

    expect(blocosDaHoje("dentist")).toEqual(esperado);
    expect(blocosDaHoje("reception")).toEqual(esperado);
  });

  it("visualizador não ganha card de WhatsApp nem falhas de lembrete", () => {
    expect(blocosDaHoje("viewer")).toEqual([
      "saudacao",
      "numeros",
      "consultas",
      "fila",
      "estoque",
    ]);
    expect(blocosDaHoje("viewer")).not.toContain("whatsapp");
    expect(blocosDaHoje("viewer")).not.toContain("falhas");
  });
});

describe("aviso de bloco", () => {
  it("usa a frase da spec, sem travessão", () => {
    expect(AVISO_BLOCO_FALHOU).toBe("Não foi possível carregar agora.");
    expect(AVISO_BLOCO_FALHOU).not.toContain("—");
  });
});
