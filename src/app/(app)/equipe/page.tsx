import { redirect } from "next/navigation";

import { CollaboratorDialog } from "@/features/team/components/collaborator-dialog";
import { CollaboratorList } from "@/features/team/components/collaborator-list";
import { canManageTeam } from "@/features/team/domain/team-guards";
import { listCollaborators } from "@/features/team/queries";
import { requireAuthSession } from "@/lib/auth/session";

export const metadata = { title: "Equipe" };

export default async function EquipePage() {
  const session = await requireAuthSession("/equipe");

  if (!canManageTeam(session.profile.role)) {
    redirect("/acesso-negado");
  }

  const collaborators = await listCollaborators();

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Equipe</h2>
          <p className="mt-2 text-muted-foreground">
            Colaboradores com acesso ao ClinRoma, papel na clínica e situação do
            login.
          </p>
        </div>
        <CollaboratorDialog />
      </section>

      <CollaboratorList
        collaborators={collaborators}
        currentUserId={session.profile.id}
      />
    </div>
  );
}
