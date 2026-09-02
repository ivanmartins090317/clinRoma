export function formatPartialPatientName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "Paciente";
  }

  if (parts.length === 1) {
    return parts[0]!;
  }

  const firstName = parts[0]!;
  const lastInitial = parts[parts.length - 1]!.charAt(0).toUpperCase();

  return `${firstName} ${lastInitial}.`;
}

const DENTIST_TITLE = /^(dr\.?|dra\.?)$/i;

export function formatDentistFirstName(
  fullName: string | null | undefined,
): string {
  if (!fullName?.trim()) {
    return "Dentista da clínica";
  }

  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "";

  if (DENTIST_TITLE.test(first)) {
    const givenName = parts[1];
    if (!givenName) {
      return "Dentista da clínica";
    }

    const title = /^dra/i.test(first) ? "Dra." : "Dr.";
    return `${title} ${givenName}`;
  }

  return first || "Dentista da clínica";
}
