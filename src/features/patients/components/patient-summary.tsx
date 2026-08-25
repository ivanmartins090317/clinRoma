import { formatCpfDisplay } from "@/features/patients/domain/cpf";
import {
  SECONDARY_PHONE_COPY,
  hasSecondaryPhone,
} from "@/features/patients/domain/secondary-phone";
import type { PatientDetail } from "@/features/patients/queries";
import { Badge } from "@/components/ui/badge";

interface PatientSummaryProps {
  patient: PatientDetail;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Não informado";
  }

  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

export function PatientSummary({ patient }: PatientSummaryProps) {
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
    </section>
  );
}
