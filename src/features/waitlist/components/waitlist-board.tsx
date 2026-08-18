"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { cancelSlotOfferAction } from "@/features/waitlist/actions";
import { canDragEntryToColumn } from "@/features/waitlist/domain/waitlist-transitions";
import type { WaitlistBoardEntry } from "@/features/waitlist/queries";
import { WaitlistCard } from "@/features/waitlist/components/waitlist-card";
import { WaitlistColumn } from "@/features/waitlist/components/waitlist-column";
import { WaitlistEntryForm } from "@/features/waitlist/components/waitlist-entry-form";
import { SlotOfferForm } from "@/features/waitlist/components/slot-offer-form";
import { WaitlistTabsMobile } from "@/features/waitlist/components/waitlist-tabs-mobile";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import type { AgendaDentist } from "@/features/agenda/types";

interface WaitlistBoardProps {
  entries: WaitlistBoardEntry[];
  dentists: AgendaDentist[];
  canWrite: boolean;
}

function SortableWaitlistCard({
  entry,
  canWrite,
  onOffer,
  onChanged,
}: {
  entry: WaitlistBoardEntry;
  canWrite: boolean;
  onOffer: (entry: WaitlistBoardEntry) => void;
  onChanged: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id, disabled: !canWrite });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dragHandle = canWrite ? (
    <button
      type="button"
      className="mt-1 inline-flex size-11 shrink-0 cursor-grab items-center justify-center rounded-md border border-border text-muted-foreground active:cursor-grabbing"
      aria-label="Arrastar card"
      {...attributes}
      {...listeners}
    >
      ⋮⋮
    </button>
  ) : null;

  return (
    <div ref={setNodeRef} style={style}>
      <WaitlistCard
        entry={entry}
        canWrite={canWrite}
        onOffer={onOffer}
        onChanged={onChanged}
        dragHandle={dragHandle}
      />
    </div>
  );
}

export function WaitlistBoard({
  entries,
  dentists,
  canWrite,
}: WaitlistBoardProps) {
  const router = useRouter();
  const [activeEntry, setActiveEntry] = useState<WaitlistBoardEntry | null>(
    null,
  );
  const [offerEntry, setOfferEntry] = useState<WaitlistBoardEntry | null>(null);
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [offerFormOpen, setOfferFormOpen] = useState(false);
  const [, startTransition] = useTransition();

  const grouped = useMemo(() => {
    return {
      waiting: entries.filter((entry) => entry.status === "waiting"),
      offered: entries.filter((entry) => entry.status === "offered"),
      scheduled: entries.filter((entry) => entry.status === "scheduled"),
    };
  }, [entries]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  function handleOffer(entry: WaitlistBoardEntry) {
    setOfferEntry(entry);
    setOfferFormOpen(true);
  }

  function handleDragStart(event: DragStartEvent) {
    const entry = entries.find((item) => item.id === event.active.id);

    if (entry) {
      setActiveEntry(entry);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveEntry(null);

    const entry = entries.find((item) => item.id === event.active.id);
    const targetColumn = event.over?.id;

    if (!entry || !targetColumn || typeof targetColumn !== "string") {
      return;
    }

    if (
      !canDragEntryToColumn(
        entry.status,
        targetColumn as "waiting" | "offered" | "scheduled",
      )
    ) {
      toast("Mova a situação pelo fluxo permitido");
      return;
    }

    if (entry.status === "offered" && targetColumn === "waiting") {
      if (!entry.pendingOffer) {
        return;
      }

      startTransition(async () => {
        const result = await cancelSlotOfferAction({
          entryId: entry.id,
          offerId: entry.pendingOffer!.id,
        });

        if (result.error) {
          toast(result.error);
          return;
        }

        toast("Oferta cancelada");
        refresh();
      });
    }
  }

  return (
    <div className="space-y-6">
      {canWrite ? (
        <div className="flex justify-end">
          <Button className="min-h-11" onClick={() => setEntryFormOpen(true)}>
            Nova entrada
          </Button>
        </div>
      ) : null}

      <WaitlistTabsMobile
        waiting={grouped.waiting}
        offered={grouped.offered}
        scheduled={grouped.scheduled}
        canWrite={canWrite}
        onOffer={handleOffer}
        onChanged={refresh}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="hidden gap-4 lg:grid lg:grid-cols-3">
          <WaitlistColumn
            id="waiting"
            title="Aguardando"
            entries={grouped.waiting}
            canWrite={canWrite}
            onOffer={handleOffer}
            onChanged={refresh}
            renderCard={(entry) => (
              <SortableWaitlistCard
                key={entry.id}
                entry={entry}
                canWrite={canWrite}
                onOffer={handleOffer}
                onChanged={refresh}
              />
            )}
          />
          <WaitlistColumn
            id="offered"
            title="Oferta enviada"
            entries={grouped.offered}
            canWrite={canWrite}
            onOffer={handleOffer}
            onChanged={refresh}
            renderCard={(entry) => (
              <SortableWaitlistCard
                key={entry.id}
                entry={entry}
                canWrite={canWrite}
                onOffer={handleOffer}
                onChanged={refresh}
              />
            )}
          />
          <WaitlistColumn
            id="scheduled"
            title="Agendado"
            entries={grouped.scheduled}
            canWrite={canWrite}
            onOffer={handleOffer}
            onChanged={refresh}
            renderCard={(entry) => (
              <WaitlistCard
                key={entry.id}
                entry={entry}
                canWrite={canWrite}
                onOffer={handleOffer}
                onChanged={refresh}
              />
            )}
          />
        </div>

        <DragOverlay>
          {activeEntry ? (
            <WaitlistCard
              entry={activeEntry}
              canWrite={canWrite}
              onOffer={handleOffer}
              onChanged={refresh}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <WaitlistEntryForm
        dentists={dentists}
        open={entryFormOpen}
        onOpenChange={setEntryFormOpen}
        onSuccess={refresh}
      />

      <SlotOfferForm
        entry={offerEntry}
        dentists={dentists}
        open={offerFormOpen}
        onOpenChange={setOfferFormOpen}
        onSuccess={refresh}
      />
    </div>
  );
}
