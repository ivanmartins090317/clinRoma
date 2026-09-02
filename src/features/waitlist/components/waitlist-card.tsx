"use client";

import { MoreHorizontalIcon } from "lucide-react";

import {
  cancelSlotOfferAction,
  removeWaitlistEntryAction,
  updateWaitlistEntryAction,
} from "@/features/waitlist/actions";
import { getWaitlistPriorityLabel } from "@/features/waitlist/domain/waitlist-priority";
import type { WaitlistBoardEntry } from "@/features/waitlist/queries";
import { SlotOfferCountdown } from "@/features/waitlist/components/slot-offer-link";
import { formatClinicDateTime } from "@/features/agenda/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import { WAITLIST_COLORS, type WaitlistPriorityColor } from "@/types/clinroma";

interface WaitlistCardActionsProps {
  entry: WaitlistBoardEntry;
  canWrite: boolean;
  onOffer: (entry: WaitlistBoardEntry) => void;
  onChanged: () => void;
}

export function WaitlistCardActions({
  entry,
  canWrite,
  onOffer,
  onChanged,
}: WaitlistCardActionsProps) {
  if (!canWrite) {
    return null;
  }

  async function handlePriorityChange(priority: WaitlistPriorityColor) {
    const result = await updateWaitlistEntryAction({
      id: entry.id,
      priority,
    });

    if (result.error) {
      toast(result.error);
      return;
    }

    toast("Prioridade atualizada");
    onChanged();
  }

  async function handleCancelOffer() {
    if (!entry.pendingOffer) {
      return;
    }

    const result = await cancelSlotOfferAction({
      entryId: entry.id,
      offerId: entry.pendingOffer.id,
    });

    if (result.error) {
      toast(result.error);
      return;
    }

    toast("Oferta cancelada");
    onChanged();
  }

  async function handleRemove() {
    const result = await removeWaitlistEntryAction({ id: entry.id });

    if (result.error) {
      toast(result.error);
      return;
    }

    toast("Entrada removida da fila");
    onChanged();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          aria-label="Ações da entrada"
        >
          <MoreHorizontalIcon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {entry.status === "waiting" ? (
          <DropdownMenuItem onClick={() => onOffer(entry)}>
            Oferecer horário
          </DropdownMenuItem>
        ) : null}

        {entry.status === "offered" ? (
          <DropdownMenuItem onClick={handleCancelOffer}>
            Cancelar oferta
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Alterar prioridade</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {Object.keys(WAITLIST_COLORS).map((key) => (
              <DropdownMenuItem
                key={key}
                onClick={() =>
                  handlePriorityChange(key as WaitlistPriorityColor)
                }
              >
                {getWaitlistPriorityLabel(key as WaitlistPriorityColor)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={handleRemove}
        >
          Remover da fila
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface WaitlistCardProps {
  entry: WaitlistBoardEntry;
  canWrite: boolean;
  onOffer: (entry: WaitlistBoardEntry) => void;
  onChanged: () => void;
  dragHandle?: React.ReactNode;
}

export function WaitlistCard({
  entry,
  canWrite,
  onOffer,
  onChanged,
  dragHandle,
}: WaitlistCardProps) {
  const priorityColor = WAITLIST_COLORS[entry.priority];

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-2">
        {dragHandle}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-foreground">
                {entry.patientName}
              </h4>
              <Badge className={`mt-1 ${priorityColor.className} text-white`}>
                {priorityColor.label}
              </Badge>
            </div>
            <WaitlistCardActions
              entry={entry}
              canWrite={canWrite}
              onOffer={onOffer}
              onChanged={onChanged}
            />
          </div>

          {entry.reason ? (
            <p className="text-sm text-muted-foreground">{entry.reason}</p>
          ) : null}

          {entry.preferredDentistName ? (
            <p className="text-xs text-muted-foreground">
              Preferência: {entry.preferredDentistName}
            </p>
          ) : null}

          {entry.status === "scheduled" && entry.acceptedOffer ? (
            <p className="text-xs text-muted-foreground">
              Encaixe: {entry.acceptedOffer.dentistName} ·{" "}
              {formatClinicDateTime(entry.acceptedOffer.offeredAt)}
            </p>
          ) : null}

          {entry.pendingOffer ? (
            <SlotOfferCountdown
              expiresAt={entry.pendingOffer.expiresAt}
              offeredAt={entry.pendingOffer.offeredAt}
              endsAt={entry.pendingOffer.endsAt}
              dentistName={entry.pendingOffer.dentistName}
            />
          ) : null}

          {canWrite && entry.status === "waiting" ? (
            <Button
              variant="outline"
              className="min-h-11 w-full"
              onClick={() => onOffer(entry)}
            >
              Oferecer horário
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
