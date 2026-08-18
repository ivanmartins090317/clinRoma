const QR_PREFIX = "CR-";
const QR_BODY_LENGTH = 12;
const QR_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function isValidSupplyQrCode(value: string): boolean {
  if (!value.startsWith(QR_PREFIX)) {
    return false;
  }

  const body = value.slice(QR_PREFIX.length);

  if (body.length !== QR_BODY_LENGTH) {
    return false;
  }

  return [...body].every((character) => QR_ALPHABET.includes(character));
}

export function generateSupplyQrCode(randomValues: number[]): string {
  if (randomValues.length !== QR_BODY_LENGTH) {
    throw new Error("Quantidade de entropia inválida para QR");
  }

  const body = randomValues
    .map((value) => QR_ALPHABET[value % QR_ALPHABET.length])
    .join("");

  return `${QR_PREFIX}${body}`;
}

export function normalizeScannedQrCode(raw: string): string {
  return raw.trim().toUpperCase();
}
