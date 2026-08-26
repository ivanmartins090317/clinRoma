"use client";

import { XIcon } from "lucide-react";

import {
  EVOLUTION_SEARCH_COPY,
  EVOLUTION_SEARCH_TERM_MAX,
} from "@/features/records/domain/evolution-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EvolutionSearchProps {
  value: string;
  onChange: (value: string) => void;
}

const SEARCH_FIELD_ID = "evolution-history-search";

export function EvolutionSearch({ value, onChange }: EvolutionSearchProps) {
  const hasValue = value.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor={SEARCH_FIELD_ID} className="text-base">
        {EVOLUTION_SEARCH_COPY.label}
      </Label>
      <div className="relative">
        <Input
          id={SEARCH_FIELD_ID}
          type="search"
          value={value}
          maxLength={EVOLUTION_SEARCH_TERM_MAX}
          autoComplete="off"
          placeholder={EVOLUTION_SEARCH_COPY.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 pr-12 text-base md:text-base [&::-webkit-search-cancel-button]:hidden"
        />
        {hasValue ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-0.5 size-11 -translate-y-1/2"
            aria-label={EVOLUTION_SEARCH_COPY.clear}
            onClick={() => onChange("")}
          >
            <XIcon />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
