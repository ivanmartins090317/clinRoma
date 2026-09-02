"use client";

import { useEffect, useState, useTransition } from "react";

import { getWaitingEntriesForOfferAction } from "@/features/waitlist/actions";
import type { WaitlistBoardEntry } from "@/features/waitlist/queries";
import {
  SlotOfferForm,
  appointmentToOfferPrefill,
} from "@/features/waitlist/components/slot-offer-form";
import type { AgendaAppointment, AgendaDentist } from "@/features/agenda/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface WaitlistOfferAfterCancelProps {
  appointment: AgendaAppointment;
  dentists: AgendaDentist[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

export function WaitlistOfferAfterCancel({
  appointment,
  dentists,
  open,
  onOpenChange,
  onDone,
}: WaitlistOfferAfterCancelProps) {
  const [entries, setEntries] = useState<
    Array<{
      id: string;
      patientName: string;
      priority: string;
      preferredDentistId: string | null;
    }>
  >([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string>("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }

    startTransition(async () => {
      const waiting = await getWaitingEntriesForOfferAction();
      setEntries(waiting);
      setSelectedEntryId(waiting[0]?.id ?? "");
    });
  }, [open]);

  const selectedEntry: WaitlistBoardEntry | null = selectedEntryId
    ? {
        id: selectedEntryId,
        patientId: "",
        patientName:
          entries.find((entry) => entry.id === selectedEntryId)?.patientName ??
          "Paciente",
        priority:
          (entries.find((entry) => entry.id === selectedEntryId)?.priority as
            "red" | "yellow" | "green") ?? "yellow",
        reason: null,
        preferredDentistId:
          entries.find((entry) => entry.id === selectedEntryId)
            ?.preferredDentistId ?? null,
        preferredDentistName: null,
        status: "waiting",
        createdAt: "",
        pendingOffer: null,
        acceptedOffer: null,
      }
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Oferecer vaga na fila</DialogTitle>
          </DialogHeader>

          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum paciente aguardando na fila.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="waitlist-entry-select">Entrada na fila</Label>
                <Select
                  value={selectedEntryId}
                  onValueChange={setSelectedEntryId}
                >
                  <SelectTrigger
                    id="waitlist-entry-select"
                    className="min-h-11"
                  >
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {entries.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.patientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="min-h-11 w-full"
                disabled={!selectedEntryId}
                onClick={() => setOfferOpen(true)}
              >
                Continuar com horário liberado
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SlotOfferForm
        entry={selectedEntry}
        dentists={dentists}
        open={offerOpen}
        onOpenChange={(nextOpen) => {
          setOfferOpen(nextOpen);

          if (!nextOpen) {
            onOpenChange(false);
            onDone();
          }
        }}
        prefill={appointmentToOfferPrefill(appointment)}
        onSuccess={onDone}
      />
    </>
  );
}
