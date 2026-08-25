import { toZonedTime } from "date-fns-tz";
import { parseISO } from "date-fns";

import { isActiveAppointmentStatus } from "@/features/agenda/domain/appointment-status";
import {
  CLINIC_TIMEZONE,
  clinicDayBounds,
  type AgendaAppointment,
  type AgendaDentist,
  type AgendaPatientOption,
} from "@/features/agenda/types";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/types/clinroma";

interface AppointmentRow {
  id: string;
  patient_id: string;
  dentist_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  procedure_name: string | null;
  notes: string | null;
  patients: { full_name: string } | Array<{ full_name: string }> | null;
  dentists:
    | { full_name: string; calendar_color: string }
    | Array<{ full_name: string; calendar_color: string }>
    | null;
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapAppointmentRow(row: AppointmentRow): AgendaAppointment {
  const patient = unwrapRelation(row.patients);
  const dentist = unwrapRelation(row.dentists);

  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: patient?.full_name ?? "Paciente",
    dentistId: row.dentist_id,
    dentistName: dentist?.full_name ?? "Dentista",
    dentistColor: dentist?.calendar_color ?? "#6B2737",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    procedureName: row.procedure_name,
    notes: row.notes,
  };
}

export async function getActiveDentists(): Promise<AgendaDentist[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dentists")
    .select("id, full_name, calendar_color")
    .eq("active", true)
    .order("full_name");

  if (error) {
    throw new Error("Não foi possível carregar os dentistas");
  }

  return (data ?? []).map((dentist) => ({
    id: dentist.id,
    fullName: dentist.full_name,
    calendarColor: dentist.calendar_color,
  }));
}

export async function getLinkedDentistId(
  profileId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dentists")
    .select("id")
    .eq("profile_id", profileId)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data?.id ?? null;
}

export async function searchPatients(
  query: string,
): Promise<AgendaPatientOption[]> {
  const supabase = await createClient();
  const sanitized = query.trim();

  let request = supabase
    .from("patients")
    .select("id, full_name, cpf")
    .order("full_name")
    .limit(20);

  if (sanitized) {
    const digits = sanitized.replace(/\D/g, "");
    const filters = [`full_name.ilike.%${sanitized}%`];

    if (digits.length >= 3) {
      filters.push(`cpf.ilike.%${digits}%`);
    }

    request = request.or(filters.join(","));
  }

  const { data, error } = await request;

  if (error) {
    throw new Error("Não foi possível buscar pacientes");
  }

  return (data ?? []).map((patient) => ({
    id: patient.id,
    fullName: patient.full_name,
    cpf: patient.cpf,
  }));
}

export async function getAppointmentsInRange(
  rangeStart: string,
  rangeEnd: string,
  dentistId?: string | null,
): Promise<AgendaAppointment[]> {
  const supabase = await createClient();

  let request = supabase
    .from("appointments")
    .select(
      `
      id,
      patient_id,
      dentist_id,
      starts_at,
      ends_at,
      status,
      procedure_name,
      notes,
      patients ( full_name ),
      dentists ( full_name, calendar_color )
    `,
    )
    .gte("starts_at", rangeStart)
    .lte("starts_at", rangeEnd)
    .order("starts_at");

  if (dentistId) {
    request = request.eq("dentist_id", dentistId);
  }

  const { data, error } = await request;

  if (error) {
    throw new Error("Não foi possível carregar as consultas");
  }

  return ((data ?? []) as unknown as AppointmentRow[])
    .filter((row) => isActiveAppointmentStatus(row.status))
    .map(mapAppointmentRow);
}

export async function getTodayAppointments(
  dentistId?: string | null,
): Promise<AgendaAppointment[]> {
  const bounds = clinicDayBounds(toZonedTime(new Date(), CLINIC_TIMEZONE));
  return getAppointmentsInRange(bounds.start, bounds.end, dentistId);
}

export async function getAppointmentById(
  appointmentId: string,
): Promise<AgendaAppointment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      id,
      patient_id,
      dentist_id,
      starts_at,
      ends_at,
      status,
      procedure_name,
      notes,
      patients ( full_name ),
      dentists ( full_name, calendar_color )
    `,
    )
    .eq("id", appointmentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapAppointmentRow(data as unknown as AppointmentRow);
}

export async function getActiveAppointmentsForDentist(
  dentistId: string,
  excludeId?: string,
): Promise<
  Array<{
    id: string;
    dentistId: string;
    startsAt: Date;
    endsAt: Date;
    status: AppointmentStatus;
  }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, dentist_id, starts_at, ends_at, status")
    .eq("dentist_id", dentistId);

  if (error) {
    throw new Error("Não foi possível validar conflitos de horário");
  }

  return (data ?? [])
    .filter((row) => row.id !== excludeId)
    .filter((row) => isActiveAppointmentStatus(row.status))
    .map((row) => ({
      id: row.id,
      dentistId: row.dentist_id,
      startsAt: parseISO(row.starts_at),
      endsAt: parseISO(row.ends_at),
      status: row.status,
    }));
}

export interface LatestCompletedAppointment {
  id: string;
  startsAt: string;
  procedureName: string | null;
}

export async function getLatestCompletedAppointmentForPatient(
  patientId: string,
): Promise<LatestCompletedAppointment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, starts_at, procedure_name")
    .eq("patient_id", patientId)
    .eq("status", "completed")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    startsAt: data.starts_at,
    procedureName: data.procedure_name,
  };
}

export {
  clinicDateNavigation,
  clinicDayBounds,
  clinicWeekBounds,
  formatClinicDate,
  formatClinicDateTime,
  formatClinicTime,
  parseClinicDateParam,
  toClinicIso,
} from "@/features/agenda/types";
