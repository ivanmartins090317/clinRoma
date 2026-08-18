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

export function formatDentistFirstName(
  fullName: string | null | undefined,
): string {
  if (!fullName?.trim()) {
    return "Dentista da clínica";
  }

  return fullName.trim().split(/\s+/)[0] ?? "Dentista da clínica";
}
