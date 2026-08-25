import { describe, expect, it } from "vitest";

import {
  evaluateTranscriptionCorrection,
  isTranscriptionEditable,
  TRANSCRIPTION_EDIT_ERRORS,
  TRANSCRIPTION_TEXT_MAX_LENGTH,
  validateTranscriptionText,
} from "@/features/records/domain/transcription-edit";
import type { TranscriptionStatus } from "@/features/records/domain/transcription-status";
import type { UserRole } from "@/types/clinroma";

const COMPLETED_AUDIO = {
  status: "completed" as const,
  attachmentType: "audio",
};

describe("isTranscriptionEditable", () => {
  it("permite correção só com transcrição concluída", () => {
    expect(isTranscriptionEditable("completed")).toBe(true);
    expect(isTranscriptionEditable("pending")).toBe(false);
    expect(isTranscriptionEditable("processing")).toBe(false);
    expect(isTranscriptionEditable("failed")).toBe(false);
  });
});

describe("validateTranscriptionText", () => {
  it("aceita texto válido e remove espaços nas pontas", () => {
    expect(validateTranscriptionText("  extração do dente 24  ")).toBeNull();
  });

  it("recusa texto vazio ou só espaços", () => {
    expect(validateTranscriptionText("")).toBe(TRANSCRIPTION_EDIT_ERRORS.empty);
    expect(validateTranscriptionText("   ")).toBe(
      TRANSCRIPTION_EDIT_ERRORS.empty,
    );
  });

  it("recusa texto acima de 10.000 caracteres", () => {
    expect(
      validateTranscriptionText("a".repeat(TRANSCRIPTION_TEXT_MAX_LENGTH + 1)),
    ).toBe(TRANSCRIPTION_EDIT_ERRORS.tooLong);
  });

  it("aceita texto no teto de 10.000 caracteres", () => {
    expect(
      validateTranscriptionText("a".repeat(TRANSCRIPTION_TEXT_MAX_LENGTH)),
    ).toBeNull();
  });
});

describe("evaluateTranscriptionCorrection", () => {
  it.each(["admin", "dentist"] as const)(
    "permite que %s corrija transcrição concluída",
    (role) => {
      const result = evaluateTranscriptionCorrection({
        role,
        ...COMPLETED_AUDIO,
        text: "  extração do dente 24  ",
      });

      expect(result).toEqual({
        ok: true,
        text: "extração do dente 24",
      });
    },
  );

  it.each(["reception", "viewer", "room_assistant"] as const)(
    "recusa que %s corrija transcrição",
    (role: UserRole) => {
      const result = evaluateTranscriptionCorrection({
        role,
        ...COMPLETED_AUDIO,
        text: "extração do dente 24",
      });

      expect(result).toEqual({
        ok: false,
        error: TRANSCRIPTION_EDIT_ERRORS.forbidden,
      });
    },
  );

  it.each(["pending", "processing", "failed"] as const)(
    "recusa correção enquanto a situação é %s",
    (status: TranscriptionStatus) => {
      const result = evaluateTranscriptionCorrection({
        role: "dentist",
        status,
        attachmentType: "audio",
        text: "extração do dente 24",
      });

      expect(result).toEqual({
        ok: false,
        error: TRANSCRIPTION_EDIT_ERRORS.notCompleted,
      });
    },
  );

  it("recusa anexo que não é áudio sem vazar detalhe", () => {
    const result = evaluateTranscriptionCorrection({
      role: "dentist",
      status: "completed",
      attachmentType: "photo",
      text: "extração do dente 24",
    });

    expect(result).toEqual({
      ok: false,
      error: TRANSCRIPTION_EDIT_ERRORS.generic,
    });
  });

  it("permite salvar o mesmo conteúdo já persistido", () => {
    const result = evaluateTranscriptionCorrection({
      role: "dentist",
      ...COMPLETED_AUDIO,
      text: "dente 24",
    });

    expect(result).toEqual({ ok: true, text: "dente 24" });
  });
});
