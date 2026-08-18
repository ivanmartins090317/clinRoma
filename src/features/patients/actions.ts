"use server";

import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getModuleAccess } from "@/lib/auth/roles";
import { requireAuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/env";
import { normalizeCpf } from "@/features/patients/domain/cpf";
import { findPatientByCpf } from "@/features/patients/queries";
import {
  createPatientSchema,
  updatePatientSchema,
} from "@/features/patients/schemas";
import type { UserRole } from "@/types/clinroma";

export interface PatientActionResult {
  success?: boolean;
  error?: string;
  patientId?: string;
  existingPatientId?: string;
}

function canWritePatients(role: UserRole): boolean {
  return getModuleAccess(role, "patients") === "write";
}

async function assertPatientWriteAccess() {
  const session = await requireAuthSession("/pacientes");

  if (!canWritePatients(session.profile.role)) {
    throw new Error("Sem permissão para alterar pacientes");
  }

  if (!hasSupabaseConfig()) {
    throw new Error("Supabase não configurado");
  }

  return session;
}

async function logPatientAudit(
  action: string,
  patientId: string,
  metadata?: Record<string, unknown>,
) {
  const result = await writeAuditLog({
    action,
    entityType: "patients",
    entityId: patientId,
    metadata,
  });

  if (!result.ok) {
    console.error("[audit] Falha ao registrar paciente:", result.error);
  }
}

export async function createPatientAction(
  input: unknown,
): Promise<PatientActionResult> {
  try {
    await assertPatientWriteAccess();
    const parsed = createPatientSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const normalizedCpf = normalizeCpf(parsed.data.cpf ?? null);

    if (normalizedCpf) {
      const existing = await findPatientByCpf(normalizedCpf);

      if (existing) {
        return {
          error: `CPF já cadastrado para ${existing.fullName}.`,
          existingPatientId: existing.id,
        };
      }
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("patients")
      .insert({
        full_name: parsed.data.fullName,
        birth_date: parsed.data.birthDate ?? null,
        cpf: normalizedCpf,
        contact_phone: parsed.data.contactPhone ?? null,
        contact_email: parsed.data.contactEmail ?? null,
        lgpd_consent_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !data) {
      if (error?.code === "23505") {
        return { error: "CPF já cadastrado para outro paciente." };
      }

      return { error: "Não foi possível cadastrar o paciente." };
    }

    await logPatientAudit("create", data.id, {
      origin: "lista-pacientes",
      consentSignature: parsed.data.signatureName,
    });

    revalidatePath("/pacientes");

    return { success: true, patientId: data.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o paciente",
    };
  }
}

export async function updatePatientAction(
  input: unknown,
): Promise<PatientActionResult> {
  try {
    await assertPatientWriteAccess();
    const parsed = updatePatientSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const normalizedCpf = normalizeCpf(parsed.data.cpf ?? null);

    if (normalizedCpf) {
      const existing = await findPatientByCpf(normalizedCpf);

      if (existing && existing.id !== parsed.data.id) {
        return {
          error: `CPF já cadastrado para ${existing.fullName}.`,
          existingPatientId: existing.id,
        };
      }
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("patients")
      .update({
        full_name: parsed.data.fullName,
        birth_date: parsed.data.birthDate ?? null,
        cpf: normalizedCpf,
        contact_phone: parsed.data.contactPhone ?? null,
        contact_email: parsed.data.contactEmail ?? null,
      })
      .eq("id", parsed.data.id)
      .select("id")
      .single();

    if (error || !data) {
      if (error?.code === "23505") {
        return { error: "CPF já cadastrado para outro paciente." };
      }

      return { error: "Não foi possível atualizar o paciente." };
    }

    await logPatientAudit("update", data.id, { origin: "ficha-paciente" });

    revalidatePath("/pacientes");
    revalidatePath(`/pacientes/${data.id}`);

    return { success: true, patientId: data.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o paciente",
    };
  }
}

export async function searchPatientsAction(query: string) {
  const session = await requireAuthSession("/pacientes");

  if (!canWritePatients(session.profile.role)) {
    if (getModuleAccess(session.profile.role, "patients") === "read") {
      const { searchPatients } = await import("@/features/patients/queries");
      return searchPatients(query);
    }

    return [];
  }

  const { searchPatients } = await import("@/features/patients/queries");
  return searchPatients(query);
}
