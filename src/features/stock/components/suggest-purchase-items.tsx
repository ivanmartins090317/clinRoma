"use client";

import { useRef, useState, useTransition } from "react";

import { suggestPurchaseItemsAction } from "@/features/stock/actions";
import { purchasePhotoInputAttrs } from "@/features/stock/domain/purchase-photo-capture";
import type { SuggestedPurchaseLine } from "@/features/stock/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SuggestPurchaseItemsProps {
  onSuggested: (result: {
    lines: SuggestedPurchaseLine[];
    visionModel: string;
    truncated: boolean;
  }) => void;
  onError: (message: string) => void;
}

const FAIL_MESSAGE = "Não consegui ler a foto. Digite os itens manualmente.";

export function SuggestPurchaseItems({
  onSuggested,
  onError,
}: SuggestPurchaseItemsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? null);
  }

  function handleSuggest() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      onError("Selecione uma foto para sugerir os itens.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await suggestPurchaseItemsAction(formData);

      if (result.error || !result.lines?.length) {
        onError(result.error ?? FAIL_MESSAGE);
        return;
      }

      onSuggested({
        lines: result.lines,
        visionModel: result.visionModel ?? "desconhecido",
        truncated: result.truncated ?? false,
      });
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
      <div>
        <p className="font-medium">Sugerir itens da foto</p>
        <p className="mt-1 text-sm text-muted-foreground">
          No celular, fotografe a nota agora ou escolha da galeria. A foto é só
          para leitura. Não fica guardada. Revise antes de confirmar a entrada.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="suggest-purchase-photo">Foto da nota ou planilha</Label>
        <Input
          id="suggest-purchase-photo"
          ref={inputRef}
          {...purchasePhotoInputAttrs()}
          onChange={handleFileChange}
          disabled={isPending}
          className="min-h-11 text-base"
        />
        {fileName ? (
          <p className="text-sm text-muted-foreground">{fileName}</p>
        ) : null}
      </div>

      <Button
        type="button"
        variant="secondary"
        disabled={isPending}
        onClick={handleSuggest}
        className="min-h-11 w-full sm:w-auto"
      >
        {isPending ? "Lendo a foto..." : "Sugerir itens da foto"}
      </Button>
    </div>
  );
}
