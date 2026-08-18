import Link from "next/link";

import { PatientList } from "@/features/patients/components/patient-list";
import { listPatients } from "@/features/patients/queries";
import { getModuleAccess } from "@/lib/auth/roles";
import { requireAuthSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Pacientes" };

export default async function PacientesPage() {
  const session = await requireAuthSession("/pacientes");
  const canCreate =
    getModuleAccess(session.profile.role, "patients") === "write";
  const patients = await listPatients("");

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Pacientes
          </h2>
          <p className="mt-2 text-muted-foreground">
            Busque pacientes e abra a ficha clínica.
          </p>
        </div>
        {canCreate ? (
          <Button asChild className="min-h-11">
            <Link href="/pacientes/novo">Novo paciente</Link>
          </Button>
        ) : null}
      </section>

      <PatientList initialPatients={patients} canCreate={canCreate} />
    </div>
  );
}
