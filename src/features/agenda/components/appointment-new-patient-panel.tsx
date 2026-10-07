"use client";

import { SECONDARY_PHONE_COPY } from "@/features/patients/domain/secondary-phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fieldClassName = "text-base md:text-base";

export interface NewPatientDraft {
  fullName: string;
  birthDate: string;
  cpf: string;
  contactPhone: string;
  contactEmail: string;
  secondaryPhone: string;
  secondaryPhoneNote: string;
  lgpdConsent: boolean;
  signatureName: string;
}

export type NewConsultationSubmit =
  "patient-and-appointment" | "appointment-only";

export function emptyNewPatientDraft(fullName = ""): NewPatientDraft {
  return {
    fullName,
    birthDate: "",
    cpf: "",
    contactPhone: "",
    contactEmail: "",
    secondaryPhone: "",
    secondaryPhoneNote: "",
    lgpdConsent: false,
    signatureName: "",
  };
}

export function resolveNewConsultationSubmit(input: {
  isEditing: boolean;
  panelOpen: boolean;
  patientId: string;
}): NewConsultationSubmit {
  if (
    input.isEditing ||
    !input.panelOpen ||
    input.patientId.trim().length > 0
  ) {
    return "appointment-only";
  }

  return "patient-and-appointment";
}

interface AppointmentNewPatientPanelProps {
  draft: NewPatientDraft;
  onDraftChange: (draft: NewPatientDraft) => void;
  onUseRegisteredPatient: () => void;
  disabled?: boolean;
}

export function AppointmentNewPatientPanel({
  draft,
  onDraftChange,
  onUseRegisteredPatient,
  disabled = false,
}: AppointmentNewPatientPanelProps) {
  function setField<Key extends keyof NewPatientDraft>(
    key: Key,
    value: NewPatientDraft[Key],
  ) {
    onDraftChange({ ...draft, [key]: value });
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="new-patient-full-name">Nome completo</Label>
          <Input
            id="new-patient-full-name"
            value={draft.fullName}
            disabled={disabled}
            className={fieldClassName}
            onChange={(event) => setField("fullName", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-patient-birth-date">Data de nascimento</Label>
          <Input
            id="new-patient-birth-date"
            type="date"
            value={draft.birthDate}
            disabled={disabled}
            className={fieldClassName}
            onChange={(event) => setField("birthDate", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-patient-cpf">CPF</Label>
          <Input
            id="new-patient-cpf"
            value={draft.cpf}
            disabled={disabled}
            placeholder="000.000.000-00"
            className={fieldClassName}
            onChange={(event) => setField("cpf", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-patient-phone">Telefone</Label>
          <Input
            id="new-patient-phone"
            value={draft.contactPhone}
            disabled={disabled}
            className={fieldClassName}
            onChange={(event) => setField("contactPhone", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-patient-email">E-mail</Label>
          <Input
            id="new-patient-email"
            type="email"
            value={draft.contactEmail}
            disabled={disabled}
            className={fieldClassName}
            onChange={(event) => setField("contactEmail", event.target.value)}
          />
        </div>
        <p className="text-sm text-muted-foreground sm:col-span-2">
          {SECONDARY_PHONE_COPY.help}
        </p>
        <div className="space-y-2">
          <Label htmlFor="new-patient-secondary-phone">
            {SECONDARY_PHONE_COPY.phoneFieldLabel}
          </Label>
          <Input
            id="new-patient-secondary-phone"
            value={draft.secondaryPhone}
            disabled={disabled}
            className={fieldClassName}
            onChange={(event) => setField("secondaryPhone", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-patient-secondary-note">
            {SECONDARY_PHONE_COPY.noteLabel}
          </Label>
          <Input
            id="new-patient-secondary-note"
            value={draft.secondaryPhoneNote}
            disabled={disabled}
            placeholder={SECONDARY_PHONE_COPY.notePlaceholder}
            className={fieldClassName}
            onChange={(event) =>
              setField("secondaryPhoneNote", event.target.value)
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">Consentimento LGPD</h3>
        <p className="text-sm text-muted-foreground">
          O paciente (ou responsável) autoriza o tratamento dos dados para
          atendimento clínico e comunicação da clínica.
        </p>
        <label className="flex min-h-11 items-start gap-2.5 text-sm">
          <input
            id="new-patient-lgpd"
            type="checkbox"
            className="mt-1"
            checked={draft.lgpdConsent}
            disabled={disabled}
            onChange={(event) => setField("lgpdConsent", event.target.checked)}
          />
          <span>Li e o paciente concorda com o tratamento dos dados.</span>
        </label>
        <div className="space-y-2">
          <Label htmlFor="new-patient-signature">Nome para assinatura</Label>
          <Input
            id="new-patient-signature"
            value={draft.signatureName}
            disabled={disabled}
            className={fieldClassName}
            onChange={(event) => setField("signatureName", event.target.value)}
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={disabled}
        onClick={onUseRegisteredPatient}
      >
        Usar paciente já cadastrado
      </Button>
    </section>
  );
}
