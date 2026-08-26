import { ANAMNESIS_COPY } from "@/features/records/domain/anamnesis-form-v2";

interface AnamnesisPublicHeaderProps {
  patientFullName: string;
}

export function AnamnesisPublicHeader({
  patientFullName,
}: AnamnesisPublicHeaderProps) {
  return (
    <header className="space-y-2 text-center">
      <p className="text-lg font-semibold text-primary">
        {ANAMNESIS_COPY.dentistName}
      </p>
      <p className="text-sm text-muted-foreground">
        {ANAMNESIS_COPY.dentistRole}
      </p>
      <p className="text-sm text-muted-foreground">
        {ANAMNESIS_COPY.dentistSpecialty}
      </p>
      <h1 className="pt-3 text-xl font-bold tracking-wide text-foreground">
        {ANAMNESIS_COPY.publicTitle}
      </h1>
      <p className="text-base font-medium text-foreground">{patientFullName}</p>
    </header>
  );
}
