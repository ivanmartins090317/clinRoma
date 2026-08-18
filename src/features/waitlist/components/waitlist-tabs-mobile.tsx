"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WaitlistBoardEntry } from "@/features/waitlist/queries";
import { WaitlistCard } from "@/features/waitlist/components/waitlist-card";

interface WaitlistTabsMobileProps {
  waiting: WaitlistBoardEntry[];
  offered: WaitlistBoardEntry[];
  scheduled: WaitlistBoardEntry[];
  canWrite: boolean;
  onOffer: (entry: WaitlistBoardEntry) => void;
  onChanged: () => void;
}

export function WaitlistTabsMobile({
  waiting,
  offered,
  scheduled,
  canWrite,
  onOffer,
  onChanged,
}: WaitlistTabsMobileProps) {
  return (
    <Tabs defaultValue="waiting" className="md:hidden">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="waiting" className="min-h-11">
          Aguardando ({waiting.length})
        </TabsTrigger>
        <TabsTrigger value="offered" className="min-h-11">
          Oferta ({offered.length})
        </TabsTrigger>
        <TabsTrigger value="scheduled" className="min-h-11">
          Agendado ({scheduled.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="waiting" className="mt-4 space-y-3">
        {waiting.map((entry) => (
          <WaitlistCard
            key={entry.id}
            entry={entry}
            canWrite={canWrite}
            onOffer={onOffer}
            onChanged={onChanged}
          />
        ))}
      </TabsContent>

      <TabsContent value="offered" className="mt-4 space-y-3">
        {offered.map((entry) => (
          <WaitlistCard
            key={entry.id}
            entry={entry}
            canWrite={canWrite}
            onOffer={onOffer}
            onChanged={onChanged}
          />
        ))}
      </TabsContent>

      <TabsContent value="scheduled" className="mt-4 space-y-3">
        {scheduled.map((entry) => (
          <WaitlistCard
            key={entry.id}
            entry={entry}
            canWrite={canWrite}
            onOffer={onOffer}
            onChanged={onChanged}
          />
        ))}
      </TabsContent>
    </Tabs>
  );
}
