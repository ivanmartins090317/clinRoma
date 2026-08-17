export const metadata = { title: "Agenda" };

export default function AgendaPage() {
  return (
    <PlaceholderModule
      title="Agenda"
      description="Calendário multi-dentista (5 profissionais). Status: agendado, confirmado, em atendimento, faltou, cancelado."
    />
  );
}

function PlaceholderModule({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-zinc-200 bg-white p-8">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-3 text-zinc-600">{description}</p>
      <p className="mt-6 text-sm text-zinc-500">Módulo em implementação.</p>
    </div>
  );
}
