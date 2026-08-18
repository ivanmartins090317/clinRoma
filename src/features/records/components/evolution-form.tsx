"use client";

import { useState, useTransition } from "react";

import { createEvolutionAction } from "@/features/records/actions";
import { AudioRecorder } from "@/features/records/components/audio-recorder";
import { PhotoAttachment } from "@/features/records/components/photo-attachment";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

interface EvolutionFormProps {
  patientId: string;
  appointmentId?: string;
}

export function EvolutionForm({
  patientId,
  appointmentId,
}: EvolutionFormProps) {
  const [evolutionId, setEvolutionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const text = String(formData.get("text") ?? "");

    startTransition(async () => {
      const result = await createEvolutionAction({
        patientId,
        appointmentId,
        text,
      });

      if (result.error || !result.recordId) {
        setError(result.error ?? "Não foi possível criar evolução");
        return;
      }

      setEvolutionId(result.recordId);
      toast("Evolução criada. Anexe foto ou áudio.");
    });
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h3 className="font-semibold">Nova evolução</h3>
        {appointmentId ? (
          <p className="text-sm text-muted-foreground">
            Consulta vinculada automaticamente pela agenda.
          </p>
        ) : null}
      </div>

      {!evolutionId ? (
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="evolution-text">Evolução clínica</Label>
            <Textarea
              id="evolution-text"
              name="text"
              required
              placeholder="Queixa, procedimento, orientações..."
              className="min-h-28 text-base"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <p className="text-sm text-muted-foreground">
            Após criar a evolução, os botões de foto e gravação de áudio
            aparecem abaixo.
          </p>
          <Button type="submit" disabled={isPending} className="min-h-11">
            {isPending ? "Salvando..." : "Criar evolução"}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Evolução #{evolutionId.slice(0, 8)} pronta para anexos.
          </p>
          <PhotoAttachment patientId={patientId} evolutionId={evolutionId} />
          <AudioRecorder patientId={patientId} evolutionId={evolutionId} />
        </div>
      )}
    </section>
  );
}
