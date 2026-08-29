import Link from "next/link";

import { isSessionWorking } from "@/features/whatsapp/domain/session-status";
import { WHATSAPP_COPY } from "@/features/whatsapp/permissions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WhatsAppStatusCardProps {
  status: string | null;
  showPairingLink: boolean;
}

export function WhatsAppStatusCard({
  status,
  showPairingLink,
}: WhatsAppStatusCardProps) {
  const working = isSessionWorking(status);

  return (
    <section className="rounded-(--radius) border border-[#f0e3db] bg-neo-white p-5 shadow-neo md:p-5.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-[17px] font-bold text-foreground">
            {WHATSAPP_COPY.cardTitle}
          </h3>
          <p className="mt-2 flex items-center gap-2 text-[13.5px] text-muted-foreground">
            <span
              aria-hidden
              className={cn(
                "size-2.5 shrink-0 rounded-full",
                working ? "bg-priority-green" : "animate-pulse bg-priority-red",
              )}
            />
            {working ? WHATSAPP_COPY.connected : WHATSAPP_COPY.disconnected}
          </p>
          {showPairingLink ? null : (
            <p className="mt-2 text-[13.5px] text-muted-foreground">
              {WHATSAPP_COPY.dentistHint}
            </p>
          )}
        </div>
        {showPairingLink ? (
          <Button asChild variant="secondary" size="sm" className="min-h-11">
            <Link href="/whatsapp">{WHATSAPP_COPY.openPairing}</Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
