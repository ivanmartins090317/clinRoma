"use client";

import { useState, useTransition } from "react";

import { createSlotOfferAction } from "@/features/waitlist/actions";
import type { WaitlistBoardEntry } from "@/features/waitlist/queries";
import type { AgendaDentist } from "@/features/agenda/types";
import {
  formatClinicDate,
  formatClinicTime,
  parseClinicDateParam,
} from "@/features/agenda/types";
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
import { SlotOfferLink } from "@/features/waitlist/components/slot-offer-link";

interface SlotOfferPrefill {
  dentistId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

interface SlotOfferFormProps {
  entry: WaitlistBoardEntry | null;
  dentists: AgendaDentist[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: SlotOfferPrefill;
  onSuccess?: () => void;
}

export function SlotOfferForm({
  entry,
  dentists,
  open,
  onOpenChange,
  prefill,
  onSuccess,
}: SlotOfferFormProps) {
  const today = formatClinicDate(parseClinicDateParam(undefined));
  const [dentistId, setDentistId] = useState(
    prefill?.dentistId ?? entry?.preferredDentistId ?? dentists[0]?.id ?? "",
  );
  const [date, setDate] = useState(prefill?.date ?? today);
  const [startTime, setStartTime] = useState(prefill?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(prefill?.endTime ?? "09:30");
  const [error, setError] = useState<string | null>(null);
  const [offerUrl, setOfferUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetState() {
    setError(null);
    setOfferUrl(null);
    setExpiresAt(null);
  }

  function handleSubmit() {
    if (!entry) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await createSlotOfferAction({
        entryId: entry.id,
        dentistId,
        date,
        startTime,
        endTime,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.offerUrl) {
        setOfferUrl(result.offerUrl);
        setExpiresAt(new Date(Date.now() + 40 * 60 * 1000).toISOString());
        onSuccess?.();
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetState();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        <DialogHeader>
          <DialogTitle>
            Oferecer horário{entry ? ` · ${entry.patientName}` : ""}
          </DialogTitle>
        </DialogHeader>

        {offerUrl && expiresAt ? (
          <SlotOfferLink offerUrl={offerUrl} expiresAt={expiresAt} />
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="offer-dentist">Dentista</Label>
              <Select value={dentistId} onValueChange={setDentistId}>
                <SelectTrigger
                  id="offer-dentist"
                  className="min-h-11 text-base"
                >
                  <SelectValue placeholder="Selecione o dentista" />
                </SelectTrigger>
                <SelectContent>
                  {dentists.map((dentist) => (
                    <SelectItem key={dentist.id} value={dentist.id}>
                      {dentist.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer-date">Data</Label>
              <Input
                id="offer-date"
                type="date"
                className="min-h-11 text-base"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="offer-start">Início</Label>
                <Input
                  id="offer-start"
                  type="time"
                  className="min-h-11 text-base"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer-end">Fim</Label>
                <Input
                  id="offer-end"
                  type="time"
                  className="min-h-11 text-base"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                />
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {offerUrl ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending || !entry}
                className="min-h-11"
              >
                {isPending ? "Gerando..." : "Gerar link"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function appointmentToOfferPrefill(appointment: {
  dentistId: string;
  startsAt: string;
  endsAt: string;
}): SlotOfferPrefill {
  return {
    dentistId: appointment.dentistId,
    date: formatClinicDate(new Date(appointment.startsAt)),
    startTime: formatClinicTime(appointment.startsAt),
    endTime: formatClinicTime(appointment.endsAt),
  };
}
