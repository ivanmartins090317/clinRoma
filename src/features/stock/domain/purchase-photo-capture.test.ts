import { describe, expect, it } from "vitest";

import {
  PURCHASE_PHOTO_ACCEPT,
  PURCHASE_PHOTO_CAPTURE,
  purchasePhotoInputAttrs,
} from "./purchase-photo-capture";

describe("purchase-photo-capture", () => {
  it("pede a câmera traseira do sistema", () => {
    expect(PURCHASE_PHOTO_CAPTURE).toBe("environment");
  });

  it("aceita só JPEG, PNG e WebP", () => {
    expect(PURCHASE_PHOTO_ACCEPT).toBe("image/jpeg,image/png,image/webp");
  });

  it("monta os atributos do input de arquivo", () => {
    expect(purchasePhotoInputAttrs()).toEqual({
      type: "file",
      accept: PURCHASE_PHOTO_ACCEPT,
      capture: "environment",
    });
  });
});
