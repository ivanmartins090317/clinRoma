import type { UserRole } from "@/types/clinroma";

export function canViewClinicalContent(role: UserRole): boolean {
  return role === "admin" || role === "dentist" || role === "reception";
}

export function canRegisterEvolution(role: UserRole): boolean {
  return role === "admin" || role === "dentist";
}

export function canWriteClinicalChart(role: UserRole): boolean {
  return role === "admin" || role === "dentist" || role === "reception";
}

export function canGenerateAnamnesisInvite(role: UserRole): boolean {
  return canWriteClinicalChart(role);
}

export function canSendPatientWhatsApp(role: UserRole): boolean {
  return canWriteClinicalChart(role);
}

export function canRetryTranscription(role: UserRole): boolean {
  return role === "admin" || role === "dentist";
}

export function canCorrectTranscription(role: UserRole): boolean {
  return canRetryTranscription(role);
}
