import { describe, expect, it } from "vitest";

import {
  MAX_SUGGESTED_PURCHASE_LINES,
  sanitizeExtractedPurchaseLines,
  validatePurchaseSheetFile,
} from "@/lib/stock/extract-purchase-sheet";
import { getModuleAccess } from "@/lib/auth/roles";

describe("validatePurchaseSheetFile", () => {
  it("aceita JPEG até 10 MB", () => {
    expect(
      validatePurchaseSheetFile({
        fileName: "nota.jpg",
        mimeType: "image/jpeg",
        fileSizeBytes: 10 * 1024 * 1024,
      }),
    ).toEqual({ ok: true });
  });

  it("recusa formato inválido", () => {
    expect(
      validatePurchaseSheetFile({
        fileName: "nota.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 1000,
      }),
    ).toEqual({ ok: false, error: "Use JPEG, PNG ou WebP" });
  });

  it("recusa arquivo acima de 10 MB", () => {
    expect(
      validatePurchaseSheetFile({
        fileName: "nota.png",
        mimeType: "image/png",
        fileSizeBytes: 10 * 1024 * 1024 + 1,
      }),
    ).toEqual({ ok: false, error: "Arquivo acima de 10 MB" });
  });
});

describe("sanitizeExtractedPurchaseLines", () => {
  it("descarta quantidade, data e unidade inválidas", () => {
    const { lines, truncated } = sanitizeExtractedPurchaseLines({
      lines: [
        {
          name: "Luva",
          quantityPerPackage: -1,
          packageCount: 1.5,
          lotNumber: "  ",
          expiresAt: "31/12/2027",
          unit: "palete",
        },
      ],
    });

    expect(truncated).toBe(false);
    expect(lines).toEqual([
      {
        name: "Luva",
        quantityPerPackage: null,
        packageCount: null,
        lotNumber: null,
        expiresAt: null,
        unit: null,
      },
    ]);
  });

  it("mantém campos reconhecíveis", () => {
    const { lines } = sanitizeExtractedPurchaseLines({
      lines: [
        {
          name: "Gaze",
          quantityPerPackage: 100,
          packageCount: 2,
          lotNumber: "L1",
          expiresAt: "2027-12-01",
          unit: "caixa",
        },
      ],
    });

    expect(lines[0]).toEqual({
      name: "Gaze",
      quantityPerPackage: 100,
      packageCount: 2,
      lotNumber: "L1",
      expiresAt: "2027-12-01",
      unit: "box",
    });
  });

  it("limita a 40 linhas e sinaliza truncamento", () => {
    const raw = Array.from({ length: 45 }, (_, index) => ({
      name: `Item ${index + 1}`,
      quantityPerPackage: 1,
      packageCount: 1,
    }));

    const { lines, truncated } = sanitizeExtractedPurchaseLines({ lines: raw });

    expect(lines).toHaveLength(MAX_SUGGESTED_PURCHASE_LINES);
    expect(truncated).toBe(true);
    expect(lines[0]?.name).toBe("Item 1");
    expect(lines[39]?.name).toBe("Item 40");
  });

  it("ignora linhas sem nome", () => {
    const { lines } = sanitizeExtractedPurchaseLines({
      lines: [{ name: "  " }, { quantityPerPackage: 10 }],
    });
    expect(lines).toEqual([]);
  });
});

describe("recusa de insumo novo para auxiliar", () => {
  it("auxiliar não tem escrita em estoque (não cadastra insumo)", () => {
    expect(getModuleAccess("room_assistant", "stock")).toBe("read");
    expect(getModuleAccess("admin", "stock")).toBe("write");
  });
});
