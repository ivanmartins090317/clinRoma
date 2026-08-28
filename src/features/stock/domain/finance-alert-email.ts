import { formatInTimeZone } from "date-fns-tz";

import { SUPPLY_UNIT_LABELS } from "@/features/stock/lib/clinic-date";

export type FinanceAlertSupplyUnit = keyof typeof SUPPLY_UNIT_LABELS;

export interface FinanceAlertEmailContentInput {
  supplyName: string;
  currentQuantity: number;
  minimumQuantity: number;
  unit: FinanceAlertSupplyUnit;
  alertedAt: Date;
  stockUrl: string;
}

export interface FinanceAlertEmailContent {
  subject: string;
  html: string;
  text: string;
}

const CLINIC_NAME = "Clínica Neo Roma";
const CLINIC_TIMEZONE = "America/Sao_Paulo";
const PROVIDER_ERROR = "Não foi possível enviar o e-mail.";
const CONFIG_ERROR = "Serviço de e-mail não configurado.";

export function getFinanceAlertProviderError(): string {
  return PROVIDER_ERROR;
}

export function getFinanceAlertConfigError(): string {
  return CONFIG_ERROR;
}

export function formatFinanceAlertQuantity(value: number): string {
  return String(value);
}

export function buildFinanceAlertEmailContent(
  input: FinanceAlertEmailContentInput,
): FinanceAlertEmailContent {
  const unitLabel = SUPPLY_UNIT_LABELS[input.unit];
  const current = formatFinanceAlertQuantity(input.currentQuantity);
  const minimum = formatFinanceAlertQuantity(input.minimumQuantity);
  const when = formatInTimeZone(
    input.alertedAt,
    CLINIC_TIMEZONE,
    "dd/MM/yyyy HH:mm",
  );
  const line = `${input.supplyName}: ${current} de ${minimum} (${unitLabel}).`;
  const subject = `ClinRoma · Estoque baixo · ${input.supplyName}`;

  const text = [
    "Olá, financeiro.",
    "",
    "O insumo abaixo precisa de reposição.",
    line,
    `Aviso em ${when}.`,
    "",
    `Abrir estoque: ${input.stockUrl}`,
    "",
    `${CLINIC_NAME}. Mensagem automática, não responda.`,
  ].join("\n");

  const html = `
    <p>Olá, financeiro.</p>
    <p>O insumo abaixo precisa de reposição.</p>
    <p><strong>${escapeHtml(line)}</strong></p>
    <p>Aviso em ${when}.</p>
    <p><a href="${escapeHtml(input.stockUrl)}">Abrir estoque</a></p>
    <p style="color:#8a8480;font-size:12px;">${CLINIC_NAME}. Mensagem automática, não responda.</p>
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
