import type { AppointmentStatus } from "@/types/clinroma";

import { isActiveAppointmentStatus } from "./appointment-status";

const MINUTE_MS = 60_000;

export const THIRD_APPOINTMENT_MESSAGE =
  "Esse horário já tem duas consultas. Não é possível marcar outra.";

export const PAIR_CONFIRMATION_REJECTED_MESSAGE =
  "Não foi possível marcar as duas nesse horário.";

export const OVERLAP_TITLE = "Já existe uma consulta nesse horário";

export const OVERLAP_SUPPORT =
  "Isso serve para o início de uma cirurgia, enquanto a medicação faz efeito.";

export const OVERLAP_CONFIRM_LABEL = "Marcar as duas";

export const OVERLAP_CANCEL_LABEL = "Voltar";

export interface AppointmentInterval {
  id: string;
  dentistId: string;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentStatus;
  inductionMinutes?: number;
  patientName?: string;
}

export interface ConflictCheckInput {
  dentistId: string;
  startsAt: Date;
  endsAt: Date;
  excludeId?: string;
}

export type PlacementKind = "clear" | "confirm" | "blocked" | "third";

export interface PlacementDecision {
  kind: PlacementKind;
  partner?: AppointmentInterval;
  candidateInductionMinutes: number;
  partnerInductionMinutes: number;
}

export interface OverlapPrompt {
  partnerId: string;
  existingPatientName: string;
  dentistName: string;
  existingStartLabel: string;
  existingEndLabel: string;
  incomingPatientName: string;
  incomingStartLabel: string;
  incomingEndLabel: string;
}

export interface AppointmentWritePlan {
  outcome: "save" | "confirm" | "reject";
  error?: string;
  overlap?: OverlapPrompt;
  candidateInductionMinutes: number;
  partnerId?: string;
  partnerInductionMinutes?: number;
  releasePartnerId?: string;
}

export interface PlanAppointmentWriteInput {
  candidate: ConflictCheckInput & { patientName: string };
  existing: AppointmentInterval[];
  dentistName: string;
  mode: "create" | "edit";
  confirmation?: { partnerId: string } | null;
  previousPartnerId?: string | null;
  candidateStatus?: AppointmentStatus;
  formatTime: (date: Date) => string;
}

interface PairShape {
  shorterMinutes: number;
  candidateIsLonger: boolean;
}

function sameMinute(left: Date, right: Date): boolean {
  return (
    Math.floor(left.getTime() / MINUTE_MS) ===
    Math.floor(right.getTime() / MINUTE_MS)
  );
}

function durationMinutes(start: Date, end: Date): number {
  return (
    Math.floor(end.getTime() / MINUTE_MS) -
    Math.floor(start.getTime() / MINUTE_MS)
  );
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MINUTE_MS);
}

function inductionOf(appointment: AppointmentInterval): number {
  return appointment.inductionMinutes ?? 0;
}

function busyStart(appointment: AppointmentInterval): Date {
  return addMinutes(appointment.startsAt, inductionOf(appointment));
}

function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

function rangesTouch(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return (
    aEnd.getTime() === bStart.getTime() || bEnd.getTime() === aStart.getTime()
  );
}

function activeSameDentist(
  candidate: ConflictCheckInput,
  existing: AppointmentInterval[],
): AppointmentInterval[] {
  return existing.filter((appointment) => {
    if (appointment.id === candidate.excludeId) {
      return false;
    }

    if (appointment.dentistId !== candidate.dentistId) {
      return false;
    }

    if (!isActiveAppointmentStatus(appointment.status)) {
      return false;
    }

    return appointment.endsAt > appointment.startsAt;
  });
}

function pairShape(
  candidateStart: Date,
  candidateEnd: Date,
  partnerStart: Date,
  partnerEnd: Date,
): PairShape | null {
  if (!sameMinute(candidateStart, partnerStart)) {
    return null;
  }

  if (sameMinute(candidateEnd, partnerEnd)) {
    return null;
  }

  const candidateDuration = durationMinutes(candidateStart, candidateEnd);
  const partnerDuration = durationMinutes(partnerStart, partnerEnd);

  if (candidateDuration <= 0 || partnerDuration <= 0) {
    return null;
  }

  if (candidateDuration === partnerDuration) {
    return null;
  }

  if (candidateDuration < partnerDuration) {
    return { shorterMinutes: candidateDuration, candidateIsLonger: false };
  }

  return { shorterMinutes: partnerDuration, candidateIsLonger: true };
}

function conflictsWithBusy(
  start: Date,
  end: Date,
  inductionMinutes: number,
  other: AppointmentInterval,
): boolean {
  const ownBusyStart = addMinutes(start, inductionMinutes);
  const otherBusyStart = busyStart(other);

  if (rangesOverlap(ownBusyStart, end, otherBusyStart, other.endsAt)) {
    return true;
  }

  const visitsOverlap = rangesOverlap(start, end, other.startsAt, other.endsAt);

  if (!visitsOverlap) {
    return false;
  }

  return !rangesTouch(ownBusyStart, end, otherBusyStart, other.endsAt);
}

function pairStaysClear(
  candidate: ConflictCheckInput,
  partner: AppointmentInterval,
  candidateInduction: number,
  partnerInduction: number,
  others: AppointmentInterval[],
): boolean {
  const partnerWithPlan: AppointmentInterval = {
    ...partner,
    inductionMinutes: partnerInduction,
  };

  if (
    conflictsWithBusy(
      candidate.startsAt,
      candidate.endsAt,
      candidateInduction,
      partnerWithPlan,
    )
  ) {
    return false;
  }

  return !others.some(
    (appointment) =>
      conflictsWithBusy(
        candidate.startsAt,
        candidate.endsAt,
        candidateInduction,
        appointment,
      ) ||
      conflictsWithBusy(
        partner.startsAt,
        partner.endsAt,
        partnerInduction,
        appointment,
      ),
  );
}

function emptyDecision(kind: PlacementKind): PlacementDecision {
  return {
    kind,
    candidateInductionMinutes: 0,
    partnerInductionMinutes: 0,
  };
}

export function classifyAppointmentPlacement(
  candidate: ConflictCheckInput,
  existing: AppointmentInterval[],
): PlacementDecision {
  if (candidate.endsAt <= candidate.startsAt) {
    return emptyDecision("blocked");
  }

  const relevant = activeSameDentist(candidate, existing);
  const sameStart = relevant.filter((appointment) =>
    sameMinute(appointment.startsAt, candidate.startsAt),
  );

  if (sameStart.length >= 2) {
    return emptyDecision("third");
  }

  const partner = sameStart[0];

  if (partner) {
    const shape = pairShape(
      candidate.startsAt,
      candidate.endsAt,
      partner.startsAt,
      partner.endsAt,
    );

    if (shape) {
      const candidateInduction = shape.candidateIsLonger
        ? shape.shorterMinutes
        : 0;
      const partnerInduction = shape.candidateIsLonger
        ? 0
        : shape.shorterMinutes;
      const others = relevant.filter(
        (appointment) => appointment.id !== partner.id,
      );
      const longerDuration = shape.candidateIsLonger
        ? durationMinutes(candidate.startsAt, candidate.endsAt)
        : durationMinutes(partner.startsAt, partner.endsAt);

      if (
        shape.shorterMinutes < longerDuration &&
        pairStaysClear(
          candidate,
          partner,
          candidateInduction,
          partnerInduction,
          others,
        )
      ) {
        return {
          kind: "confirm",
          partner,
          candidateInductionMinutes: candidateInduction,
          partnerInductionMinutes: partnerInduction,
        };
      }

      return emptyDecision("blocked");
    }
  }

  const blocked = relevant.some((appointment) =>
    conflictsWithBusy(candidate.startsAt, candidate.endsAt, 0, appointment),
  );

  if (blocked) {
    return emptyDecision("blocked");
  }

  return emptyDecision("clear");
}

export function hasAppointmentConflict(
  candidate: ConflictCheckInput,
  existing: AppointmentInterval[],
): boolean {
  const decision = classifyAppointmentPlacement(candidate, existing);
  return decision.kind === "blocked" || decision.kind === "third";
}

export function hasPatientVisitConflict(
  candidate: ConflictCheckInput,
  existing: AppointmentInterval[],
): boolean {
  if (candidate.endsAt <= candidate.startsAt) {
    return false;
  }

  return activeSameDentist(candidate, existing).some((appointment) =>
    rangesOverlap(
      candidate.startsAt,
      candidate.endsAt,
      appointment.startsAt,
      appointment.endsAt,
    ),
  );
}

export function findConflictingAppointments(
  candidate: ConflictCheckInput,
  existing: AppointmentInterval[],
): AppointmentInterval[] {
  const decision = classifyAppointmentPlacement(candidate, existing);

  if (decision.kind === "clear" || decision.kind === "confirm") {
    return [];
  }

  const relevant = activeSameDentist(candidate, existing);

  if (decision.kind === "third") {
    return relevant.filter((appointment) =>
      sameMinute(appointment.startsAt, candidate.startsAt),
    );
  }

  return relevant.filter((appointment) =>
    conflictsWithBusy(candidate.startsAt, candidate.endsAt, 0, appointment),
  );
}

export function findPairPartnerId(
  appointment: AppointmentInterval,
  existing: AppointmentInterval[],
): string | null {
  if (!isActiveAppointmentStatus(appointment.status)) {
    return null;
  }

  const decision = classifyAppointmentPlacement(
    {
      dentistId: appointment.dentistId,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      excludeId: appointment.id,
    },
    existing,
  );

  return decision.kind === "confirm" ? (decision.partner?.id ?? null) : null;
}

export function formatConflictMessage(dentistName: string): string {
  return `Horário indisponível para ${dentistName}`;
}

export function formatOverlapBody(prompt: OverlapPrompt): string {
  return `${prompt.existingPatientName} já está marcado com ${prompt.dentistName} das ${prompt.existingStartLabel} às ${prompt.existingEndLabel}. Deseja marcar ${prompt.incomingPatientName} também, das ${prompt.incomingStartLabel} às ${prompt.incomingEndLabel}?`;
}

function buildOverlapPrompt(
  input: PlanAppointmentWriteInput,
  partner: AppointmentInterval,
): OverlapPrompt {
  const partnerName = partner.patientName ?? "Paciente";
  const existingIsCandidate = input.mode === "edit";
  const existingName = existingIsCandidate
    ? input.candidate.patientName
    : partnerName;
  const incomingName = existingIsCandidate
    ? partnerName
    : input.candidate.patientName;
  const existingStart = existingIsCandidate
    ? input.candidate.startsAt
    : partner.startsAt;
  const existingEnd = existingIsCandidate
    ? input.candidate.endsAt
    : partner.endsAt;
  const incomingStart = existingIsCandidate
    ? partner.startsAt
    : input.candidate.startsAt;
  const incomingEnd = existingIsCandidate
    ? partner.endsAt
    : input.candidate.endsAt;

  return {
    partnerId: partner.id,
    existingPatientName: existingName,
    dentistName: input.dentistName,
    existingStartLabel: input.formatTime(existingStart),
    existingEndLabel: input.formatTime(existingEnd),
    incomingPatientName: incomingName,
    incomingStartLabel: input.formatTime(incomingStart),
    incomingEndLabel: input.formatTime(incomingEnd),
  };
}

function withRelease(
  plan: AppointmentWritePlan,
  previousPartnerId: string | null | undefined,
  nextPartnerId?: string,
): AppointmentWritePlan {
  if (plan.outcome !== "save" || !previousPartnerId) {
    return plan;
  }

  if (previousPartnerId === nextPartnerId) {
    return plan;
  }

  return { ...plan, releasePartnerId: previousPartnerId };
}

export function planAppointmentWrite(
  input: PlanAppointmentWriteInput,
): AppointmentWritePlan {
  if (
    input.mode === "edit" &&
    input.candidateStatus &&
    !isActiveAppointmentStatus(input.candidateStatus)
  ) {
    return withRelease(
      { outcome: "save", candidateInductionMinutes: 0 },
      input.previousPartnerId,
    );
  }

  const decision = classifyAppointmentPlacement(input.candidate, input.existing);

  if (decision.kind === "third") {
    return {
      outcome: "reject",
      error: THIRD_APPOINTMENT_MESSAGE,
      candidateInductionMinutes: 0,
    };
  }

  if (decision.kind === "blocked") {
    return {
      outcome: "reject",
      error: formatConflictMessage(input.dentistName),
      candidateInductionMinutes: 0,
    };
  }

  if (decision.kind === "confirm" && decision.partner) {
    const partnerId = decision.partner.id;

    if (!input.confirmation) {
      return {
        outcome: "confirm",
        overlap: buildOverlapPrompt(input, decision.partner),
        candidateInductionMinutes: decision.candidateInductionMinutes,
        partnerId,
        partnerInductionMinutes: decision.partnerInductionMinutes,
      };
    }

    if (input.confirmation.partnerId !== partnerId) {
      return {
        outcome: "reject",
        error: PAIR_CONFIRMATION_REJECTED_MESSAGE,
        candidateInductionMinutes: 0,
      };
    }

    return withRelease(
      {
        outcome: "save",
        candidateInductionMinutes: decision.candidateInductionMinutes,
        partnerId,
        partnerInductionMinutes: decision.partnerInductionMinutes,
      },
      input.previousPartnerId,
      partnerId,
    );
  }

  return withRelease(
    { outcome: "save", candidateInductionMinutes: 0 },
    input.previousPartnerId,
  );
}
