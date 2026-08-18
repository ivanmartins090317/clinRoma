import { ClinicLogo } from "@/components/clinic-logo";

export const metadata = { title: "Resposta à oferta" };

interface SlotResponsePageProps {
  params: Promise<{ token: string }>;
}

export default async function SlotResponsePage({
  params,
}: SlotResponsePageProps) {
  const { token } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neo-burgundy-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-neo-burgundy-800 bg-neo-burgundy-900 p-8 shadow-xl">
        <div className="flex justify-center">
          <ClinicLogo variant="on-dark" className="h-12 w-auto" />
        </div>
        <h1 className="mt-6 text-center text-xl font-semibold text-neo-cream-100">
          Horário disponível
        </h1>
        <p className="mt-3 text-center text-sm text-neo-cream-100/75">
          Link válido por 40 minutos. Resposta integrada à agenda e prontuário
          (LGPD).
        </p>
        <p className="mt-4 rounded-lg bg-neo-burgundy-950 px-3 py-2 text-center font-mono text-xs text-neo-gray-500">
          token: {token.slice(0, 8)}…
        </p>
        <label className="mt-6 flex items-start gap-2 text-sm text-neo-cream-100/90">
          <input
            type="checkbox"
            className="mt-1 accent-neo-gold-500"
            disabled
          />
          <span>
            Autorizo o uso dos meus dados para confirmar este agendamento,
            conforme a política de privacidade da clínica.
          </span>
        </label>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled
            className="flex-1 rounded-lg bg-neo-gold-500 px-4 py-2.5 text-sm font-medium text-neo-burgundy-950 opacity-80"
          >
            Aceitar horário
          </button>
          <button
            type="button"
            disabled
            className="flex-1 rounded-lg border border-neo-cream-100/30 px-4 py-2.5 text-sm font-medium text-neo-cream-100 opacity-80"
          >
            Recusar
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-neo-gray-500">
          ClinRoma · Núcleo de Excelência Odontológica
        </p>
      </div>
    </div>
  );
}
