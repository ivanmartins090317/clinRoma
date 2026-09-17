export interface ResetEmailContentInput {
  displayName: string;
  setPasswordUrl: string;
}

export interface ResetEmailContent {
  subject: string;
  html: string;
  text: string;
}

const CLINIC_NAME = "Clínica Neo Roma";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildResetEmailContent(
  input: ResetEmailContentInput,
): ResetEmailContent {
  const subject = `ClinRoma · Redefinir senha`;

  const text = [
    `Olá, ${input.displayName},`,
    "",
    "Recebemos um pedido para redefinir sua senha do ClinRoma.",
    "Se foi você, use o link abaixo:",
    input.setPasswordUrl,
    "",
    "O link é pessoal e expira. Se você não pediu, ignore este e-mail.",
    "",
    `${CLINIC_NAME} · mensagem automática do ClinRoma.`,
  ].join("\n");

  const html = `
    <p>Olá, <strong>${escapeHtml(input.displayName)}</strong>,</p>
    <p>Recebemos um pedido para redefinir sua senha do ClinRoma.</p>
    <p><a href="${escapeHtml(input.setPasswordUrl)}">Redefinir minha senha</a></p>
    <p>O link é pessoal e expira. Se você não pediu, ignore este e-mail.</p>
    <p style="color:#8a8480;font-size:12px;">${CLINIC_NAME} · mensagem automática do ClinRoma.</p>
  `.trim();

  return { subject, html, text };
}
