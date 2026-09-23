/** Accept e captura nativa do input de foto da compra (sem viewfinder no app). */
export const PURCHASE_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";

/** Pede a câmera traseira no celular; no desktop o navegador ignora. */
export const PURCHASE_PHOTO_CAPTURE = "environment" as const;

export interface PurchasePhotoInputAttrs {
  type: "file";
  accept: string;
  capture: "environment";
}

export function purchasePhotoInputAttrs(): PurchasePhotoInputAttrs {
  return {
    type: "file",
    accept: PURCHASE_PHOTO_ACCEPT,
    capture: PURCHASE_PHOTO_CAPTURE,
  };
}
