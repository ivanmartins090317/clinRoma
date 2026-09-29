import { WhatsAppStatusCard } from "@/features/whatsapp/components/whatsapp-status-card";
import { canOpenWhatsAppPairing } from "@/features/whatsapp/permissions";
import { getClinicWhatsAppSessionStatus } from "@/features/whatsapp/queries";
import type { UserRole } from "@/types/clinroma";

import { BlocoEntrada, LugarFalha } from "./lugar-reservado";

interface WhatsappDoDiaProps {
  role: UserRole;
  ordem: number;
}

export async function WhatsappDoDia({ role, ordem }: WhatsappDoDiaProps) {
  const status = await getClinicWhatsAppSessionStatus().then(
    (value) => value,
    () => undefined,
  );

  if (status === undefined) {
    return (
      <BlocoEntrada ordem={ordem}>
        <LugarFalha variante="cartao" />
      </BlocoEntrada>
    );
  }

  return (
    <BlocoEntrada ordem={ordem}>
      <WhatsAppStatusCard
        status={status}
        showPairingLink={canOpenWhatsAppPairing(role)}
      />
    </BlocoEntrada>
  );
}
