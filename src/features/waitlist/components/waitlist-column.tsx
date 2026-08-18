"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { WaitlistBoardEntry } from "@/features/waitlist/queries";
import { WaitlistCard } from "@/features/waitlist/components/waitlist-card";
import { cn } from "@/lib/utils";

interface WaitlistColumnProps {
  id: "waiting" | "offered" | "scheduled";
  title: string;
  entries: WaitlistBoardEntry[];
  canWrite: boolean;
  onOffer: (entry: WaitlistBoardEntry) => void;
  onChanged: () => void;
  renderCard?: (
    entry: WaitlistBoardEntry,
    dragHandle?: React.ReactNode,
  ) => React.ReactNode;
}

export function WaitlistColumn({
  id,
  title,
  entries,
  canWrite,
  onOffer,
  onChanged,
  renderCard,
}: WaitlistColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "rounded-xl border border-border bg-muted/30 p-4",
        isOver && "ring-2 ring-primary/40",
      )}
    >
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {entries.length}
        </span>
      </header>

      <SortableContext
        items={entries.map((entry) => entry.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {entries.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
              Nenhuma entrada
            </p>
          ) : (
            entries.map((entry) =>
              renderCard ? (
                renderCard(entry)
              ) : (
                <WaitlistCard
                  key={entry.id}
                  entry={entry}
                  canWrite={canWrite}
                  onOffer={onOffer}
                  onChanged={onChanged}
                />
              ),
            )
          )}
        </div>
      </SortableContext>
    </section>
  );
}
