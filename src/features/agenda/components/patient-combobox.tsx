"use client";

import { useRef, useState, useTransition } from "react";

import { searchPatientsAction } from "@/features/patients/actions";
import type { AgendaPatientOption } from "@/features/agenda/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PatientComboboxProps {
  value: string;
  selectedLabel: string;
  onSelect: (patient: AgendaPatientOption) => void;
  disabled?: boolean;
}

export function PatientCombobox({
  value,
  selectedLabel,
  onSelect,
  disabled = false,
}: PatientComboboxProps) {
  const [query, setQuery] = useState(selectedLabel);
  const [results, setResults] = useState<AgendaPatientOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<number | null>(null);

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (nextQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      startTransition(async () => {
        const patients = await searchPatientsAction(nextQuery);
        setResults(patients);
        setIsOpen(true);
      });
    }, 250);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="patient-search">Paciente</Label>
      <div className="relative">
        <Input
          id="patient-search"
          value={query}
          disabled={disabled}
          placeholder="Buscar por nome ou CPF"
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
        />

        {isOpen ? (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover shadow-md">
            {isPending ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Buscando...
              </p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Nenhum paciente encontrado
              </p>
            ) : (
              <ul>
                {results.map((patient) => (
                  <li key={patient.id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent",
                        value === patient.id && "bg-accent",
                      )}
                      onClick={() => {
                        onSelect(patient);
                        setQuery(patient.fullName);
                        setIsOpen(false);
                      }}
                    >
                      <span className="font-medium">{patient.fullName}</span>
                      {patient.cpf ? (
                        <span className="text-xs text-muted-foreground">
                          CPF {patient.cpf}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
