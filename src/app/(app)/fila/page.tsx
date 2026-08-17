import { WAITLIST_COLORS } from "@/types/clinroma";

export const metadata = { title: "Fila Kanban" };

const DEMO_COLUMNS = [
  { id: "waiting", title: "Aguardando" },
  { id: "offered", title: "Slot oferecido" },
  { id: "scheduled", title: "Agendado" },
] as const;

export default function FilaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Fila Kanban</h2>
        <p className="mt-1 text-zinc-600">
          Arrastar cards ou usar botão quando slot liberar. Resposta do paciente
          via link (40 min).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {DEMO_COLUMNS.map((column) => (
          <div
            key={column.id}
            className="rounded-xl border border-zinc-200 bg-zinc-100/80 p-4"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {column.title}
            </h3>
            <div className="mt-3 min-h-32 rounded-lg border border-dashed border-zinc-300 bg-white/60 p-3 text-sm text-zinc-500">
              {column.id === "waiting"
                ? "Cards por cor: Vermelho → Amarelo → Verde"
                : "Coluna vazia (demo)"}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(WAITLIST_COLORS).map(([key, color]) => (
          <span
            key={key}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            <span className={`h-3 w-3 rounded-full ${color.className}`} />
            Prioridade {color.label}
          </span>
        ))}
      </div>
    </div>
  );
}
