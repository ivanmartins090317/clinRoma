"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ANAMNESIS_COPY,
  PAPER_DISEASES,
} from "@/features/records/domain/anamnesis-form-v2";

interface AnamnesisDiseaseListProps {
  selectedIds: string[];
  otherDisease: string;
  onToggle: (id: string) => void;
  onOtherDiseaseChange: (value: string) => void;
  disabled?: boolean;
}

export function AnamnesisDiseaseList({
  selectedIds,
  otherDisease,
  onToggle,
  onOtherDiseaseChange,
  disabled,
}: AnamnesisDiseaseListProps) {
  const selected = new Set(selectedIds);

  return (
    <fieldset className="space-y-3">
      <legend className="text-base font-medium">
        {ANAMNESIS_COPY.diseasesHeading}
      </legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PAPER_DISEASES.map((disease) => {
          const checked = selected.has(disease.id);

          return (
            <label
              key={disease.id}
              className={cn(
                "flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-1.5 text-sm leading-snug",
                checked
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(disease.id)}
              />
              {disease.label}
            </label>
          );
        })}
      </div>
      <div className="space-y-2">
        <Label htmlFor="other_disease" className="text-base">
          {ANAMNESIS_COPY.otherDiseaseLabel}
        </Label>
        <Textarea
          id="other_disease"
          value={otherDisease}
          disabled={disabled}
          onChange={(event) => onOtherDiseaseChange(event.target.value)}
          className="min-h-16 text-base"
        />
      </div>
    </fieldset>
  );
}
