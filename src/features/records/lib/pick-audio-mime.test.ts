import { describe, expect, it } from "vitest";

import {
  normalizeAudioMime,
  pickSupportedAudioMime,
} from "@/features/records/lib/pick-audio-mime";

describe("pickSupportedAudioMime", () => {
  it("retorna primeiro MIME suportado", () => {
    const mime = pickSupportedAudioMime((type) => type.includes("webm"));

    expect(mime).toBe("audio/webm;codecs=opus");
  });

  it("retorna null se nenhum suportado", () => {
    expect(pickSupportedAudioMime(() => false)).toBeNull();
  });
});

describe("normalizeAudioMime", () => {
  it("normaliza webm com codec", () => {
    expect(normalizeAudioMime("audio/webm;codecs=opus")).toBe("audio/webm");
  });

  it("normaliza mp4", () => {
    expect(normalizeAudioMime("audio/mp4")).toBe("audio/mp4");
  });
});
