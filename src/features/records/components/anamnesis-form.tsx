"use client";

import { useMemo, useState, useTransition } from "react";

import {
  saveAnamnesisAction,
  submitAnamnesisInviteAction,
} from "@/features/records/actions";
import { AnamnesisDiseaseList } from "@/features/records/components/anamnesis-disease-list";
import { AnamnesisYesNoField } from "@/features/records/components/anamnesis-yes-no-field";
import {
  ANAMNESIS_COPY,
  ANAMNESIS_DECLARATION_TEXT,
  PAPER_BLOCKS,
  listYesNoQuestions,
  type PaperAnswerDraft,
} from "@/features/records/domain/anamnesis-form-v2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

interface AnamnesisFormProps {
  surface: "chart" | "invite";
  patientId?: string;
  token?: string;
  vigenteDateLabel?: string | null;
}

function emptyAnswers(): Record<string, PaperAnswerDraft> {
  const answers: Record<string, PaperAnswerDraft> = {};

  for (const question of listYesNoQuestions()) {
    answers[question.id] = { answer: null, complement: "" };
  }

  return answers;
}

export function AnamnesisForm({
  surface,
  patientId,
  token,
  vigenteDateLabel,
}: AnamnesisFormProps) {
  const [answers, setAnswers] = useState(emptyAnswers);
  const [diseases, setDiseases] = useState<string[]>([]);
  const [otherDisease, setOtherDisease] = useState("");
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isInvite = surface === "invite";

  const payload = useMemo(
    () => ({
      answers,
      diseases,
      otherDisease,
      signatureConfirmed,
      signatureName,
    }),
    [answers, diseases, otherDisease, signatureConfirmed, signatureName],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = isInvite
        ? await submitAnamnesisInviteAction({
            ...payload,
            token,
            consentConfirmed,
          })
        : await saveAnamnesisAction({
            ...payload,
            patientId,
          });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (isInvite) {
        setSubmitted(true);
        return;
      }

      toast(ANAMNESIS_COPY.successChart);
      setAnswers(emptyAnswers());
      setDiseases([]);
      setOtherDisease("");
      setSignatureConfirmed(false);
      setSignatureName("");
    });
  }

  if (isInvite && submitted) {
    return (
      <p className="text-center text-base font-medium">
        {ANAMNESIS_COPY.successInvite}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-2xl space-y-6 rounded-xl border border-border bg-card p-5"
    >
      {isInvite ? null : (
        <div>
          <h3 className="font-semibold">Nova anamnese</h3>
          <p className="text-sm text-muted-foreground">
            {ANAMNESIS_COPY.publicTitle}
          </p>
        </div>
      )}

      {isInvite && vigenteDateLabel ? (
        <p className="text-base">
          Você já preencheu em {vigenteDateLabel}. Pode enviar uma nova versão.
        </p>
      ) : null}

      {PAPER_BLOCKS.map((block) => (
        <section key={block.id} className="space-y-4">
          <h4 className="font-medium">{block.title}</h4>
          {block.questions.map((question) => (
            <AnamnesisYesNoField
              key={question.id}
              question={question}
              value={answers[question.id] ?? { answer: null, complement: "" }}
              onChange={(value) =>
                setAnswers((current) => ({ ...current, [question.id]: value }))
              }
              disabled={isPending}
            />
          ))}
          {block.includeDiseases ? (
            <AnamnesisDiseaseList
              selectedIds={diseases}
              otherDisease={otherDisease}
              onToggle={(id) =>
                setDiseases((current) =>
                  current.includes(id)
                    ? current.filter((item) => item !== id)
                    : [...current, id],
                )
              }
              onOtherDiseaseChange={setOtherDisease}
              disabled={isPending}
            />
          ) : null}
        </section>
      ))}

      <section className="space-y-3 rounded-lg border border-border p-4">
        {isInvite ? (
          <label className="flex min-h-11 items-start gap-2.5 text-base">
            <input
              type="checkbox"
              checked={consentConfirmed}
              disabled={isPending}
              onChange={(event) => setConsentConfirmed(event.target.checked)}
              className="mt-1"
            />
            <span>{ANAMNESIS_COPY.publicConsent}</span>
          </label>
        ) : null}
        <label className="flex min-h-11 items-start gap-2.5 text-base">
          <input
            type="checkbox"
            checked={signatureConfirmed}
            disabled={isPending}
            onChange={(event) => setSignatureConfirmed(event.target.checked)}
            className="mt-1"
          />
          <span>{ANAMNESIS_DECLARATION_TEXT}</span>
        </label>
        <div className="space-y-2">
          <Label htmlFor="signatureName" className="text-base">
            Nome
          </Label>
          <Input
            id="signatureName"
            value={signatureName}
            disabled={isPending}
            onChange={(event) => setSignatureName(event.target.value)}
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
        {isPending
          ? "Enviando..."
          : isInvite
            ? ANAMNESIS_COPY.submit
            : "Salvar nova versão"}
      </Button>
    </form>
  );
}
