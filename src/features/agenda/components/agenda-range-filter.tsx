"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { buildAgendaHref } from "@/features/agenda/domain/agenda-range";

interface AgendaRangeFilterProps {
  from: string;
  to: string;
  dentistFilter: string;
  wasClamped: boolean;
}

function AgendaDateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="date"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="agenda-date-field box-border h-11 w-full min-w-0 cursor-pointer rounded-md border border-input bg-background px-3 text-base text-foreground shadow-xs"
      />
    </div>
  );
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
        <AgendaDateField
          id="agenda-range-from"
          label="De"
          value={fromValue}
          onChange={setFromValue}
        />
        <AgendaDateField
          id="agenda-range-to"
          label="Até"
          value={toValue}
          onChange={setToValue}
        />
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
