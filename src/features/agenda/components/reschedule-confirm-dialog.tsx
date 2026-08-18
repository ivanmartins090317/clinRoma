"use client";

import { useState, useTransition } from "react";

import { rescheduleAppointmentAction } from "@/features/agenda/actions";
import { formatClinicTime, splitClinicDateTime } from "@/features/agenda/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ReschedulePayload {
  id: string;
  patientName: string;
  dentistId: string;
  startsAt: Date;
  endsAt: Date;
}

interface RescheduleConfirmDialogProps {
  payload: ReschedulePayload | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RescheduleConfirmDialog({
  payload,
  open,
  onOpenChange,
  onSuccess,
  onCancel,
}: RescheduleConfirmDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!payload) {
    return null;
  }

  const date = splitClinicDateTime(payload.startsAt.toISOString()).date;
  const startTime = formatClinicTime(payload.startsAt.toISOString());
  const endTime = formatClinicTime(payload.endsAt.toISOString());

  function handleConfirm() {
    setError(null);

    startTransition(async () => {
      const result = await rescheduleAppointmentAction({
        id: payload!.id,
        dentistId: payload!.dentistId,
        date,
        startTime,
        endTime,
      });

      if (result.error) {
        setError(result.error);
        onCancel();
        return;
      }

      onSuccess();
      onOpenChange(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remarcar consulta</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Remarcar consulta de {payload.patientName} para {startTime}?
        </p>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onCancel();
              onOpenChange(false);
            }}
            disabled={isPending}
          >
            Voltar
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
