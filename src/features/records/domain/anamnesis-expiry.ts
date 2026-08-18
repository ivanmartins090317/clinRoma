export const ANAMNESIS_VALIDITY_MONTHS = 12;

export interface AnamnesisExpiryInput {
  signedAt: string | Date | null | undefined;
  referenceDate?: Date;
}

export interface AnamnesisExpiryResult {
  isExpired: boolean;
  isMissing: boolean;
  signedAt: Date | null;
  expiresAt: Date | null;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function evaluateAnamnesisExpiry(
  input: AnamnesisExpiryInput,
): AnamnesisExpiryResult {
  const referenceDate = input.referenceDate ?? new Date();

  if (!input.signedAt) {
    return {
      isExpired: true,
      isMissing: true,
      signedAt: null,
      expiresAt: null,
    };
  }

  const signedAt =
    input.signedAt instanceof Date ? input.signedAt : new Date(input.signedAt);

  if (Number.isNaN(signedAt.getTime())) {
    return {
      isExpired: true,
      isMissing: true,
      signedAt: null,
      expiresAt: null,
    };
  }

  const expiresAt = addMonths(signedAt, ANAMNESIS_VALIDITY_MONTHS);

  return {
    isExpired: referenceDate.getTime() > expiresAt.getTime(),
    isMissing: false,
    signedAt,
    expiresAt,
  };
}
