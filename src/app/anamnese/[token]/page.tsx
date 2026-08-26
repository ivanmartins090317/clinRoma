import { headers } from "next/headers";

import { AnamnesisForm } from "@/features/records/components/anamnesis-form";
import { AnamnesisPublicHeader } from "@/features/records/components/anamnesis-public-header";
import { ANAMNESIS_COPY } from "@/features/records/domain/anamnesis-form-v2";
import { hashInviteOrigin } from "@/features/records/lib/anamnesis-token";
import { getPublicAnamnesisInviteView } from "@/features/records/queries";

export const metadata = { title: ANAMNESIS_COPY.publicTitle };

interface AnamneseInvitePageProps {
  params: Promise<{ token: string }>;
}

async function readOriginKey(): Promise<string> {
  const headerStore = await headers();
  const forwarded =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip")?.trim() ??
    "unknown";

  return hashInviteOrigin(forwarded) ?? "anon";
}

export default async function AnamneseInvitePage({
  params,
}: AnamneseInvitePageProps) {
  const { token } = await params;
  const view = await getPublicAnamnesisInviteView(token, await readOriginKey());

  if (view.state !== "valid" || !view.patientFullName) {
    return (
      <p className="text-center text-base text-foreground">
        {ANAMNESIS_COPY.genericInvite}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <AnamnesisPublicHeader patientFullName={view.patientFullName} />
      <AnamnesisForm
        surface="invite"
        token={token}
        vigenteDateLabel={view.vigenteDateLabel}
      />
    </div>
  );
}
