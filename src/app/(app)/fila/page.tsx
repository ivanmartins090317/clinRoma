import { getActiveDentists } from "@/features/agenda/queries";
import { WaitlistBoard } from "@/features/waitlist/components/waitlist-board";
import { getWaitlistBoardEntries } from "@/features/waitlist/queries";
import { getModuleAccess } from "@/lib/auth/roles";
import { requireAuthSession } from "@/lib/auth/session";
import { WAITLIST_COLORS } from "@/types/clinroma";

export const metadata = { title: "Fila Kanban" };

export default async function FilaPage() {
  const session = await requireAuthSession("/fila");
  const canWrite = getModuleAccess(session.profile.role, "waitlist") === "write";

  const [entries, dentists] = await Promise.all([
    getWaitlistBoardEntries(),
    getActiveDentists(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Fila Kanban</h2>
        <p className="mt-1 text-zinc-600">
          Priorize pacientes, ofereça horários liberados e acompanhe respostas
          pelo link (40 min).
        </p>
      </div>

      <WaitlistBoard entries={entries} dentists={dentists} canWrite={canWrite} />

      <div className="flex flex-wrap gap-3">
        {Object.entries(WAITLIST_COLORS).map(([key, color]) => (
          <span
            key={key}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            <span className={`h-3 w-3 rounded-full ${color.className}`} />
            Prioridade {color.label}
          </span>
        ))}
      </div>
    </div>
  );
}
