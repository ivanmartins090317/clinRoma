export const SECONDARY_PHONE_MAX_LENGTH = 40;
export const SECONDARY_PHONE_NOTE_MAX_LENGTH = 120;

export const SECONDARY_PHONE_ERRORS = {
  noteWithoutPhone:
    "Informe o segundo telefone ou deixe a observação em branco.",
  phoneTooLong: "Segundo telefone muito longo.",
  noteTooLong: "Observação muito longa.",
} as const;

export const SECONDARY_PHONE_COPY = {
  phoneLabel: "Segundo telefone",
  noteLabel: "Observação do contato",
  help: "Alguns pacientes mais velhos não têm WhatsApp. Este número é de um parente próximo.",
  notePlaceholder: "filho, esposa, cuidador",
} as const;

export interface SecondaryContactInput {
  secondaryPhone?: string | null;
  secondaryPhoneNote?: string | null;
}

export interface SecondaryContact {
  secondaryPhone: string | null;
  secondaryPhoneNote: string | null;
}

export type SecondaryContactAuditState = "informed" | "removed" | "absent";

function trimOrEmpty(value: string | null | undefined): string {
  return (value ?? "").trim();
}

export function normalizeSecondaryContact(
  input: SecondaryContactInput,
): SecondaryContact {
  const phone = trimOrEmpty(input.secondaryPhone);
  const note = trimOrEmpty(input.secondaryPhoneNote);

  return {
    secondaryPhone: phone.length === 0 ? null : phone,
    secondaryPhoneNote: note.length === 0 ? null : note,
  };
}

export function validateSecondaryContact(
  input: SecondaryContactInput,
): string | null {
  const { secondaryPhone, secondaryPhoneNote } =
    normalizeSecondaryContact(input);

  if (secondaryPhoneNote && !secondaryPhone) {
    return SECONDARY_PHONE_ERRORS.noteWithoutPhone;
  }

  if (secondaryPhone && secondaryPhone.length > SECONDARY_PHONE_MAX_LENGTH) {
    return SECONDARY_PHONE_ERRORS.phoneTooLong;
  }

  if (
    secondaryPhoneNote &&
    secondaryPhoneNote.length > SECONDARY_PHONE_NOTE_MAX_LENGTH
  ) {
    return SECONDARY_PHONE_ERRORS.noteTooLong;
  }

  return null;
}

export function prepareSecondaryContact(
  input: SecondaryContactInput,
): { ok: true; value: SecondaryContact } | { ok: false; error: string } {
  const error = validateSecondaryContact(input);

  if (error) {
    return { ok: false, error };
  }

  return { ok: true, value: normalizeSecondaryContact(input) };
}

export function hasSecondaryPhone(phone: string | null | undefined): boolean {
  return trimOrEmpty(phone).length > 0;
}

export function secondaryContactAuditState(input: {
  previousPresent: boolean | null;
  nextPresent: boolean;
}): SecondaryContactAuditState {
  if (input.nextPresent) {
    return "informed";
  }

  if (input.previousPresent === true) {
    return "removed";
  }

  return "absent";
}
