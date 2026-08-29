import { startClinicWhatsAppSession } from "@/features/whatsapp/actions";
import { WhatsAppSessionPanel } from "@/features/whatsapp/components/whatsapp-session-panel";
import { isStoppedStatus } from "@/features/whatsapp/domain/session-status";
import {
  canWriteWhatsAppSession,
  WHATSAPP_COPY,
} from "@/features/whatsapp/permissions";
import { getClinicWhatsAppSessionStatus } from "@/features/whatsapp/queries";
import { requireAuthSession } from "@/lib/auth/session";

export const metadata = {
  title: WHATSAPP_COPY.pageTitle,
};

export default async function WhatsAppPage() {
  const session = await requireAuthSession("/whatsapp");
  let status = await getClinicWhatsAppSessionStatus();
  let startError: string | null = null;

  if (
    canWriteWhatsAppSession(session.profile.role) &&
    isStoppedStatus(status)
  ) {
    const result = await startClinicWhatsAppSession();
    startError = result.error ?? null;
    status = await getClinicWhatsAppSessionStatus();
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">
          {WHATSAPP_COPY.pageTitle}
        </h2>
      </section>
      <WhatsAppSessionPanel status={status} startError={startError} />
    </div>
  );
}
