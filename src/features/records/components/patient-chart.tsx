"use client";

import { useEffect, useState, useTransition } from "react";

import {
  auditPatientChartReadAction,
  generateAnamnesisInviteAction,
} from "@/features/records/actions";
import { AnamnesisForm } from "@/features/records/components/anamnesis-form";
import { AnamnesisHistory } from "@/features/records/components/anamnesis-history";
import { EvolutionForm } from "@/features/records/components/evolution-form";
import { EvolutionList } from "@/features/records/components/evolution-list";
import { Odontogram } from "@/features/records/components/odontogram";
import { OdontogramMobile } from "@/features/records/components/odontogram-mobile";
import type {
  PatientCardSummary,
  PatientChartData,
} from "@/features/records/queries";
import {
  canCorrectTranscription,
  canRegisterEvolution,
  canRetryTranscription,
  canViewClinicalContent,
  canWriteClinicalChart,
} from "@/features/records/permissions";
import { ANAMNESIS_COPY } from "@/features/records/domain/anamnesis-form-v2";
import { PatientSummary } from "@/features/patients/components/patient-summary";
import type { PatientDetail } from "@/features/patients/queries";
import { PatientForm } from "@/features/patients/components/patient-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/clinroma";

const chartTabTriggerClass =
  "relative min-h-11 flex-none rounded-none border-0 bg-transparent px-5 py-3 text-sm font-medium tracking-wide text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-none after:absolute after:inset-x-5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent after:transition-colors data-[state=active]:after:bg-neo-gold-500";

type ChartTab = "resumo" | "anamnese" | "odontograma" | "evolucoes";

function AnamnesisInviteActions({ patientId }: { patientId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState<{
    url: string;
    purpose: "pre_consult" | "office";
    replaced: boolean;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function generate(
    purpose: "pre_consult" | "office",
    options?: { openAfter?: boolean },
  ) {
    setError(null);
    startTransition(async () => {
      const result = await generateAnamnesisInviteAction({
        patientId,
        purpose,
      });

      if (result.error || !result.inviteUrl) {
        setError(result.error ?? ANAMNESIS_COPY.forbiddenInvite);
        return;
      }

      setCopied(false);
      setLink({
        url: result.inviteUrl,
        purpose,
        replaced: Boolean(result.replaced),
      });

      if (options?.openAfter) {
        const opened = window.open(
          result.inviteUrl,
          "_blank",
          "noopener,noreferrer",
        );
        if (!opened) {
          setError(
            "O navegador bloqueou a nova aba. Copie o link e abra no tablet.",
          );
        }
      }
    });
  }

  async function copyLink() {
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => generate("pre_consult")}
          className="min-h-11"
        >
          {ANAMNESIS_COPY.generatePreConsult}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => generate("office", { openAfter: true })}
          className="min-h-11"
        >
          {ANAMNESIS_COPY.openTablet}
        </Button>
      </div>
      {link ? (
        <div className="space-y-2">
          {link.replaced ? (
            <p className="text-sm text-muted-foreground">
              {ANAMNESIS_COPY.linkReplaced}
            </p>
          ) : null}
          <p className="break-all text-sm text-muted-foreground">{link.url}</p>
          <Button type="button" onClick={copyLink} className="min-h-11">
            {copied ? "Link copiado" : "Copiar link"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {link.purpose === "office"
              ? ANAMNESIS_COPY.helpTablet
              : ANAMNESIS_COPY.helpPreConsult}
          </p>
        </div>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}

function isChartTab(value: string): value is ChartTab {
  return (
    value === "resumo" ||
    value === "anamnese" ||
    value === "odontograma" ||
    value === "evolucoes"
  );
}

interface PatientChartProps {
  patient: PatientDetail;
  chart: PatientChartData | null;
  cardSummary?: PatientCardSummary | null;
  role: UserRole;
  appointmentId?: string;
  origin: "agenda" | "lista-pacientes";
}

export function PatientChart({
  patient,
  chart,
  cardSummary,
  role,
  appointmentId,
  origin,
}: PatientChartProps) {
  const canViewClinical = canViewClinicalContent(role);
  const canWriteClinical = canWriteClinicalChart(role);
  const canEvolution = canRegisterEvolution(role);
  const canRetry = canRetryTranscription(role);
  const canCorrect = canCorrectTranscription(role);
  const [activeTab, setActiveTab] = useState<ChartTab>("resumo");

  useEffect(() => {
    if (!canViewClinical) {
      return;
    }

    void auditPatientChartReadAction({ patientId: patient.id, origin });
  }, [canViewClinical, origin, patient.id]);

  return (
    <div className="space-y-6">
      <PatientSummary
        patient={patient}
        clinicalSummary={canViewClinical ? (cardSummary ?? null) : null}
        onOpenAnamnesis={() => setActiveTab("anamnese")}
        onOpenEvolutions={() => setActiveTab("evolucoes")}
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (isChartTab(value)) {
            setActiveTab(value);
          }
        }}
        className="gap-0"
      >
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
                <TabsTrigger
                  value="odontograma"
                  className={chartTabTriggerClass}
                >
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
                  <h3 className="font-semibold text-primary">
                    Editar cadastro
                  </h3>
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
                        A última anamnese tem mais de 12 meses. Registre uma
                        nova versão antes ou durante o atendimento.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  {canWriteClinical ? (
                    <>
                      <AnamnesisInviteActions patientId={patient.id} />
                      <AnamnesisForm surface="chart" patientId={patient.id} />
                    </>
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
                    canRetryTranscription={canRetry}
                    canCorrectTranscription={canCorrect}
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
