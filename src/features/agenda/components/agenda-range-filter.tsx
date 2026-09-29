"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildAgendaHref } from "@/features/agenda/domain/agenda-range";

interface AgendaRangeFilterProps {
  from: string;
  to: string;
  dentistFilter: string;
  wasClamped: boolean;
}

export function AgendaRangeFilter({
  from,
  to,
  dentistFilter,
  wasClamped,
}: AgendaRangeFilterProps) {
  const router = useRouter();
  const [fromValue, setFromValue] = useState(from);
  const [toValue, setToValue] = useState(to);

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    router.push(
      buildAgendaHref({
        date: fromValue,
        from: fromValue,
        to: toValue,
        dentistId: dentistFilter,
      }),
    );
  }

  function goToday() {
    router.push(
      buildAgendaHref({
        dentistId: dentistFilter,
      }),
    );
  }

  return (
    <form onSubmit={search} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="agenda-range-from">De</Label>
          <Input
            id="agenda-range-from"
            type="date"
            required
            value={fromValue}
            onChange={(event) => setFromValue(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="agenda-range-to">Até</Label>
          <Input
            id="agenda-range-to"
            type="date"
            required
            value={toValue}
            onChange={(event) => setToValue(event.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button type="submit" className="min-h-11">
          Buscar
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          onClick={goToday}
        >
          Hoje
        </Button>
      </div>
      <p className="text-[13.5px] text-muted-foreground" role="status">
        {wasClamped
          ? "Ajustamos o fim do período para caber em 31 dias."
          : "Escolha o período. O limite é 31 dias."}
      </p>
    </form>
  );
}
