import { Suspense } from "react";

import { getActiveDentists } from "@/features/agenda/queries";
import { isSessionWorking } from "@/features/whatsapp/domain/session-status";
import {
  canSeeWhatsAppMenuChip,
  WHATSAPP_COPY,
} from "@/features/whatsapp/permissions";
import { getClinicWhatsAppSessionStatus } from "@/features/whatsapp/queries";
import type { UserRole } from "@/types/clinroma";

export function contagemPronta(total: number | null): total is number {
  return total !== null;
}

export function chipWhatsAppPronto(
  role: UserRole,
  status: string | null | undefined,
): status is string | null {
  return canSeeWhatsAppMenuChip(role) && status !== undefined;
}

function ChipPiloto() {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full border border-[#e5c98d] bg-neo-gold-soft px-2.5 py-1 text-[12.5px] font-bold tracking-[0.04em] text-[#6e4e0e]"
      title="Este ambiente é o piloto do projeto"
    >
      PILOTO
    </span>
  );
}

function ChipDentistas({ total }: { total: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neo-cream-line bg-neo-cream-soft px-2.5 py-1 text-[12.5px] text-muted-foreground"
      title="Dentistas ativos na clínica"
    >
      <b className="font-semibold text-foreground">{total}</b>
      dentistas ativos
    </span>
  );
}

function ChipSla() {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neo-cream-line bg-neo-cream-soft px-2.5 py-1 text-[12.5px] text-muted-foreground"
      title="Tempo de validade dos links de oferta de horário"
    >
      SLA da fila: <b className="font-semibold text-foreground">40 min</b>
    </span>
  );
}

function ChipQr() {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neo-cream-line bg-neo-cream-soft px-2.5 py-1 text-[12.5px] text-muted-foreground"
      title="Leitura de QR de estoque habilitada"
    >
      <span aria-hidden className="size-1.75 rounded-full bg-priority-green" />
      QR estoque ativo
    </span>
  );
}

function ChipWhatsApp({ status }: { status: string | null }) {
  const whatsappWorking = isSessionWorking(status);

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neo-cream-line bg-neo-cream-soft px-2.5 py-1 text-[12.5px] text-muted-foreground"
      title={
        whatsappWorking
          ? "WhatsApp da clínica conectado"
          : "WhatsApp da clínica desconectado"
      }
    >
      <span
        aria-hidden
        className={
          whatsappWorking
            ? "size-1.75 rounded-full bg-priority-green"
            : "size-1.75 animate-pulse rounded-full bg-priority-red motion-reduce:animate-none"
        }
      />
      {whatsappWorking ? WHATSAPP_COPY.chipOn : WHATSAPP_COPY.chipOff}
    </span>
  );
}

async function ContagemDentistas() {
  let total: number | null = null;

  try {
    const dentists = await getActiveDentists();
    total = dentists.length;
  } catch {
    total = null;
  }

  if (!contagemPronta(total)) return null;

  return <ChipDentistas total={total} />;
}

async function ChipWhatsAppAoVivo({ role }: { role: UserRole }) {
  let status: string | null | undefined;

  try {
    status = await getClinicWhatsAppSessionStatus();
  } catch {
    status = undefined;
  }

  if (!chipWhatsAppPronto(role, status)) return null;

  return <ChipWhatsApp status={status} />;
}

interface MenuChipsAoVivoProps {
  role: UserRole;
}

export function MenuChipsAoVivo({ role }: MenuChipsAoVivoProps) {
  return (
    <div
      aria-label="Estado do sistema"
      className="flex flex-wrap items-center gap-2"
    >
      <ChipPiloto />
      <Suspense fallback={null}>
        <ContagemDentistas />
      </Suspense>
      <ChipSla />
      <ChipQr />
      {canSeeWhatsAppMenuChip(role) ? (
        <Suspense fallback={null}>
          <ChipWhatsAppAoVivo role={role} />
        </Suspense>
      ) : null}
    </div>
  );
}
