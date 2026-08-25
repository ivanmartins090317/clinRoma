import { describe, expect, it } from "vitest";

import {
  SECONDARY_PHONE_ERRORS,
  SECONDARY_PHONE_MAX_LENGTH,
  SECONDARY_PHONE_NOTE_MAX_LENGTH,
  hasSecondaryPhone,
  normalizeSecondaryContact,
  prepareSecondaryContact,
  secondaryContactAuditState,
  validateSecondaryContact,
} from "@/features/patients/domain/secondary-phone";

describe("normalizeSecondaryContact", () => {
  it("trata campos vazios e só espaços como ausentes", () => {
    expect(
      normalizeSecondaryContact({
        secondaryPhone: "   ",
        secondaryPhoneNote: "",
      }),
    ).toEqual({ secondaryPhone: null, secondaryPhoneNote: null });
  });

  it("remove espaços nas pontas do número e da observação", () => {
    expect(
      normalizeSecondaryContact({
        secondaryPhone: "  11999998888  ",
        secondaryPhoneNote: "  filho  ",
      }),
    ).toEqual({
      secondaryPhone: "11999998888",
      secondaryPhoneNote: "filho",
    });
  });
});

describe("validateSecondaryContact", () => {
  it("aceita cadastro sem segundo contato", () => {
    expect(validateSecondaryContact({})).toBeNull();
    expect(
      validateSecondaryContact({
        secondaryPhone: "   ",
        secondaryPhoneNote: "  ",
      }),
    ).toBeNull();
  });

  it("aceita segundo telefone sem observação", () => {
    expect(
      validateSecondaryContact({ secondaryPhone: "11988887777" }),
    ).toBeNull();
  });

  it("recusa observação sem segundo telefone", () => {
    expect(
      validateSecondaryContact({
        secondaryPhone: "  ",
        secondaryPhoneNote: "filho",
      }),
    ).toBe(SECONDARY_PHONE_ERRORS.noteWithoutPhone);
  });

  it("recusa segundo telefone acima de 40 caracteres", () => {
    expect(
      validateSecondaryContact({
        secondaryPhone: "1".repeat(SECONDARY_PHONE_MAX_LENGTH + 1),
      }),
    ).toBe(SECONDARY_PHONE_ERRORS.phoneTooLong);
  });

  it("aceita segundo telefone no teto de 40 caracteres", () => {
    expect(
      validateSecondaryContact({
        secondaryPhone: "1".repeat(SECONDARY_PHONE_MAX_LENGTH),
      }),
    ).toBeNull();
  });

  it("recusa observação acima de 120 caracteres", () => {
    expect(
      validateSecondaryContact({
        secondaryPhone: "11988887777",
        secondaryPhoneNote: "a".repeat(SECONDARY_PHONE_NOTE_MAX_LENGTH + 1),
      }),
    ).toBe(SECONDARY_PHONE_ERRORS.noteTooLong);
  });

  it("aceita observação no teto de 120 caracteres", () => {
    expect(
      validateSecondaryContact({
        secondaryPhone: "11988887777",
        secondaryPhoneNote: "a".repeat(SECONDARY_PHONE_NOTE_MAX_LENGTH),
      }),
    ).toBeNull();
  });
});

describe("prepareSecondaryContact", () => {
  it("devolve o contato normalizado quando válido", () => {
    expect(
      prepareSecondaryContact({
        secondaryPhone: "  11999998888  ",
        secondaryPhoneNote: " esposa ",
      }),
    ).toEqual({
      ok: true,
      value: {
        secondaryPhone: "11999998888",
        secondaryPhoneNote: "esposa",
      },
    });
  });

  it("devolve o erro de domínio quando a observação fica órfã", () => {
    expect(prepareSecondaryContact({ secondaryPhoneNote: "cuidador" })).toEqual(
      {
        ok: false,
        error: SECONDARY_PHONE_ERRORS.noteWithoutPhone,
      },
    );
  });
});

describe("hasSecondaryPhone", () => {
  it("só considera o bloco visível quando há número", () => {
    expect(hasSecondaryPhone("11999998888")).toBe(true);
    expect(hasSecondaryPhone("  ")).toBe(false);
    expect(hasSecondaryPhone(null)).toBe(false);
  });
});

describe("secondaryContactAuditState", () => {
  it("marca informado quando o número passa a existir", () => {
    expect(
      secondaryContactAuditState({
        previousPresent: false,
        nextPresent: true,
      }),
    ).toBe("informed");
  });

  it("marca removido quando o número deixa de existir", () => {
    expect(
      secondaryContactAuditState({
        previousPresent: true,
        nextPresent: false,
      }),
    ).toBe("removed");
  });

  it("marca ausente no cadastro sem segundo contato", () => {
    expect(
      secondaryContactAuditState({
        previousPresent: null,
        nextPresent: false,
      }),
    ).toBe("absent");
  });
});
