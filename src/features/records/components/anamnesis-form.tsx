"use client";

import { useState, useTransition } from "react";

import { saveAnamnesisAction } from "@/features/records/actions";
import { ANAMNESIS_FORM_SECTIONS } from "@/features/records/domain/anamnesis-form-v1";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

interface AnamnesisFormProps {
  patientId: string;
}

export function AnamnesisForm({ patientId }: AnamnesisFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const payload = {
        patientId,
        signatureConfirmed: formData.get("signatureConfirmed") === "on",
        signatureName: String(formData.get("signatureName") ?? ""),
        generalHealth: String(formData.get("generalHealth") ?? ""),
        lastDentalVisit: String(formData.get("lastDentalVisit") ?? ""),
        allergies: String(formData.get("allergies") ?? ""),
        medications: String(formData.get("medications") ?? ""),
        systemicConditions: String(formData.get("systemicConditions") ?? ""),
        pregnancy: String(formData.get("pregnancy") ?? ""),
        habits: String(formData.get("habits") ?? ""),
        chiefComplaint: String(formData.get("chiefComplaint") ?? ""),
      };

      const result = await saveAnamnesisAction(payload);

      if (result.error) {
        setError(result.error);
        return;
      }

      toast("Nova versão de anamnese salva");
      event.currentTarget.reset();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-border bg-card p-5"
    >
      <div>
        <h3 className="font-semibold">Nova anamnese</h3>
        <p className="text-sm text-muted-foreground">
          Formulário Dr. Fellipe S. Roma · versão 1
        </p>
      </div>

      {ANAMNESIS_FORM_SECTIONS.map((section) => (
        <section key={section.id} className="space-y-3">
          <h4 className="font-medium">{section.title}</h4>
          {section.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              {field.multiline ? (
                <Textarea
                  id={field.id}
                  name={field.id}
                  placeholder={field.placeholder}
                  className="text-base"
                />
              ) : (
                <Input
                  id={field.id}
                  name={field.id}
                  placeholder={field.placeholder}
                  className="text-base"
                />
              )}
            </div>
          ))}
        </section>
      ))}

      <section className="space-y-3 rounded-lg border border-border p-4">
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="signatureConfirmed"
            required
            className="mt-1 size-4"
          />
          <span>
            Confirmo que as informações foram revisadas com o paciente.
          </span>
        </label>
        <div className="space-y-2">
          <Label htmlFor="signatureName">Assinatura (nome digitado)</Label>
          <Input
            id="signatureName"
            name="signatureName"
            required
            className="text-base"
          />
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button
        type="submit"
        disabled={isPending}
        className="min-h-11 w-full sm:w-auto"
      >
        {isPending ? "Salvando..." : "Salvar nova versão"}
      </Button>
    </form>
  );
}
