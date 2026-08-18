import type { AnamnesisVersion } from "@/features/records/queries";

interface AnamnesisHistoryProps {
  versions: AnamnesisVersion[];
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
          <li
            key={version.id}
            className="rounded-lg border border-border bg-background px-4 py-3 text-sm"
          >
            <p className="font-medium">
              {version.signedAt
                ? new Date(version.signedAt).toLocaleString("pt-BR")
                : "Data não informada"}
            </p>
            <p className="text-muted-foreground">{version.preview}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Assinatura: {version.signatureName ?? "Não informada"}
              {version.authorName ? ` · ${version.authorName}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
