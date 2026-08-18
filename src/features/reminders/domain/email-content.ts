import { formatInTimeZone } from "date-fns-tz";

import { CLINIC_TIMEZONE } from "@/features/agenda/types";

export interface ReminderEmailContentInput {
  dentistName: string;
  patientFullName: string;
  startsAt: string;
  procedureName: string | null;
  notes: string | null;
  patientUrl: string;
}

export interface ReminderEmailContent {
  subject: string;
  html: string;
  text: string;
}

const CLINIC_NAME = "Clínica Neo Roma";
const SUMMARY_MAX_LENGTH = 120;

export function formatPatientPartialName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "Paciente";
  }

  if (parts.length === 1) {
    return parts[0]!;
  }

  const lastInitial = parts[parts.length - 1]!.charAt(0).toUpperCase();
  return `${parts[0]} ${lastInitial}.`;
}

export function truncateSummary(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.length <= SUMMARY_MAX_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, SUMMARY_MAX_LENGTH - 1)}…`;
}

export function buildReminderEmailContent(
  input: ReminderEmailContentInput,
): ReminderEmailContent {
  const patientLabel = formatPatientPartialName(input.patientFullName);
  const appointmentDate = formatInTimeZone(
    input.startsAt,
    CLINIC_TIMEZONE,
    "dd/MM",
  );
  const appointmentTime = formatInTimeZone(
    input.startsAt,
    CLINIC_TIMEZONE,
    "HH:mm",
  );
  const summary =
    truncateSummary(input.procedureName) ??
    truncateSummary(input.notes) ??
    "Consulta concluída";

  const subject = `ClinRoma · Pós-consulta · ${patientLabel} · ${appointmentDate}`;

  const text = [
    `Olá, ${input.dentistName},`,
    "",
    `Consulta concluída com ${patientLabel} em ${appointmentDate} às ${appointmentTime}.`,
    `Resumo: ${summary}`,
    "",
    `Abra a ficha do paciente: ${input.patientUrl}`,
    "",
    `${CLINIC_NAME} · mensagem automática do ClinRoma.`,
  ].join("\n");

  const html = `
    <p>Olá, <strong>${escapeHtml(input.dentistName)}</strong>,</p>
    <p>Consulta concluída com <strong>${escapeHtml(patientLabel)}</strong> em ${appointmentDate} às ${appointmentTime}.</p>
    <p>Resumo: ${escapeHtml(summary)}</p>
    <p><a href="${escapeHtml(input.patientUrl)}">Abrir ficha do paciente</a></p>
    <p style="color:#8a8480;font-size:12px;">${CLINIC_NAME} · mensagem automática do ClinRoma.</p>
  `.trim();

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
