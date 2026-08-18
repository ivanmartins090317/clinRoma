"use server";

import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getLinkedDentistId } from "@/features/agenda/queries";
import { validateAttachmentLimits } from "@/features/records/domain/attachment-limits";
import { validateToothFinding } from "@/features/records/domain/tooth-fdi";
import {
  buildAnamnesisContent,
  createEvolutionSchema,
  finalizeAudioSchema,
  readChartAuditSchema,
  retryTranscriptionSchema,
  saveAnamnesisSchema,
  uploadPhotoSchema,
  upsertToothFindingSchema,
} from "@/features/records/schemas";
import { requireAuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/env";
import type { UserRole } from "@/types/clinroma";

export interface RecordActionResult {
  success?: boolean;
  error?: string;
  recordId?: string;
  attachmentId?: string;
}

function canReadClinical(role: UserRole): boolean {
  return role === "admin" || role === "dentist" || role === "reception";
}

function canWriteClinical(role: UserRole): boolean {
  return role === "admin" || role === "dentist" || role === "reception";
}

function canWriteEvolution(role: UserRole): boolean {
  return role === "admin" || role === "dentist";
}

async function assertClinicalRead() {
  const session = await requireAuthSession("/pacientes");

  if (!canReadClinical(session.profile.role)) {
    throw new Error("Sem permissão para ver o prontuário");
  }

  if (!hasSupabaseConfig()) {
    throw new Error("Supabase não configurado");
  }

  return session;
}

async function assertClinicalWrite() {
  const session = await assertClinicalRead();

  if (!canWriteClinical(session.profile.role)) {
    throw new Error("Sem permissão para alterar o prontuário");
  }

  return session;
}

async function assertEvolutionWrite() {
  const session = await assertClinicalRead();

  if (!canWriteEvolution(session.profile.role)) {
    throw new Error("Sem permissão para registrar evolução clínica");
  }

  return session;
}

async function logRecordAudit(
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
) {
  const result = await writeAuditLog({
    action,
    entityType,
    entityId,
    metadata,
  });

  if (!result.ok) {
    console.error("[audit] Falha ao registrar prontuário:", result.error);
  }
}

export async function auditPatientChartReadAction(
  input: unknown,
): Promise<RecordActionResult> {
  try {
    const session = await assertClinicalRead();
    const parsed = readChartAuditSchema.safeParse(input);

    if (!parsed.success) {
      return { error: "Dados inválidos" };
    }

    await logRecordAudit("read", "medical_records", parsed.data.patientId, {
      origin: parsed.data.origin,
      actorRole: session.profile.role,
    });

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Não foi possível auditar",
    };
  }
}

export async function saveAnamnesisAction(
  input: unknown,
): Promise<RecordActionResult> {
  try {
    const session = await assertClinicalWrite();
    const parsed = saveAnamnesisSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const dentistId = await getLinkedDentistId(session.userId);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("medical_records")
      .insert({
        patient_id: parsed.data.patientId,
        dentist_id: dentistId,
        record_type: "anamnesis",
        content: buildAnamnesisContent(parsed.data),
        created_by: session.userId,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: "Não foi possível salvar a anamnese." };
    }

    await logRecordAudit("create", "medical_records", data.id, {
      recordType: "anamnesis",
      patientId: parsed.data.patientId,
    });

    revalidatePath(`/pacientes/${parsed.data.patientId}`);

    return { success: true, recordId: data.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a anamnese",
    };
  }
}

export async function upsertToothFindingAction(
  input: unknown,
): Promise<RecordActionResult> {
  try {
    const session = await assertClinicalWrite();
    const parsed = upsertToothFindingSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const validationError = validateToothFinding(parsed.data);

    if (validationError) {
      return { error: validationError };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tooth_findings")
      .upsert(
        {
          patient_id: parsed.data.patientId,
          tooth_number: parsed.data.toothNumber,
          tooth_surface: parsed.data.toothSurface,
          condition_code: parsed.data.conditionCode,
          updated_by: session.userId,
        },
        { onConflict: "patient_id,tooth_number,tooth_surface" },
      )
      .select("id")
      .single();

    if (error || !data) {
      return { error: "Não foi possível salvar o achado odontológico." };
    }

    await logRecordAudit("update", "tooth_findings", data.id, {
      patientId: parsed.data.patientId,
      toothNumber: parsed.data.toothNumber,
      toothSurface: parsed.data.toothSurface,
    });

    revalidatePath(`/pacientes/${parsed.data.patientId}`);

    return { success: true, recordId: data.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o achado",
    };
  }
}

export async function createEvolutionAction(
  input: unknown,
): Promise<RecordActionResult> {
  try {
    const session = await assertEvolutionWrite();
    const parsed = createEvolutionSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const dentistId = await getLinkedDentistId(session.userId);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("medical_records")
      .insert({
        patient_id: parsed.data.patientId,
        dentist_id: dentistId,
        appointment_id: parsed.data.appointmentId ?? null,
        record_type: "evolution",
        content: { text: parsed.data.text },
        created_by: session.userId,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: "Não foi possível registrar a evolução." };
    }

    await logRecordAudit("create", "medical_records", data.id, {
      recordType: "evolution",
      patientId: parsed.data.patientId,
      appointmentId: parsed.data.appointmentId ?? null,
    });

    revalidatePath(`/pacientes/${parsed.data.patientId}`);

    return { success: true, recordId: data.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a evolução",
    };
  }
}

export async function registerPhotoAttachmentAction(
  input: unknown,
): Promise<RecordActionResult> {
  try {
    const session = await assertEvolutionWrite();
    const parsed = uploadPhotoSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const limitError = validateAttachmentLimits({
      mimeType: parsed.data.mimeType,
      fileSizeBytes: parsed.data.fileSizeBytes,
      attachmentType: "photo",
    });

    if (limitError) {
      return { error: limitError };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("record_attachments")
      .insert({
        medical_record_id: parsed.data.evolutionId,
        storage_path: parsed.data.storagePath,
        mime_type: parsed.data.mimeType,
        file_size_bytes: parsed.data.fileSizeBytes,
        attachment_type: "photo",
        created_by: session.userId,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: "Não foi possível vincular a foto." };
    }

    await logRecordAudit("create", "record_attachments", data.id, {
      attachmentType: "photo",
      patientId: parsed.data.patientId,
    });

    revalidatePath(`/pacientes/${parsed.data.patientId}`);

    return { success: true, attachmentId: data.id };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Não foi possível salvar foto",
    };
  }
}

export async function finalizeAudioAttachmentAction(
  input: unknown,
): Promise<RecordActionResult> {
  try {
    const session = await assertEvolutionWrite();
    const parsed = finalizeAudioSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const limitError = validateAttachmentLimits({
      mimeType: parsed.data.mimeType,
      fileSizeBytes: parsed.data.totalBytes,
      attachmentType: "audio",
    });

    if (limitError) {
      return { error: limitError };
    }

    const extension = parsed.data.mimeType.includes("webm") ? "webm" : "m4a";
    const storagePath = `${parsed.data.patientId}/${parsed.data.evolutionId}/${parsed.data.sessionId}.${extension}`;

    const { mergeAudioSessionChunks } =
      await import("@/lib/transcription/enqueue-transcription");
    const mergeResult = await mergeAudioSessionChunks({
      sessionId: parsed.data.sessionId,
      mimeType: parsed.data.mimeType,
      finalPath: storagePath,
    });

    if (!mergeResult.ok) {
      return { error: mergeResult.error ?? "Falha ao montar áudio" };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("record_attachments")
      .insert({
        medical_record_id: parsed.data.evolutionId,
        storage_path: storagePath,
        mime_type: parsed.data.mimeType,
        file_size_bytes: mergeResult.totalBytes,
        attachment_type: "audio",
        transcription_status: "pending",
        created_by: session.userId,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: "Não foi possível finalizar o áudio." };
    }

    await logRecordAudit("create", "record_attachments", data.id, {
      attachmentType: "audio",
      patientId: parsed.data.patientId,
    });

    const { enqueueTranscription } =
      await import("@/lib/transcription/enqueue-transcription");
    await enqueueTranscription(data.id);

    revalidatePath(`/pacientes/${parsed.data.patientId}`);

    return { success: true, attachmentId: data.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível finalizar o áudio",
    };
  }
}

export async function retryTranscriptionAction(
  input: unknown,
): Promise<RecordActionResult> {
  try {
    const session = await assertEvolutionWrite();
    const parsed = retryTranscriptionSchema.safeParse(input);

    if (!parsed.success) {
      return { error: "Dados inválidos" };
    }

    if (session.profile.role === "reception") {
      return { error: "Sem permissão para retentar transcrição" };
    }

    const { enqueueTranscription } =
      await import("@/lib/transcription/enqueue-transcription");
    await enqueueTranscription(parsed.data.attachmentId);

    return { success: true, attachmentId: parsed.data.attachmentId };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível retentar transcrição",
    };
  }
}

export async function getTranscriptionStatusAction(attachmentId: string) {
  await assertClinicalRead();
  const { getAttachmentTranscriptionStatus } =
    await import("@/features/records/queries");
  return getAttachmentTranscriptionStatus(attachmentId);
}
