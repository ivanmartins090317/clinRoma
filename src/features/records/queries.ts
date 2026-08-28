import { getLatestCompletedAppointmentForPatient } from "@/features/agenda/queries";
import {
  buildAnamnesisPreview,
  type AnamnesisContentV1,
} from "@/features/records/domain/anamnesis-form-v1";
import {
  buildAnamnesisPreviewV2,
  formatVigenteDateLabel,
  isAnamnesisContentV2,
  type AnamnesisContentV2,
} from "@/features/records/domain/anamnesis-form-v2";
import { evaluateAnamnesisExpiry } from "@/features/records/domain/anamnesis-expiry";
import {
  checkInviteRateLimit,
  evaluateInviteAccess,
  hashAnamnesisInviteToken,
  inviteViewGuessKey,
} from "@/features/records/lib/anamnesis-token";
import {
  buildAnamnesisCardView,
  emptyPatientCardSummary,
  parseAnamnesisCardSource,
  pickVigenteAnamnesis,
  resolveLastProcedure,
  type EvolutionCardInput,
  type PatientCardSummary,
} from "@/features/records/domain/patient-card-summary";
import { canViewClinicalContent } from "@/features/records/permissions";
import {
  PATIENT_MESSAGE_PURPOSE,
  messageStatusLabel,
  type PatientMessageStatus,
} from "@/features/records/domain/patient-message";
import {
  canCancelScheduledMessage,
  formatScheduledAtLabel,
} from "@/features/records/domain/post-surgery-schedule";
import {
  formatWhatsAppDestinationNotice,
  formatWhatsAppDigits,
  resolveWhatsAppDestination,
} from "@/features/records/domain/whatsapp-destination";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { isWhatsAppChannelConfigured } from "@/lib/whatsapp/send-whatsapp";
import type { UserRole } from "@/types/clinroma";

export type { PatientCardSummary };

type TranscriptionStatus = Database["public"]["Enums"]["transcription_status"];

export interface AnamnesisVersion {
  id: string;
  signedAt: string | null;
  signatureName: string | null;
  preview: string;
  authorName: string | null;
  createdAt: string;
  formVersion: 1 | 2;
  v1?: AnamnesisContentV1;
  v2?: AnamnesisContentV2;
}

export type PublicAnamnesisInviteState = "valid" | "invalid";

export interface PublicAnamnesisInviteView {
  state: PublicAnamnesisInviteState;
  patientFullName?: string;
  vigenteDateLabel?: string | null;
  purpose?: "pre_consult" | "office";
}

export interface ToothFindingRecord {
  id: string;
  toothNumber: number;
  toothSurface: string;
  conditionCode: string;
  updatedAt: string;
}

export interface RecordAttachmentView {
  id: string;
  attachmentType: "photo" | "audio";
  mimeType: string;
  fileSizeBytes: number;
  storagePath: string;
  signedUrl: string | null;
  transcription: string | null;
  transcriptionStatus: TranscriptionStatus;
  createdAt: string;
}

export interface EvolutionRecord {
  id: string;
  text: string;
  appointmentId: string | null;
  dentistName: string | null;
  createdAt: string;
  attachments: RecordAttachmentView[];
}

export interface WhatsAppDestinationView {
  notice: string;
  hasDestination: boolean;
}

export interface PostSurgeryMessageView {
  id: string;
  createdAt: string;
  authorName: string | null;
  destinationLabel: string;
  status: PatientMessageStatus;
  statusLabel: string;
  body: string;
  scheduledAt: string | null;
  scheduledLabel: string | null;
  canCancel: boolean;
}

export interface PatientChartData {
  anamnesisVersions: AnamnesisVersion[];
  anamnesisExpiry: ReturnType<typeof evaluateAnamnesisExpiry>;
  toothFindings: ToothFindingRecord[];
  evolutions: EvolutionRecord[];
  whatsappChannelConfigured: boolean;
  whatsappDestination: WhatsAppDestinationView;
  postSurgeryMessages: PostSurgeryMessageView[];
}

function resolveAuthorName(): string | null {
  return null;
}

async function signStorageUrl(
  bucket: string,
  path: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

function resolveWhatsAppChartFields(
  patient: {
    contact_phone: string | null;
    secondary_phone: string | null;
    secondary_phone_note: string | null;
  } | null,
): WhatsAppDestinationView {
  const destination = patient
    ? resolveWhatsAppDestination({
        contactPhone: patient.contact_phone,
        secondaryPhone: patient.secondary_phone,
        secondaryPhoneNote: patient.secondary_phone_note,
      })
    : null;

  if (!destination) {
    return { hasDestination: false, notice: "" };
  }

  return {
    hasDestination: true,
    notice: formatWhatsAppDestinationNotice(destination),
  };
}

function mapPostSurgeryMessages(
  rows: Array<{
    id: string;
    created_at: string;
    destination_digits: string;
    status: PatientMessageStatus;
    body: string;
    scheduled_at: string | null;
    profiles: { display_name: string } | { display_name: string }[] | null;
  }>,
): PostSurgeryMessageView[] {
  return rows.map((row) => {
    const author = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

    return {
      id: row.id,
      createdAt: row.created_at,
      authorName: author?.display_name ?? null,
      destinationLabel: formatWhatsAppDigits(row.destination_digits),
      status: row.status,
      statusLabel: messageStatusLabel(row.status),
      body: row.body,
      scheduledAt: row.scheduled_at,
      scheduledLabel: row.scheduled_at
        ? formatScheduledAtLabel(row.scheduled_at)
        : null,
      canCancel: canCancelScheduledMessage(row.status),
    };
  });
}

export async function getPatientChartData(
  patientId: string,
): Promise<PatientChartData | null> {
  const supabase = await createClient();

  const [recordsResult, findingsResult, patientResult, messagesResult] =
    await Promise.all([
      supabase
        .from("medical_records")
        .select(
          `
        id,
        record_type,
        content,
        appointment_id,
        created_at,
        created_by,
        record_attachments (
          id,
          attachment_type,
          mime_type,
          file_size_bytes,
          storage_path,
          transcription,
          transcription_status,
          created_at
        )
      `,
        )
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("tooth_findings")
        .select("id, tooth_number, tooth_surface, condition_code, updated_at")
        .eq("patient_id", patientId)
        .order("tooth_number"),
      supabase
        .from("patients")
        .select("contact_phone, secondary_phone, secondary_phone_note")
        .eq("id", patientId)
        .maybeSingle(),
      supabase
        .from("patient_messages")
        .select(
          "id, created_at, destination_digits, status, body, scheduled_at, profiles:created_by ( display_name )",
        )
        .eq("patient_id", patientId)
        .eq("purpose", PATIENT_MESSAGE_PURPOSE.postSurgery)
        .order("created_at", { ascending: false }),
    ]);

  if (recordsResult.error || findingsResult.error) {
    return null;
  }

  const anamnesisVersions: AnamnesisVersion[] = [];
  const evolutions: EvolutionRecord[] = [];

  for (const record of recordsResult.data ?? []) {
    if (record.record_type === "anamnesis") {
      if (isAnamnesisContentV2(record.content)) {
        anamnesisVersions.push({
          id: record.id,
          signedAt: record.content.signedAt ?? null,
          signatureName: record.content.signatureName ?? null,
          preview: buildAnamnesisPreviewV2(record.content),
          authorName: resolveAuthorName(),
          createdAt: record.created_at,
          formVersion: 2,
          v2: record.content,
        });
        continue;
      }

      const content = record.content as AnamnesisContentV1;

      anamnesisVersions.push({
        id: record.id,
        signedAt: content.signedAt ?? null,
        signatureName: content.signatureName ?? null,
        preview: buildAnamnesisPreview(content),
        authorName: resolveAuthorName(),
        createdAt: record.created_at,
        formVersion: 1,
        v1: content,
      });
      continue;
    }

    if (record.record_type === "evolution") {
      const content = record.content as { text?: string };
      const attachments: RecordAttachmentView[] = [];

      for (const attachment of record.record_attachments ?? []) {
        const bucket =
          attachment.attachment_type === "photo"
            ? "record-photos"
            : "record-audio";

        attachments.push({
          id: attachment.id,
          attachmentType: attachment.attachment_type,
          mimeType: attachment.mime_type,
          fileSizeBytes: attachment.file_size_bytes,
          storagePath: attachment.storage_path,
          signedUrl: await signStorageUrl(bucket, attachment.storage_path),
          transcription: attachment.transcription,
          transcriptionStatus: attachment.transcription_status,
          createdAt: attachment.created_at,
        });
      }

      evolutions.push({
        id: record.id,
        text: content.text ?? "",
        appointmentId: record.appointment_id,
        dentistName: resolveAuthorName(),
        createdAt: record.created_at,
        attachments,
      });
    }
  }

  const vigente = pickVigenteAnamnesis(anamnesisVersions);

  return {
    anamnesisVersions,
    anamnesisExpiry: evaluateAnamnesisExpiry({
      signedAt: vigente?.signedAt ?? null,
    }),
    toothFindings: (findingsResult.data ?? []).map((finding) => ({
      id: finding.id,
      toothNumber: finding.tooth_number,
      toothSurface: finding.tooth_surface,
      conditionCode: finding.condition_code,
      updatedAt: finding.updated_at,
    })),
    evolutions,
    whatsappChannelConfigured: isWhatsAppChannelConfigured(),
    whatsappDestination: resolveWhatsAppChartFields(patientResult.data),
    postSurgeryMessages: mapPostSurgeryMessages(messagesResult.data ?? []),
  };
}

export async function getAttachmentTranscriptionStatus(
  attachmentId: string,
): Promise<{
  transcription: string | null;
  transcriptionStatus: TranscriptionStatus;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("record_attachments")
    .select("transcription, transcription_status")
    .eq("id", attachmentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    transcription: data.transcription,
    transcriptionStatus: data.transcription_status,
  };
}

export async function getPatientCardSummary(
  patientId: string,
  role: UserRole,
): Promise<PatientCardSummary | null> {
  if (!canViewClinicalContent(role)) {
    return null;
  }

  try {
    const supabase = await createClient();
    const [anamnesisResult, completedAppointment] = await Promise.all([
      supabase
        .from("medical_records")
        .select("content, created_at")
        .eq("patient_id", patientId)
        .eq("record_type", "anamnesis"),
      getLatestCompletedAppointmentForPatient(patientId),
    ]);

    const sources = (anamnesisResult.data ?? []).map((row) =>
      parseAnamnesisCardSource(row.content, row.created_at),
    );
    const anamnesis = buildAnamnesisCardView(pickVigenteAnamnesis(sources));
    const procedureName = (completedAppointment?.procedureName ?? "").trim();
    let evolutions: EvolutionCardInput[] = [];

    if (!completedAppointment || !procedureName) {
      const evoResult = await supabase
        .from("medical_records")
        .select("id, content, created_at, appointment_id")
        .eq("patient_id", patientId)
        .eq("record_type", "evolution")
        .order("created_at", { ascending: false })
        .limit(20);

      evolutions = (evoResult.data ?? []).map((row) => {
        const content = row.content as { text?: string } | null;

        return {
          id: row.id,
          text: content?.text ?? "",
          createdAt: row.created_at,
          appointmentId: row.appointment_id,
        };
      });
    }

    return {
      anamnesis,
      lastProcedure: resolveLastProcedure(completedAppointment, evolutions),
    };
  } catch {
    return emptyPatientCardSummary();
  }
}

export async function getEvolutionById(evolutionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medical_records")
    .select("id, patient_id, record_type")
    .eq("id", evolutionId)
    .maybeSingle();

  if (error || !data || data.record_type !== "evolution") {
    return null;
  }

  return data;
}

export async function getPublicAnamnesisInviteView(
  token: string,
  originKey = "anon",
): Promise<PublicAnamnesisInviteView> {
  const invalid: PublicAnamnesisInviteView = { state: "invalid" };
  const guessKey = inviteViewGuessKey(originKey);

  if (!token || token.length < 16) {
    checkInviteRateLimit(guessKey);
    return invalid;
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const tokenHash = hashAnamnesisInviteToken(token);
    const { data: invite } = await supabase
      .from("anamnesis_invites")
      .select(
        "id, patient_id, purpose, token_hash, status, expires_at, used_at",
      )
      .eq("token_hash", tokenHash)
      .maybeSingle();

    const access = evaluateInviteAccess({
      token,
      tokenHash,
      storedHash: invite?.token_hash,
      status: invite?.status,
      expiresAt: invite?.expires_at,
      usedAt: invite?.used_at ?? null,
    });

    if (access !== "valid" || !invite) {
      checkInviteRateLimit(guessKey);
      return invalid;
    }

    const [{ data: patient }, { data: records }] = await Promise.all([
      supabase
        .from("patients")
        .select("full_name")
        .eq("id", invite.patient_id)
        .maybeSingle(),
      supabase
        .from("medical_records")
        .select("content, created_at")
        .eq("patient_id", invite.patient_id)
        .eq("record_type", "anamnesis"),
    ]);

    const vigente = pickVigenteAnamnesis(
      (records ?? []).map((row) => {
        const content = row.content as { signedAt?: unknown };
        return {
          signedAt:
            typeof content?.signedAt === "string" ? content.signedAt : null,
          createdAt: row.created_at,
        };
      }),
    );
    const signedAt = vigente?.signedAt ?? null;

    return {
      state: "valid",
      patientFullName: patient?.full_name ?? "Paciente",
      vigenteDateLabel: signedAt ? formatVigenteDateLabel(signedAt) : null,
      purpose: invite.purpose,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[anamnesis-invite] view failed",
        error instanceof Error ? error.message : "erro",
      );
    }
    return invalid;
  }
}
