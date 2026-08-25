import { createClient } from "@/lib/supabase/server";
import { normalizeCpf } from "@/features/patients/domain/cpf";

export interface PatientListItem {
  id: string;
  fullName: string;
  cpf: string | null;
  contactPhone: string | null;
  birthDate: string | null;
}

export interface PatientDetail {
  id: string;
  fullName: string;
  birthDate: string | null;
  cpf: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  secondaryPhone: string | null;
  secondaryPhoneNote: string | null;
  lgpdConsentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapPatientRow(row: {
  id: string;
  full_name: string;
  birth_date: string | null;
  cpf: string | null;
  contact_phone: string | null;
  contact_email?: string | null;
  secondary_phone?: string | null;
  secondary_phone_note?: string | null;
  lgpd_consent_at?: string | null;
  created_at?: string;
  updated_at?: string;
}): PatientDetail {
  return {
    id: row.id,
    fullName: row.full_name,
    birthDate: row.birth_date,
    cpf: row.cpf,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email ?? null,
    secondaryPhone: row.secondary_phone ?? null,
    secondaryPhoneNote: row.secondary_phone_note ?? null,
    lgpdConsentAt: row.lgpd_consent_at ?? null,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

export async function searchPatients(
  query: string,
  limit = 20,
): Promise<PatientListItem[]> {
  const supabase = await createClient();
  const sanitized = query.trim();

  let request = supabase
    .from("patients")
    .select("id, full_name, cpf, contact_phone, birth_date")
    .order("full_name")
    .limit(limit);

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
    contactPhone: patient.contact_phone,
    birthDate: patient.birth_date,
  }));
}

export async function listPatients(
  query: string,
  limit = 30,
): Promise<PatientListItem[]> {
  return searchPatients(query, limit);
}

export async function getPatientById(
  patientId: string,
): Promise<PatientDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select(
      "id, full_name, birth_date, cpf, contact_phone, contact_email, secondary_phone, secondary_phone_note, lgpd_consent_at, created_at, updated_at",
    )
    .eq("id", patientId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapPatientRow(data);
}

export async function findPatientByCpf(
  cpf: string,
): Promise<PatientListItem | null> {
  const normalized = normalizeCpf(cpf);

  if (!normalized) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id, full_name, cpf, contact_phone, birth_date")
    .eq("cpf", normalized)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name,
    cpf: data.cpf,
    contactPhone: data.contact_phone,
    birthDate: data.birth_date,
  };
}
