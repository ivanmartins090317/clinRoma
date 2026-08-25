import type { EvolutionRecord } from "@/features/records/queries";
import { TranscriptionStatusView } from "@/features/records/components/transcription-status";

interface EvolutionListProps {
  evolutions: EvolutionRecord[];
  canRetryTranscription: boolean;
  canCorrectTranscription: boolean;
}

export function EvolutionList({
  evolutions,
  canRetryTranscription,
  canCorrectTranscription,
}: EvolutionListProps) {
  if (evolutions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma evolução registrada ainda.
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="font-semibold">Histórico de evoluções</h3>
      <ul className="space-y-3">
        {evolutions.map((evolution) => (
          <li
            key={evolution.id}
            className="rounded-xl border border-border bg-background p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {new Date(evolution.createdAt).toLocaleString("pt-BR")}
              </p>
              {evolution.dentistName ? (
                <p className="text-sm">{evolution.dentistName}</p>
              ) : null}
            </div>
            <p className="whitespace-pre-wrap text-sm">{evolution.text}</p>

            {evolution.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="space-y-2 rounded-lg border border-border p-3"
              >
                {attachment.attachmentType === "photo" &&
                attachment.signedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attachment.signedUrl}
                    alt="Foto clínica"
                    className="max-h-64 w-full rounded-md object-cover"
                  />
                ) : null}

                {attachment.attachmentType === "audio" &&
                attachment.signedUrl ? (
                  <audio controls className="w-full" src={attachment.signedUrl}>
                    Seu navegador não suporta áudio.
                  </audio>
                ) : null}

                {attachment.attachmentType === "audio" ? (
                  <TranscriptionStatusView
                    key={`${attachment.id}-${attachment.transcriptionStatus}-${attachment.transcription ?? ""}`}
                    attachmentId={attachment.id}
                    initialStatus={attachment.transcriptionStatus}
                    initialText={attachment.transcription}
                    canRetry={canRetryTranscription}
                    canCorrect={canCorrectTranscription}
                  />
                ) : null}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
