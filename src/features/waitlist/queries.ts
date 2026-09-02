import { sortByWaitlistPriority } from "@/features/waitlist/domain/waitlist-priority";
import { createClient } from "@/lib/supabase/server";
import type { WaitlistPriorityColor } from "@/types/clinroma";

export type WaitlistEntryStatus =
  "waiting" | "offered" | "scheduled" | "cancelled" | "expired";

export interface WaitlistPendingOffer {
  id: string;
  expiresAt: string;
  offeredAt: string;
  endsAt: string;
  dentistId: string;
  dentistName: string;
  status: "pending" | "accepted" | "declined" | "expired";
}

export interface WaitlistBoardEntry {
  id: string;
  patientId: string;
  patientName: string;
  priority: WaitlistPriorityColor;
  reason: string | null;
  preferredDentistId: string | null;
  preferredDentistName: string | null;
  status: WaitlistEntryStatus;
  createdAt: string;
  pendingOffer: WaitlistPendingOffer | null;
  acceptedOffer: WaitlistPendingOffer | null;
}

export interface WaitlistSummary {
  waitingByPriority: Record<WaitlistPriorityColor, number>;
  totalWaiting: number;
  expiringSoon: Array<{
    entryId: string;
    patientName: string;
    expiresAt: string;
    minutesLeft: number;
  }>;
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapPendingOffer(row: {
  id: string;
  offered_at: string;
  ends_at: string;
  expires_at: string;
  dentist_id: string;
  status: WaitlistPendingOffer["status"];
  dentists: { full_name: string } | Array<{ full_name: string }> | null;
}): WaitlistPendingOffer {
  const dentist = unwrapRelation(row.dentists);

  return {
    id: row.id,
    offeredAt: row.offered_at,
    endsAt: row.ends_at,
    expiresAt: row.expires_at,
    dentistId: row.dentist_id,
    dentistName: dentist?.full_name ?? "Dentista",
    status: row.status,
  };
}

export async function getWaitlistBoardEntries(): Promise<WaitlistBoardEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("waitlist_entries")
    .select(
      `
      id,
      patient_id,
      priority,
      reason,
      preferred_dentist_id,
      status,
      created_at,
      patients(full_name),
      preferred_dentist:dentists!waitlist_entries_preferred_dentist_id_fkey(full_name),
      slot_offers(
        id,
        offered_at,
        ends_at,
        expires_at,
        dentist_id,
        status,
        dentists(full_name)
      )
    `,
    )
    .in("status", ["waiting", "offered", "scheduled"])
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar a fila");
  }

  const entries = (data ?? []).map((row) => {
    const patient = unwrapRelation(row.patients);
    const preferredDentist = unwrapRelation(row.preferred_dentist);
    const offers = Array.isArray(row.slot_offers) ? row.slot_offers : [];
    const pendingOfferRow = offers.find((offer) => offer.status === "pending");
    const acceptedOfferRow = offers.find((offer) => offer.status === "accepted");

    return {
      id: row.id,
      patientId: row.patient_id,
      patientName: patient?.full_name ?? "Paciente",
      priority: row.priority as WaitlistPriorityColor,
      reason: row.reason,
      preferredDentistId: row.preferred_dentist_id,
      preferredDentistName: preferredDentist?.full_name ?? null,
      status: row.status as WaitlistEntryStatus,
      createdAt: row.created_at,
      pendingOffer: pendingOfferRow
        ? mapPendingOffer(
            pendingOfferRow as Parameters<typeof mapPendingOffer>[0],
          )
        : null,
      acceptedOffer: acceptedOfferRow
        ? mapPendingOffer(
            acceptedOfferRow as Parameters<typeof mapPendingOffer>[0],
          )
        : null,
    };
  });

  const waiting = sortByWaitlistPriority(
    entries
      .filter((entry) => entry.status === "waiting")
      .sort(
        (left, right) =>
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime(),
      ),
  );

  const offered = entries
    .filter((entry) => entry.status === "offered")
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() -
        new Date(right.createdAt).getTime(),
    );

  const scheduled = entries
    .filter((entry) => entry.status === "scheduled")
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() -
        new Date(right.createdAt).getTime(),
    );

  return [...waiting, ...offered, ...scheduled];
}

export async function getWaitlistSummary(): Promise<WaitlistSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("waitlist_entries")
    .select(
      `
      id,
      priority,
      status,
      patients(full_name),
      slot_offers(id, expires_at, status)
    `,
    )
    .eq("status", "waiting");

  if (error) {
    throw new Error("Não foi possível carregar resumo da fila");
  }

  const waitingByPriority: Record<WaitlistPriorityColor, number> = {
    red: 0,
    yellow: 0,
    green: 0,
  };

  for (const row of data ?? []) {
    waitingByPriority[row.priority as WaitlistPriorityColor] += 1;
  }

  const { data: offeredRows, error: offeredError } = await supabase
    .from("waitlist_entries")
    .select(
      `
      id,
      patients(full_name),
      slot_offers!inner(id, expires_at, status)
    `,
    )
    .eq("status", "offered");

  if (offeredError) {
    throw new Error("Não foi possível carregar ofertas pendentes");
  }

  const now = Date.now();
  const expiringSoon: WaitlistSummary["expiringSoon"] = [];

  for (const row of offeredRows ?? []) {
    const offers = Array.isArray(row.slot_offers) ? row.slot_offers : [];
    const pending = offers.find((offer) => offer.status === "pending");

    if (!pending) {
      continue;
    }

    const expiresAt = new Date(pending.expires_at);
    const minutesLeft = Math.ceil((expiresAt.getTime() - now) / 60000);
    const patient = unwrapRelation(row.patients);

    if (minutesLeft <= 10 && minutesLeft > 0) {
      expiringSoon.push({
        entryId: row.id,
        patientName: patient?.full_name ?? "Paciente",
        expiresAt: pending.expires_at,
        minutesLeft,
      });
    }
  }

  return {
    waitingByPriority,
    totalWaiting: (data ?? []).length,
    expiringSoon: expiringSoon.sort((a, b) => a.minutesLeft - b.minutesLeft),
  };
}

export async function getWaitingEntriesForOffer(): Promise<
  Array<{
    id: string;
    patientName: string;
    priority: WaitlistPriorityColor;
    preferredDentistId: string | null;
  }>
> {
  const entries = await getWaitlistBoardEntries();

  return entries
    .filter((entry) => entry.status === "waiting")
    .map((entry) => ({
      id: entry.id,
      patientName: entry.patientName,
      priority: entry.priority,
      preferredDentistId: entry.preferredDentistId,
    }));
}
