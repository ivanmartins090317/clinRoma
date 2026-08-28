"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getLinkedDentistId } from "@/features/agenda/queries";
import { validateAttachmentLimits } from "@/features/records/domain/attachment-limits";
import {
  ANAMNESIS_COPY,
  buildAnamnesisContentV2,
  validatePaperSubmission,
} from "@/features/records/domain/anamnesis-form-v2";
import {
  buildAnamnesisInviteUrl,
  checkInviteRateLimit,
  computeInviteExpiresAt,
  evaluateInviteAccess,
  generateAnamnesisInviteToken,
  hashAnamnesisInviteToken,
  hashInviteOrigin,
  resolveAnamnesisInviteBaseUrl,
} from "@/features/records/lib/anamnesis-token";
import {
  evaluateTranscriptionCorrection,
  TRANSCRIPTION_EDIT_ERRORS,
} from "@/features/records/domain/transcription-edit";
import { validateToothFinding } from "@/features/records/domain/tooth-fdi";
import {
  canCorrectTranscription,
  canGenerateAnamnesisInvite,
} from "@/features/records/permissions";
import { sendAnamnesisInviteWhatsApp } from "@/features/records/lib/send-patient-whatsapp";
import {
  createEvolutionSchema,
  finalizeAudioSchema,
  generateAnamnesisInviteSchema,
  readChartAuditSchema,
  retryTranscriptionSchema,
  saveAnamnesisSchema,
  sendAnamnesisInviteWhatsAppSchema,
  submitAnamnesisInviteSchema,
  updateTranscriptionSchema,
  uploadPhotoSchema,
  upsertToothFindingSchema,
} from "@/features/records/schemas";
import { requireAuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { hasSupabaseConfig } from "@/lib/env";
import type { UserRole } from "@/types/clinroma";

export interface RecordActionResult {
  success?: boolean;
  error?: string;
  recordId?: string;
  attachmentId?: string;
  inviteUrl?: string;
  replaced?: boolean;
  expiresAt?: string;
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

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
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

async function readInviteOriginKey(): Promise<string> {
  try {
    const headerStore = await headers();
    const forwarded =
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip")?.trim() ??
      "unknown";
    return hashInviteOrigin(forwarded) ?? "anon";
  } catch {
    return "anon";
  }
}

async function logPublicInviteAudit(
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    await supabase.from("audit_log").insert({
      actor_id: null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: toJson(metadata ?? {}),
    });
  } catch (error) {
    console.error(
      "[audit] Falha ao registrar convite de anamnese:",
      error instanceof Error ? error.message : "erro",
    );
  }
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

    const validationError = validatePaperSubmission({
      answers: parsed.data.answers,
      diseases: parsed.data.diseases,
      otherDisease: parsed.data.otherDisease,
      signatureConfirmed: parsed.data.signatureConfirmed,
      signatureName: parsed.data.signatureName,
    });

    if (validationError) {
      return { error: validationError };
    }

    const content = buildAnamnesisContentV2({
      answers: parsed.data.answers,
      diseases: parsed.data.diseases,
      otherDisease: parsed.data.otherDisease,
      signatureName: parsed.data.signatureName,
      origin: "chart",
    });

    if (!content) {
      return { error: ANAMNESIS_COPY.missingYesNo };
    }

    const dentistId = await getLinkedDentistId(session.userId);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("medical_records")
      .insert({
        patient_id: parsed.data.patientId,
        dentist_id: dentistId,
        record_type: "anamnesis",
        content: toJson(content),
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

export async function generateAnamnesisInviteAction(
  input: unknown,
): Promise<RecordActionResult> {
  try {
    const session = await requireAuthSession("/pacientes");

    if (!canGenerateAnamnesisInvite(session.profile.role)) {
      return { error: ANAMNESIS_COPY.forbiddenInvite };
    }

    if (!hasSupabaseConfig()) {
      return { error: "Supabase não configurado" };
    }

    const parsed = generateAnamnesisInviteSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const supabase = await createClient();
    const { data: existing, error: existingError } = await supabase
      .from("anamnesis_invites")
      .select("id")
      .eq("patient_id", parsed.data.patientId)
      .eq("purpose", parsed.data.purpose)
      .eq("status", "open")
      .maybeSingle();

    if (existingError) {
      console.error("[anamnesis-invite] select", existingError.code);
      return { error: "Não foi possível gerar o link de anamnese." };
    }

    const replaced = Boolean(existing?.id);
    const now = new Date().toISOString();
    const token = generateAnamnesisInviteToken();
    const tokenHash = hashAnamnesisInviteToken(token);
    const expiresAt = computeInviteExpiresAt(parsed.data.purpose);

    const persisted = existing?.id
      ? await supabase
          .from("anamnesis_invites")
          .update({
            token_hash: tokenHash,
            expires_at: expiresAt.toISOString(),
            used_at: null,
            updated_at: now,
          })
          .eq("id", existing.id)
          .eq("status", "open")
          .select("id")
          .single()
      : await supabase
          .from("anamnesis_invites")
          .insert({
            patient_id: parsed.data.patientId,
            purpose: parsed.data.purpose,
            token_hash: tokenHash,
            status: "open",
            expires_at: expiresAt.toISOString(),
            created_by: session.userId,
          })
          .select("id")
          .single();

    if (persisted.error || !persisted.data) {
      console.error("[anamnesis-invite] persist", persisted.error?.code);
      return { error: "Não foi possível gerar o link de anamnese." };
    }

    await logRecordAudit("create", "anamnesis_invites", persisted.data.id, {
      purpose: parsed.data.purpose,
      patientId: parsed.data.patientId,
      replaced,
    });

    const headerStore = await headers();
    const inviteUrl = buildAnamnesisInviteUrl(
      token,
      resolveAnamnesisInviteBaseUrl({
        origin: headerStore.get("origin"),
        host: headerStore.get("x-forwarded-host") ?? headerStore.get("host"),
        proto: headerStore.get("x-forwarded-proto"),
      }),
    );

    return {
      success: true,
      recordId: persisted.data.id,
      inviteUrl,
      replaced,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o link de anamnese.",
    };
  }
}

export async function submitAnamnesisInviteAction(
  input: unknown,
): Promise<RecordActionResult> {
  try {
    const originKey = await readInviteOriginKey();

    if (!checkInviteRateLimit(`submit:${originKey}`)) {
      return { error: ANAMNESIS_COPY.genericInvite };
    }

    const parsed = submitAnamnesisInviteSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? ANAMNESIS_COPY.genericInvite,
      };
    }

    const validationError = validatePaperSubmission({
      answers: parsed.data.answers,
      diseases: parsed.data.diseases,
      otherDisease: parsed.data.otherDisease,
      signatureConfirmed: parsed.data.signatureConfirmed,
      signatureName: parsed.data.signatureName,
      requireConsent: true,
      consentConfirmed: parsed.data.consentConfirmed,
    });

    if (validationError) {
      return { error: validationError };
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const tokenHash = hashAnamnesisInviteToken(parsed.data.token);
    const { data: invite } = await supabase
      .from("anamnesis_invites")
      .select(
        "id, patient_id, purpose, token_hash, status, expires_at, used_at",
      )
      .eq("token_hash", tokenHash)
      .maybeSingle();

    const access = evaluateInviteAccess({
      token: parsed.data.token,
      tokenHash,
      storedHash: invite?.token_hash,
      status: invite?.status,
      expiresAt: invite?.expires_at,
      usedAt: invite?.used_at ?? null,
    });

    if (access !== "valid" || !invite) {
      return { error: ANAMNESIS_COPY.genericInvite };
    }

    const now = new Date().toISOString();
    const { data: consumed } = await supabase
      .from("anamnesis_invites")
      .update({ status: "used", used_at: now, updated_at: now })
      .eq("id", invite.id)
      .eq("status", "open")
      .select("id")
      .maybeSingle();

    if (!consumed) {
      return { error: ANAMNESIS_COPY.genericInvite };
    }

    const content = buildAnamnesisContentV2({
      answers: parsed.data.answers,
      diseases: parsed.data.diseases,
      otherDisease: parsed.data.otherDisease,
      signatureName: parsed.data.signatureName,
      origin: "invite",
      invitePurpose: invite.purpose,
    });

    if (!content) {
      return { error: ANAMNESIS_COPY.missingYesNo };
    }

    const { data, error } = await supabase
      .from("medical_records")
      .insert({
        patient_id: invite.patient_id,
        record_type: "anamnesis",
        content: toJson(content),
        created_by: null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: "Não foi possível enviar o questionário." };
    }

    await logPublicInviteAudit("create", "medical_records", data.id, {
      recordType: "anamnesis",
      origin: "invite",
      purpose: invite.purpose,
      patientId: invite.patient_id,
      originFingerprint: originKey === "anon" ? undefined : originKey,
    });

    revalidatePath(`/pacientes/${invite.patient_id}`);

    return { success: true, recordId: data.id };
  } catch {
    return { error: ANAMNESIS_COPY.genericInvite };
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

export async function updateTranscriptionAction(
  input: unknown,
): Promise<RecordActionResult> {
  try {
    const session = await assertClinicalRead();

    if (!canCorrectTranscription(session.profile.role)) {
      return { error: TRANSCRIPTION_EDIT_ERRORS.forbidden };
    }

    const parsed = updateTranscriptionSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const supabase = await createClient();
    const { data: attachment, error: loadError } = await supabase
      .from("record_attachments")
      .select("id, attachment_type, transcription_status, medical_record_id")
      .eq("id", parsed.data.attachmentId)
      .maybeSingle();

    if (loadError || !attachment) {
      return { error: TRANSCRIPTION_EDIT_ERRORS.generic };
    }

    const evaluation = evaluateTranscriptionCorrection({
      role: session.profile.role,
      status: attachment.transcription_status,
      attachmentType: attachment.attachment_type,
      text: parsed.data.transcription,
    });

    if (!evaluation.ok) {
      return { error: evaluation.error };
    }

    const { data: record } = await supabase
      .from("medical_records")
      .select("patient_id")
      .eq("id", attachment.medical_record_id)
      .maybeSingle();

    if (!record) {
      return { error: TRANSCRIPTION_EDIT_ERRORS.generic };
    }

    const { data: updated, error: updateError } = await supabase
      .from("record_attachments")
      .update({ transcription: evaluation.text })
      .eq("id", attachment.id)
      .eq("attachment_type", "audio")
      .eq("transcription_status", "completed")
      .select("id")
      .maybeSingle();

    if (updateError || !updated) {
      return { error: TRANSCRIPTION_EDIT_ERRORS.generic };
    }

    await logRecordAudit("update", "record_attachments", updated.id, {
      attachmentType: "audio",
      patientId: record.patient_id,
      field: "transcription",
    });

    revalidatePath(`/pacientes/${record.patient_id}`);

    return { success: true, attachmentId: updated.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : TRANSCRIPTION_EDIT_ERRORS.generic,
    };
  }
}

export async function getTranscriptionStatusAction(attachmentId: string) {
  await assertClinicalRead();
  const { getAttachmentTranscriptionStatus } =
    await import("@/features/records/queries");
  return getAttachmentTranscriptionStatus(attachmentId);
}

export async function sendAnamnesisInviteWhatsAppAction(
  input: unknown,
): Promise<RecordActionResult> {
  try {
    const session = await requireAuthSession("/pacientes");
    const parsed = sendAnamnesisInviteWhatsAppSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const headerStore = await headers();
    const inviteBaseUrl = resolveAnamnesisInviteBaseUrl({
      origin: headerStore.get("origin"),
      host: headerStore.get("x-forwarded-host") ?? headerStore.get("host"),
      proto: headerStore.get("x-forwarded-proto"),
    });

    return sendAnamnesisInviteWhatsApp({
      patientId: parsed.data.patientId,
      appointmentId: parsed.data.appointmentId,
      actorId: session.userId,
      role: session.profile.role,
      inviteBaseUrl,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a mensagem.",
    };
  }
}
