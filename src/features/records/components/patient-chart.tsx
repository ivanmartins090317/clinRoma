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
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/clinroma";

const chartTabTriggerClass =
  "relative min-h-11 flex-none rounded-none border-0 bg-transparent px-5 py-3 text-sm font-medium tracking-wide text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-none after:absolute after:inset-x-5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent after:transition-colors data-[state=active]:after:bg-neo-gold-500";

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

      <Tabs defaultValue="resumo" className="gap-0">
        <div className="rounded-xl border border-border/70 bg-card shadow-sm">
          <TabsList className="h-auto min-h-0 w-full justify-start gap-0 overflow-x-auto overflow-y-hidden rounded-none rounded-t-xl border-b border-border/60 bg-neo-cream-50/80 p-0 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger
              value="resumo"
              className={cn(chartTabTriggerClass, "rounded-tl-xl")}
            >
              Resumo
            </TabsTrigger>
            {canViewClinical ? (
              <>
                <TabsTrigger value="anamnese" className={chartTabTriggerClass}>
                  Anamnese
                </TabsTrigger>
                <TabsTrigger value="odontograma" className={chartTabTriggerClass}>
                  Odontograma
                </TabsTrigger>
                <TabsTrigger
                  value="evolucoes"
                  className={cn(chartTabTriggerClass, "rounded-tr-xl")}
                >
                  Evoluções
                </TabsTrigger>
              </>
            ) : null}
          </TabsList>

          <div className="p-5 md:p-6">

            <TabsContent value="resumo" className="mt-0 space-y-4">
              {canWriteClinical ? (
                <section className="space-y-4">
                  <h3 className="font-semibold text-primary">Editar cadastro</h3>
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
                <TabsContent value="anamnese" className="mt-0 space-y-4">
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

                <TabsContent value="odontograma" className="mt-0">
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

                <TabsContent value="evolucoes" className="mt-0 space-y-4">
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
          </div>
        </div>
      </Tabs>
    </div>
  );
}
