import { ClinicLogo } from "@/components/clinic-logo";
import { SlotResponseClient } from "@/app/fila/resposta/[token]/slot-response-client";
import { getPublicSlotOfferView } from "@/features/waitlist/lib/public-offer-view";

export const metadata = { title: "Resposta à oferta" };

interface SlotResponsePageProps {
  params: Promise<{ token: string }>;
}

export default async function SlotResponsePage({
  params,
}: SlotResponsePageProps) {
  const { token } = await params;
  const view = await getPublicSlotOfferView(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neo-burgundy-950 px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <div className="w-full max-w-md rounded-xl border border-neo-burgundy-800 bg-neo-burgundy-900 p-8 shadow-xl">
        <div className="flex justify-center">
          <ClinicLogo variant="on-dark" className="h-12 w-auto" />
        </div>
        <h1 className="mt-6 text-center text-xl font-semibold text-neo-cream-100">
          Horário disponível
        </h1>
        <p className="mt-3 text-center text-sm text-neo-cream-100/75">
          Link válido por 40 minutos. Resposta integrada à agenda (LGPD).
        </p>

        <SlotResponseClient token={token} view={view} />

        <p className="mt-6 text-center text-xs text-neo-gray-500">
          ClinRoma · Núcleo de Excelência Odontológica
        </p>
      </div>
    </div>
  );
}
