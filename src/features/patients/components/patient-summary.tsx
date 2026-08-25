import type { ReactNode } from "react";

import { formatCpfDisplay } from "@/features/patients/domain/cpf";
import {
  SECONDARY_PHONE_COPY,
  hasSecondaryPhone,
} from "@/features/patients/domain/secondary-phone";
import type { PatientDetail } from "@/features/patients/queries";
import {
  PATIENT_CARD_COPY,
  type PatientCardSummary,
} from "@/features/records/domain/patient-card-summary";
import { Badge } from "@/components/ui/badge";

interface PatientSummaryProps {
  patient: PatientDetail;
  clinicalSummary?: PatientCardSummary | null;
  onOpenAnamnesis?: () => void;
  onOpenEvolutions?: () => void;
}

interface ClinicalCardBlockProps {
  title: string;
  shortcut: string;
  onOpen?: () => void;
  children: ReactNode;
}

function ClinicalCardBlock({
  title,
  shortcut,
  onOpen,
  children,
}: ClinicalCardBlockProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={shortcut}
      className="flex min-h-11 w-full flex-col items-start gap-1.5 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-muted/40"
    >
      <span className="text-sm font-semibold">{title}</span>
      {children}
      <span className="text-base text-primary">{shortcut}</span>
    </button>
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Não informado";
  }

  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

export function PatientSummary({
  patient,
  clinicalSummary,
  onOpenAnamnesis,
  onOpenEvolutions,
}: PatientSummaryProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{patient.fullName}</h2>
          <p className="text-sm text-muted-foreground">
            Nascimento: {formatDate(patient.birthDate)}
          </p>
        </div>
        {patient.lgpdConsentAt ? (
          <Badge variant="secondary">LGPD registrado</Badge>
        ) : (
          <Badge variant="destructive">Sem consentimento</Badge>
        )}
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">CPF</dt>
          <dd>
            {patient.cpf ? formatCpfDisplay(patient.cpf) : "Não informado"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Telefone</dt>
          <dd>{patient.contactPhone ?? "Não informado"}</dd>
        </div>
        {hasSecondaryPhone(patient.secondaryPhone) ? (
          <div>
            <dt className="text-muted-foreground">
              {SECONDARY_PHONE_COPY.phoneLabel}
            </dt>
            <dd>
              {patient.secondaryPhone}
              {patient.secondaryPhoneNote ? (
                <span className="mt-0.5 block text-muted-foreground">
                  {patient.secondaryPhoneNote}
                </span>
              ) : null}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-muted-foreground">E-mail</dt>
          <dd>{patient.contactEmail ?? "Não informado"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Consentimento LGPD</dt>
          <dd>
            {patient.lgpdConsentAt
              ? new Date(patient.lgpdConsentAt).toLocaleString("pt-BR")
              : "Pendente"}
          </dd>
        </div>
      </dl>

      {clinicalSummary ? (
        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <ClinicalCardBlock
            title={PATIENT_CARD_COPY.anamnesisTitle}
            shortcut={PATIENT_CARD_COPY.openAnamnesis}
            onOpen={onOpenAnamnesis}
          >
            {clinicalSummary.anamnesis.dateLabel ? (
              <p className="text-sm text-muted-foreground">
                {clinicalSummary.anamnesis.dateLabel}
              </p>
            ) : null}
            {clinicalSummary.anamnesis.isStale ? (
              <p className="text-sm text-amber-800">
                {PATIENT_CARD_COPY.staleAlert}
              </p>
            ) : null}
            {clinicalSummary.anamnesis.isMissing ? (
              <p className="text-sm">{PATIENT_CARD_COPY.missingAnamnesis}</p>
            ) : null}
            {clinicalSummary.anamnesis.lines.map((line) => (
              <p key={line.label} className="text-sm">
                <span className="text-muted-foreground">{line.label}: </span>
                {line.value}
              </p>
            ))}
            {clinicalSummary.anamnesis.relevantYes.length > 0 ? (
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {PATIENT_CARD_COPY.relevantYes}
                </p>
                {clinicalSummary.anamnesis.relevantYes.map((item) => (
                  <p key={item} className="text-sm">
                    {item}
                  </p>
                ))}
              </div>
            ) : null}
          </ClinicalCardBlock>

          <ClinicalCardBlock
            title={PATIENT_CARD_COPY.lastProcedureTitle}
            shortcut={PATIENT_CARD_COPY.openEvolutions}
            onOpen={onOpenEvolutions}
          >
            {clinicalSummary.lastProcedure.dateLabel ? (
              <p className="text-sm text-muted-foreground">
                {clinicalSummary.lastProcedure.dateLabel}
              </p>
            ) : null}
            <p className="text-sm">{clinicalSummary.lastProcedure.text}</p>
          </ClinicalCardBlock>
        </div>
      ) : null}
    </section>
  );
}
