"use client";

import { useRef, useState } from "react";

import {
  formatOverlapBody,
  OVERLAP_CANCEL_LABEL,
  OVERLAP_CONFIRM_LABEL,
  OVERLAP_SUPPORT,
  OVERLAP_TITLE,
  type OverlapPrompt,
} from "@/features/agenda/domain/appointment-conflict";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OverlapConfirmDialogProps {
  prompt: OverlapPrompt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function OverlapConfirmDialog({
  prompt,
  open,
  onOpenChange,
  onConfirm,
}: OverlapConfirmDialogProps) {
  const lockRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  function handleConfirm() {
    if (lockRef.current || !prompt) {
      return;
    }

    lockRef.current = true;
    setIsPending(true);

    void onConfirm().finally(() => {
      lockRef.current = false;
      setIsPending(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{OVERLAP_TITLE}</DialogTitle>
        </DialogHeader>

        {prompt ? (
          <div className="space-y-3 text-sm">
            <p>{formatOverlapBody(prompt)}</p>
            <p className="text-muted-foreground">{OVERLAP_SUPPORT}</p>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {OVERLAP_CANCEL_LABEL}
          </Button>
          <Button
            className="min-h-11"
            onClick={handleConfirm}
            disabled={isPending || !prompt}
          >
            {isPending ? "Salvando..." : OVERLAP_CONFIRM_LABEL}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
