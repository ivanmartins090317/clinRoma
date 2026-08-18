"use client";

import { useEffect } from "react";

import { auditPatientChartReadAction } from "@/features/records/actions";
import { AnamnesisForm } from "@/features/records/components/anamnesis-form";
import { AnamnesisHistory } from "@/features/records/components/anamnesis-history";
import { EvolutionForm } from "@/features/records/components/evolution-form";
import { EvolutionList } from "@/features/records/components/evolution-list";
import { Odontogram } from "@/features/records/components/odontogram";
import { OdontogramMobile } from "@/features/records/components/odontogram-mobile";
import type { PatientChartData } from "@/features/records/queries";
import {
  canRegisterEvolution,
  canViewClinicalContent,
  canWriteClinicalChart,
} from "@/features/records/permissions";
import { PatientSummary } from "@/features/patients/components/patient-summary";
import type { PatientDetail } from "@/features/patients/queries";
import { PatientForm } from "@/features/patients/components/patient-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserRole } from "@/types/clinroma";

interface PatientChartProps {
  patient: PatientDetail;
  chart: PatientChartData | null;
  role: UserRole;
  appointmentId?: string;
  origin: "agenda" | "lista-pacientes";
}

export function PatientChart({
  patient,
  chart,
  role,
  appointmentId,
  origin,
}: PatientChartProps) {
  const canViewClinical = canViewClinicalContent(role);
  const canWriteClinical = canWriteClinicalChart(role);
  const canEvolution = canRegisterEvolution(role);

  useEffect(() => {
    if (!canViewClinical) {
      return;
    }

    void auditPatientChartReadAction({ patientId: patient.id, origin });
  }, [canViewClinical, origin, patient.id]);

  return (
    <div className="space-y-6">
      <PatientSummary patient={patient} />

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          {canViewClinical ? (
            <>
              <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
              <TabsTrigger value="odontograma">Odontograma</TabsTrigger>
              <TabsTrigger value="evolucoes">Evoluções</TabsTrigger>
            </>
          ) : null}
        </TabsList>

        <TabsContent value="resumo" className="space-y-4">
          {canWriteClinical ? (
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 font-semibold">Editar cadastro</h3>
              <PatientForm mode="edit" patient={patient} />
            </section>
          ) : (
            <p className="text-sm text-muted-foreground">
              Você tem acesso somente leitura aos dados cadastrais.
            </p>
          )}
        </TabsContent>

        {canViewClinical && chart ? (
          <>
            <TabsContent value="anamnese" className="space-y-4">
              {chart.anamnesisExpiry.isExpired ? (
                <Alert variant="warning">
                  <AlertTitle>Anamnese desatualizada</AlertTitle>
                  <AlertDescription>
                    A última anamnese tem mais de 12 meses. Registre uma nova
                    versão antes ou durante o atendimento.
                  </AlertDescription>
                </Alert>
              ) : null}
              {canWriteClinical ? (
                <AnamnesisForm patientId={patient.id} />
              ) : null}
              <AnamnesisHistory versions={chart.anamnesisVersions} />
            </TabsContent>

            <TabsContent value="odontograma">
              <div className="hidden md:block">
                <Odontogram
                  patientId={patient.id}
                  findings={chart.toothFindings}
                  canWrite={canWriteClinical}
                />
              </div>
              <div className="md:hidden">
                <OdontogramMobile
                  patientId={patient.id}
                  findings={chart.toothFindings}
                  canWrite={canWriteClinical}
                />
              </div>
            </TabsContent>

            <TabsContent value="evolucoes" className="space-y-4">
              {canEvolution ? (
                <EvolutionForm
                  patientId={patient.id}
                  appointmentId={appointmentId}
                />
              ) : null}
              <EvolutionList
                evolutions={chart.evolutions}
                canRetryTranscription={canEvolution}
              />
            </TabsContent>
          </>
        ) : null}
      </Tabs>
    </div>
  );
}
