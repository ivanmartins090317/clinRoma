import Link from "next/link";
import { ClinicLogo } from "@/components/clinic-logo";
import { CLINROMA_MODULES, WAITLIST_COLORS } from "@/types/clinroma";

export const metadata = {
  title: "Hoje",
};

export default function HojePage() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="flex flex-col gap-5 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Hoje
          </h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Visão do dia: consultas, alertas de estoque e fila Kanban.
          </p>
        </div>
        <ClinicLogo
          variant="on-light"
          className="h-9 w-auto shrink-0 self-start opacity-90 sm:self-auto"
        />
      </section>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-6">
        {CLINROMA_MODULES.map((module) => (
          <Link
            key={module.id}
            href={module.href}
            className="group rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-neo-gold-500/40 hover:shadow-md sm:p-6"
          >
            <h3 className="font-semibold text-foreground group-hover:text-neo-burgundy-900">
              {module.label}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {module.description}
            </p>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <h3 className="font-semibold text-foreground">Fila · prioridades</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(WAITLIST_COLORS).map(([key, color]) => (
            <span
              key={key}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
            >
              <span
                className={`h-3 w-3 rounded-full ${color.className}`}
                aria-hidden
              />
              {color.label}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Slot liberado: botão ou arrastar no Kanban. Paciente recebe link (40
          min, LGPD).
        </p>
      </section>

      <section className="rounded-xl border border-dashed border-border bg-muted/40 p-5 text-sm sm:p-6">
        <p className="font-medium text-foreground">Próximo passo técnico</p>
        <ul className="mt-3 list-inside list-disc space-y-1.5 text-muted-foreground">
          <li>Supabase: schema + RLS</li>
          <li>Auth + papéis da clínica</li>
          <li>Módulo pacientes e anamnese</li>
        </ul>
      </section>
    </div>
  );
}
