import { createClient } from "@/lib/supabase/server";
import {
  buildAnamnesisPreview,
  type AnamnesisContentV1,
} from "@/features/records/domain/anamnesis-form-v1";
import { evaluateAnamnesisExpiry } from "@/features/records/domain/anamnesis-expiry";
import type { Database } from "@/lib/supabase/database.types";

type TranscriptionStatus = Database["public"]["Enums"]["transcription_status"];

export interface AnamnesisVersion {
  id: string;
  signedAt: string | null;
  signatureName: string | null;
  preview: string;
  authorName: string | null;
  createdAt: string;
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

export interface PatientChartData {
  anamnesisVersions: AnamnesisVersion[];
  anamnesisExpiry: ReturnType<typeof evaluateAnamnesisExpiry>;
  toothFindings: ToothFindingRecord[];
  evolutions: EvolutionRecord[];
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

export async function getPatientChartData(
  patientId: string,
): Promise<PatientChartData | null> {
  const supabase = await createClient();

  const [recordsResult, findingsResult] = await Promise.all([
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
  ]);

  if (recordsResult.error || findingsResult.error) {
    return null;
  }

  const anamnesisVersions: AnamnesisVersion[] = [];
  const evolutions: EvolutionRecord[] = [];

  for (const record of recordsResult.data ?? []) {
    if (record.record_type === "anamnesis") {
      const content = record.content as AnamnesisContentV1;

      anamnesisVersions.push({
        id: record.id,
        signedAt: content.signedAt ?? null,
        signatureName: content.signatureName ?? null,
        preview: buildAnamnesisPreview(content),
        authorName: resolveAuthorName(),
        createdAt: record.created_at,
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

  const latestSignedAt = anamnesisVersions[0]?.signedAt ?? null;

  return {
    anamnesisVersions,
    anamnesisExpiry: evaluateAnamnesisExpiry({ signedAt: latestSignedAt }),
    toothFindings: (findingsResult.data ?? []).map((finding) => ({
      id: finding.id,
      toothNumber: finding.tooth_number,
      toothSurface: finding.tooth_surface,
      conditionCode: finding.condition_code,
      updatedAt: finding.updated_at,
    })),
    evolutions,
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
