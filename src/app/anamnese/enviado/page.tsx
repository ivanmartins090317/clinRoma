import { ANAMNESIS_COPY } from "@/features/records/domain/anamnesis-form-v2";

export const metadata = { title: ANAMNESIS_COPY.publicTitle };

export default function AnamneseEnviadoPage() {
  return (
    <p className="text-center text-base font-medium text-foreground">
      {ANAMNESIS_COPY.successInvite}
    </p>
  );
}
