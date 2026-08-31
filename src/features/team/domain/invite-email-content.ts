import { getRoleLabel } from "@/lib/auth/role-labels";
import type { UserRole } from "@/types/clinroma";

const CLINIC_NAME = "Clínica Neo Roma";

export interface InviteEmailContentInput {
  displayName: string;
  role: UserRole;
  setPasswordUrl: string;
}

export interface InviteEmailContent {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildInviteEmailContent(
  input: InviteEmailContentInput,
): InviteEmailContent {
  const roleLabel = getRoleLabel(input.role);
  const subject = `ClinRoma · Seu acesso à ${CLINIC_NAME}`;

  const text = [
    `Olá, ${input.displayName},`,
    "",
    `Seu acesso ao ClinRoma foi criado com o perfil ${roleLabel}.`,
    "Defina sua senha pelo link abaixo:",
    input.setPasswordUrl,
    "",
    "O link é pessoal e expira. Se vencer, peça um novo à administração.",
    "",
    `${CLINIC_NAME} · mensagem automática do ClinRoma.`,
  ].join("\n");

  const html = `
    <p>Olá, <strong>${escapeHtml(input.displayName)}</strong>,</p>
    <p>Seu acesso ao ClinRoma foi criado com o perfil <strong>${escapeHtml(roleLabel)}</strong>.</p>
    <p><a href="${escapeHtml(input.setPasswordUrl)}">Definir minha senha</a></p>
    <p>O link é pessoal e expira. Se vencer, peça um novo à administração.</p>
    <p style="color:#8a8480;font-size:12px;">${CLINIC_NAME} · mensagem automática do ClinRoma.</p>
  `.trim();

  return { subject, html, text };
}
