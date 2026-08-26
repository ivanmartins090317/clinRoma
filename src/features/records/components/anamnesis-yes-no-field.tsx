"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  PaperAnswerDraft,
  YesNoAnswer,
  YesNoQuestion,
} from "@/features/records/domain/anamnesis-form-v2";

interface AnamnesisYesNoFieldProps {
  question: YesNoQuestion;
  value: PaperAnswerDraft;
  onChange: (value: PaperAnswerDraft) => void;
  disabled?: boolean;
}

function YesNoMark({
  selected,
  label,
  onSelect,
  disabled,
}: {
  selected: boolean;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-4 text-base font-medium",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground",
      )}
    >
      {label}
    </button>
  );
}

export function AnamnesisYesNoField({
  question,
  value,
  onChange,
  disabled,
}: AnamnesisYesNoFieldProps) {
  function select(answer: YesNoAnswer) {
    onChange({
      answer,
      complement: answer === "yes" ? value.complement : "",
    });
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-base font-medium">{question.text}</legend>
      <div className="flex gap-3">
        <YesNoMark
          label="Sim"
          selected={value.answer === "yes"}
          onSelect={() => select("yes")}
          disabled={disabled}
        />
        <YesNoMark
          label="Não"
          selected={value.answer === "no"}
          onSelect={() => select("no")}
          disabled={disabled}
        />
      </div>
      {question.complementLabel && value.answer === "yes" ? (
        <div className="space-y-2">
          <Label htmlFor={`${question.id}-complement`} className="text-base">
            {question.complementLabel}
          </Label>
          <Textarea
            id={`${question.id}-complement`}
            value={value.complement}
            disabled={disabled}
            onChange={(event) =>
              onChange({ answer: "yes", complement: event.target.value })
            }
            className="min-h-16 text-base"
          />
        </div>
      ) : null}
    </fieldset>
  );
}
