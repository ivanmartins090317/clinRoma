"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createPatientAction,
  updatePatientAction,
} from "@/features/patients/actions";
import type { PatientDetail } from "@/features/patients/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

interface PatientFormProps {
  mode: "create" | "edit";
  patient?: PatientDetail;
}

export function PatientForm({ mode, patient }: PatientFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [existingPatientId, setExistingPatientId] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setExistingPatientId(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const payload = {
        fullName: String(formData.get("fullName") ?? ""),
        birthDate: String(formData.get("birthDate") ?? ""),
        cpf: String(formData.get("cpf") ?? ""),
        contactPhone: String(formData.get("contactPhone") ?? ""),
        contactEmail: String(formData.get("contactEmail") ?? ""),
        lgpdConsent: formData.get("lgpdConsent") === "on",
        signatureName: String(formData.get("signatureName") ?? ""),
      };

      const result =
        mode === "create"
          ? await createPatientAction(payload)
          : await updatePatientAction({
              id: patient!.id,
              fullName: payload.fullName,
              birthDate: payload.birthDate,
              cpf: payload.cpf,
              contactPhone: payload.contactPhone,
              contactEmail: payload.contactEmail,
            });

      if (result.error) {
        setError(result.error);
        setExistingPatientId(result.existingPatientId ?? null);
        return;
      }

      toast(mode === "create" ? "Paciente cadastrado" : "Dados atualizados");

      if (result.patientId) {
        router.push(`/pacientes/${result.patientId}`);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="fullName">Nome completo</Label>
          <Input
            id="fullName"
            name="fullName"
            required
            defaultValue={patient?.fullName}
            className="text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthDate">Data de nascimento</Label>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={patient?.birthDate ?? ""}
            className="text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            name="cpf"
            defaultValue={patient?.cpf ?? ""}
            placeholder="000.000.000-00"
            className="text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Telefone</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            defaultValue={patient?.contactPhone ?? ""}
            className="text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">E-mail</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={patient?.contactEmail ?? ""}
            className="text-base"
          />
        </div>
      </div>

      {mode === "create" ? (
        <section className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <h3 className="font-medium">Consentimento LGPD</h3>
          <p className="text-sm text-muted-foreground">
            O paciente (ou responsável) autoriza o tratamento dos dados para
            atendimento clínico e comunicação da clínica.
          </p>
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="lgpdConsent"
              required
              className="mt-1 size-4"
            />
            <span>Li e o paciente concorda com o tratamento dos dados.</span>
          </label>
          <div className="space-y-2">
            <Label htmlFor="signatureName">Nome para assinatura</Label>
            <Input
              id="signatureName"
              name="signatureName"
              required
              className="text-base"
            />
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <p>{error}</p>
          {existingPatientId ? (
            <Link
              href={`/pacientes/${existingPatientId}`}
              className="mt-2 inline-block font-medium underline"
            >
              Abrir paciente existente
            </Link>
          ) : null}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={isPending}
        className="min-h-11 w-full sm:w-auto"
      >
        {isPending
          ? "Salvando..."
          : mode === "create"
            ? "Cadastrar paciente"
            : "Salvar alterações"}
      </Button>
    </form>
  );
}
