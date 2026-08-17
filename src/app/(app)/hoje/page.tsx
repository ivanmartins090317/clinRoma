import Link from "next/link";
import { ClinicLogo } from "@/components/clinic-logo";
import { CLINROMA_MODULES, WAITLIST_COLORS } from "@/types/clinroma";

export const metadata = {
  title: "Hoje",
};

export default function HojePage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Hoje</h2>
          <p className="mt-1 text-zinc-600">
            Visão do dia: consultas, alertas de estoque e fila Kanban.
          </p>
        </div>
        <ClinicLogo variant="on-light" className="h-9 w-auto opacity-90" />
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CLINROMA_MODULES.map((module) => (
          <Link
            key={module.id}
            href={module.href}
            className="rounded-xl border border-neo-gray-200 bg-neo-white p-5 shadow-sm transition hover:border-neo-gold-500/40 hover:shadow"
          >
            <h3 className="font-semibold text-zinc-900">{module.label}</h3>
            <p className="mt-2 text-sm text-zinc-600">{module.description}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-neo-gray-200 bg-neo-white p-5">
        <h3 className="font-semibold">Fila · prioridades</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(WAITLIST_COLORS).map(([key, color]) => (
            <span
              key={key}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-sm"
            >
              <span
                className={`h-3 w-3 rounded-full ${color.className}`}
                aria-hidden
              />
              {color.label}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-zinc-600">
          Slot liberado: botão ou arrastar no Kanban. Paciente recebe link (40
          min, LGPD).
        </p>
      </section>

      <section className="rounded-xl border border-dashed border-zinc-300 bg-zinc-100/50 p-5 text-sm text-zinc-600">
        <p className="font-medium text-zinc-800">Próximo passo técnico</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Supabase: schema + RLS</li>
          <li>Auth + papéis da clínica</li>
          <li>Módulo pacientes e anamnese</li>
        </ul>
      </section>
    </div>
  );
}
