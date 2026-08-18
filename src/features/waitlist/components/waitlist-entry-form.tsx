"use client";

import { useState, useTransition } from "react";

import { createWaitlistEntryAction } from "@/features/waitlist/actions";
import type {
  AgendaDentist,
  AgendaPatientOption,
} from "@/features/agenda/types";
import { PatientCombobox } from "@/features/agenda/components/patient-combobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WAITLIST_COLORS, type WaitlistPriorityColor } from "@/types/clinroma";

interface WaitlistEntryFormProps {
  dentists: AgendaDentist[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WaitlistEntryForm({
  dentists,
  open,
  onOpenChange,
  onSuccess,
}: WaitlistEntryFormProps) {
  const [patientId, setPatientId] = useState("");
  const [patientLabel, setPatientLabel] = useState("");
  const [priority, setPriority] = useState<WaitlistPriorityColor>("yellow");
  const [reason, setReason] = useState("");
  const [preferredDentistId, setPreferredDentistId] = useState<string>("none");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePatientSelect(patient: AgendaPatientOption) {
    setPatientId(patient.id);
    setPatientLabel(patient.fullName);
  }

  function handleSubmit() {
    setError(null);

    startTransition(async () => {
      const result = await createWaitlistEntryAction({
        patientId,
        priority,
        reason,
        preferredDentistId:
          preferredDentistId === "none" ? null : preferredDentistId,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setPatientId("");
      setPatientLabel("");
      setReason("");
      setPriority("yellow");
      setPreferredDentistId("none");
      onOpenChange(false);
      onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        <DialogHeader>
          <DialogTitle>Nova entrada na fila</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <PatientCombobox
            value={patientId}
            selectedLabel={patientLabel}
            onSelect={handlePatientSelect}
          />

          <div className="space-y-2">
            <Label htmlFor="waitlist-priority">Prioridade</Label>
            <Select
              value={priority}
              onValueChange={(value) =>
                setPriority(value as WaitlistPriorityColor)
              }
            >
              <SelectTrigger
                id="waitlist-priority"
                className="min-h-11 text-base"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WAITLIST_COLORS).map(([key, color]) => (
                  <SelectItem key={key} value={key}>
                    {color.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="waitlist-reason">Motivo (opcional)</Label>
            <Input
              id="waitlist-reason"
              className="min-h-11 text-base"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ex.: dor, retorno urgente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="waitlist-dentist">
              Dentista preferido (opcional)
            </Label>
            <Select
              value={preferredDentistId}
              onValueChange={setPreferredDentistId}
            >
              <SelectTrigger
                id="waitlist-dentist"
                className="min-h-11 text-base"
              >
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {dentists.map((dentist) => (
                  <SelectItem key={dentist.id} value={dentist.id}>
                    {dentist.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !patientId}
            className="min-h-11"
          >
            {isPending ? "Salvando..." : "Incluir na fila"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
