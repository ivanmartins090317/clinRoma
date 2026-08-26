import { formatInTimeZone } from "date-fns-tz";

import { ANAMNESIS_FORM_SECTIONS } from "@/features/records/domain/anamnesis-form-v1";
import {
  ANAMNESIS_COPY,
  listYesNoQuestions,
} from "@/features/records/domain/anamnesis-form-v2";
import type { AnamnesisVersion } from "@/features/records/queries";

interface AnamnesisHistoryProps {
  versions: AnamnesisVersion[];
}

function formatSignedAt(value: string | null): string {
  if (!value) return "Data não informada";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";

  return formatInTimeZone(date, "America/Sao_Paulo", "dd/MM/yyyy, HH:mm");
}

function HistoryV1({ version }: { version: AnamnesisVersion }) {
  const content = version.v1;

  return (
    <details className="rounded-lg border border-border bg-background px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium">
        {formatSignedAt(version.signedAt)} · texto livre
      </summary>
      <p className="mt-2 text-muted-foreground">{version.preview}</p>
      {content ? (
        <dl className="mt-3 space-y-2">
          {ANAMNESIS_FORM_SECTIONS.flatMap((section) =>
            section.fields.map((field) => {
              const value = content[field.id as keyof typeof content];
              if (typeof value !== "string" || !value.trim()) return null;

              return (
                <div key={field.id}>
                  <dt className="font-medium">{field.label}</dt>
                  <dd className="text-muted-foreground">{value}</dd>
                </div>
              );
            }),
          )}
        </dl>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        Assinatura: {version.signatureName ?? "Não informada"}
        {version.authorName ? ` · ${version.authorName}` : ""}
      </p>
    </details>
  );
}

function HistoryV2({ version }: { version: AnamnesisVersion }) {
  const content = version.v2;

  return (
    <details className="rounded-lg border border-border bg-background px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium">
        {formatSignedAt(version.signedAt)} · questionário papel ·{" "}
        {version.preview}
      </summary>
      {content ? (
        <div className="mt-3 space-y-2">
          {listYesNoQuestions().map((question) => {
            const answer = content.answers[question.id];
            if (!answer) return null;

            return (
              <p key={question.id}>
                <span className="font-medium">{question.text}</span>{" "}
                {answer.answer === "yes" ? "Sim" : "Não"}
                {answer.complement ? ` · ${answer.complement}` : ""}
              </p>
            );
          })}
          <p>
            <span className="font-medium">
              {ANAMNESIS_COPY.diseasesHeading}
            </span>{" "}
            {version.preview}
          </p>
          {content.otherDisease ? (
            <p>
              <span className="font-medium">
                {ANAMNESIS_COPY.otherDiseaseLabel}
              </span>{" "}
              {content.otherDisease}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {content.declarationText} Assinatura: {content.signatureName}
          </p>
        </div>
      ) : null}
    </details>
  );
}

export function AnamnesisHistory({ versions }: AnamnesisHistoryProps) {
  if (versions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma anamnese registrada ainda.
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="font-semibold">Histórico de versões</h3>
      <ul className="space-y-2">
        {versions.map((version) => (
          <li key={version.id}>
            {version.formVersion === 2 ? (
              <HistoryV2 version={version} />
            ) : (
              <HistoryV1 version={version} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
