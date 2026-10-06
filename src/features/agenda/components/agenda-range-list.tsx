import { AgendaDayList } from "@/features/agenda/components/agenda-day-list";
import type { AgendaRangeDay } from "@/features/agenda/domain/agenda-range";
import type { AgendaAppointment } from "@/features/agenda/types";

interface AgendaRangeListProps {
  days: AgendaRangeDay[];
  onSelectAppointment: (appointment: AgendaAppointment) => void;
  canOpenWhatsApp?: boolean;
}

export function AgendaRangeList({
  days,
  onSelectAppointment,
  canOpenWhatsApp = false,
}: AgendaRangeListProps) {
  if (days.length === 0) {
    return (
      <AgendaDayList
        groups={[]}
        onSelectAppointment={onSelectAppointment}
        canOpenWhatsApp={canOpenWhatsApp}
        emptyMessage="Nenhuma consulta neste período"
      />
    );
  }

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <section key={day.date} className="space-y-3">
          <h3 className="text-[15px] font-bold text-foreground">{day.label}</h3>
          <AgendaDayList
            groups={day.groups}
            onSelectAppointment={onSelectAppointment}
            canOpenWhatsApp={canOpenWhatsApp}
          />
        </section>
      ))}
    </div>
  );
}
