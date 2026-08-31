/** Sem 0/O/1/l/I: a senha é lida em voz alta ou copiada da tela pelo admin. */
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const SYMBOLS = "!@#$%&*";
const DEFAULT_LENGTH = 14;

export interface TempPasswordOptions {
  length?: number;
  randomBytes?: (size: number) => Uint8Array;
}

function defaultRandomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}

function pick(alphabet: string, byte: number): string {
  return alphabet[byte % alphabet.length]!;
}

export function generateTempPassword(
  options: TempPasswordOptions = {},
): string {
  const length = Math.max(options.length ?? DEFAULT_LENGTH, 12);
  const randomBytes = options.randomBytes ?? defaultRandomBytes;
  const bytes = randomBytes(length);

  const body = Array.from(bytes.slice(0, length - 1), (byte) =>
    pick(PASSWORD_ALPHABET, byte),
  ).join("");

  return `${body}${pick(SYMBOLS, bytes[length - 1] ?? 0)}`;
}

export function isStrongTempPassword(value: string): boolean {
  if (value.length < 12) {
    return false;
  }

  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasDigitOrSymbol = /[0-9!@#$%&*]/.test(value);

  return hasLower && hasUpper && hasDigitOrSymbol;
}
