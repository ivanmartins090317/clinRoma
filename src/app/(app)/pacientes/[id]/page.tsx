import Link from "next/link";
import { notFound } from "next/navigation";

import { getPatientById } from "@/features/patients/queries";
import { PatientChart } from "@/features/records/components/patient-chart";
import { getPatientChartData } from "@/features/records/queries";
import { canViewClinicalContent } from "@/features/records/permissions";
import { requireAuthSession } from "@/lib/auth/session";

export const metadata = { title: "Ficha do paciente" };

interface PatientDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ consulta?: string }>;
}

export default async function PatientDetailPage({
  params,
  searchParams,
}: PatientDetailPageProps) {
  const { id } = await params;
  const { consulta } = await searchParams;
  const session = await requireAuthSession(`/pacientes/${id}`);

  const patient = await getPatientById(id);

  if (!patient) {
    notFound();
  }

  const chart = canViewClinicalContent(session.profile.role)
    ? await getPatientChartData(id)
    : null;

  const origin = consulta ? ("agenda" as const) : ("lista-pacientes" as const);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/pacientes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Voltar para pacientes
        </Link>
        <h2 className="mt-2 text-2xl font-semibold">{patient.fullName}</h2>
        {consulta ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta vinculada pela agenda.
          </p>
        ) : null}
      </div>

      <PatientChart
        patient={patient}
        chart={chart}
        role={session.profile.role}
        appointmentId={consulta}
        origin={origin}
      />
    </div>
  );
}
