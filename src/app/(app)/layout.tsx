import { headers } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { getActiveDentists } from "@/features/agenda/queries";
import {
  canReadWhatsAppSessionStatus,
  canSeeWhatsAppMenuChip,
} from "@/features/whatsapp/permissions";
import { getClinicWhatsAppSessionStatus } from "@/features/whatsapp/queries";
import { assertRouteAccess } from "@/lib/auth/guard";
import { getAllowedModuleIds } from "@/lib/auth/roles";
import { requireAuthSession } from "@/lib/auth/session";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "/hoje";
  const session = await requireAuthSession(pathname);
  assertRouteAccess(session, pathname);

  const canReadWhatsApp = canReadWhatsAppSessionStatus(session.profile.role);
  const [allowedModuleIds, dentists, whatsappSessionStatus] = await Promise.all(
    [
      Promise.resolve(getAllowedModuleIds(session.profile.role)),
      getActiveDentists(),
      canReadWhatsApp
        ? getClinicWhatsAppSessionStatus()
        : Promise.resolve(null),
    ],
  );

  return (
    <AppShell
      allowedModuleIds={allowedModuleIds}
      displayName={session.profile.displayName}
      role={session.profile.role}
      activeDentistCount={dentists.length}
      whatsappSessionStatus={whatsappSessionStatus}
      showWhatsAppChip={canSeeWhatsAppMenuChip(session.profile.role)}
    >
      {children}
      <Toaster />
    </AppShell>
  );
}
