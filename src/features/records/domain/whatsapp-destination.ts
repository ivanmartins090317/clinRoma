export type WhatsAppContactSource = "patient_phone" | "secondary_phone";

export interface PatientPhonesInput {
  contactPhone?: string | null;
  secondaryPhone?: string | null;
  secondaryPhoneNote?: string | null;
}

export interface ResolvedWhatsAppDestination {
  digits: string;
  contactSource: WhatsAppContactSource;
  note: string | null;
}

const MARIA_SEED_PHONE = "11999990001";

export const WHATSAPP_DESTINATION_EXAMPLES = {
  mariaSeedPhone: MARIA_SEED_PHONE,
} as const;

export function extractPhoneDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function toWhatsAppDestination(digits: string): string | null {
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  if (
    (digits.length === 12 || digits.length === 13) &&
    digits.startsWith("55")
  ) {
    return digits;
  }

  return null;
}

export function resolveWhatsAppDestination(
  phones: PatientPhonesInput,
): ResolvedWhatsAppDestination | null {
  const primary = toWhatsAppDestination(
    extractPhoneDigits(phones.contactPhone),
  );
  if (primary) {
    return {
      digits: primary,
      contactSource: "patient_phone",
      note: null,
    };
  }

  const secondary = toWhatsAppDestination(
    extractPhoneDigits(phones.secondaryPhone),
  );
  if (secondary) {
    const note = (phones.secondaryPhoneNote ?? "").trim();
    return {
      digits: secondary,
      contactSource: "secondary_phone",
      note: note.length > 0 ? note : null,
    };
  }

  return null;
}

export function formatWhatsAppDigits(digits: string): string {
  if (digits.startsWith("55") && digits.length === 13) {
    return `+55 ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  if (digits.startsWith("55") && digits.length === 12) {
    return `+55 ${digits.slice(2, 4)} ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  return digits;
}

export function formatWhatsAppDestinationNotice(
  destination: ResolvedWhatsAppDestination,
): string {
  const number = formatWhatsAppDigits(destination.digits);

  if (destination.contactSource === "secondary_phone" && destination.note) {
    return `Será enviado para ${number} (${destination.note})`;
  }

  return `Será enviado para ${number}`;
}
