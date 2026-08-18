import { describe, expect, it } from "vitest";

import {
  AUDIO_MAX_BYTES,
  PHOTO_MAX_BYTES,
  validateAttachmentLimits,
} from "@/features/records/domain/attachment-limits";

describe("validateAttachmentLimits", () => {
  it("aceita foto JPEG dentro do limite", () => {
    expect(
      validateAttachmentLimits({
        mimeType: "image/jpeg",
        fileSizeBytes: 1024,
        attachmentType: "photo",
      }),
    ).toBeNull();
  });

  it("rejeita foto com MIME inválido", () => {
    expect(
      validateAttachmentLimits({
        mimeType: "application/pdf",
        fileSizeBytes: 1024,
        attachmentType: "photo",
      }),
    ).toMatch(/Formato de foto/);
  });

  it("rejeita foto acima de 10 MB", () => {
    expect(
      validateAttachmentLimits({
        mimeType: "image/png",
        fileSizeBytes: PHOTO_MAX_BYTES + 1,
        attachmentType: "photo",
      }),
    ).toMatch(/10 MB/);
  });

  it("aceita áudio webm dentro do limite", () => {
    expect(
      validateAttachmentLimits({
        mimeType: "audio/webm",
        fileSizeBytes: 1024,
        attachmentType: "audio",
      }),
    ).toBeNull();
  });

  it("rejeita áudio acima de 50 MB", () => {
    expect(
      validateAttachmentLimits({
        mimeType: "audio/mp4",
        fileSizeBytes: AUDIO_MAX_BYTES + 1,
        attachmentType: "audio",
      }),
    ).toMatch(/50 MB/);
  });
});
