import { BackLink } from "@/components/back-link";
import { PatientForm } from "@/features/patients/components/patient-form";
import { requireAuthSession } from "@/lib/auth/session";
import { getModuleAccess } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export const metadata = { title: "Novo paciente" };

export default async function NovoPacientePage() {
  const session = await requireAuthSession("/pacientes/novo");

  if (getModuleAccess(session.profile.role, "patients") !== "write") {
    redirect("/acesso-negado");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-3">
        <BackLink href="/pacientes" label="Voltar para pacientes" />
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Novo paciente
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastro com consentimento LGPD obrigatório.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <PatientForm mode="create" />
      </div>
    </div>
  );
}
