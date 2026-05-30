"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  BUILDER_FIELDS,
  buildPromptFromConfig,
  defaultBuilderState,
  suggestedNameFromState,
  type BuilderField,
  type BuilderState,
} from "@/lib/prompt-builder";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface BuilderFormTabProps {
  /** Inserts the generated boilerplate into the editor. */
  onApply: (content: string, suggestedName: string) => void;
}

/**
 * Structured form that assembles a prompt draft from a few choices. Both the
 * controls and the generated text are driven entirely by BUILDER_FIELDS, so new
 * fields appear here and in the output with no code change.
 */
export function BuilderFormTab({ onApply }: BuilderFormTabProps) {
  const [state, setState] = useState<BuilderState>(defaultBuilderState);

  function setField(id: string, value: string | string[]) {
    setState((prev) => ({ ...prev, [id]: value }));
  }

  function generate() {
    onApply(buildPromptFromConfig(state), suggestedNameFromState(state));
  }

  return (
    <div className="flex flex-col gap-4">
      {BUILDER_FIELDS.map((field) => (
        <FieldControl
          key={field.id}
          field={field}
          value={state[field.id] ?? field.defaultValue}
          onChange={(value) => setField(field.id, value)}
        />
      ))}

      <Button type="button" onClick={generate} className="mt-1 w-full">
        <Sparkles className="h-4 w-4" />
        Generate prompt
      </Button>
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: BuilderField;
  value: string | string[];
  onChange: (value: string | string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <Label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          {field.label}
        </Label>
        {field.hint ? (
          <span className="text-xs text-[var(--text-muted)]">{field.hint}</span>
        ) : null}
      </div>

      {field.type === "select" ? (
        <Select value={value as string} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <MultiControl
          field={field}
          values={Array.isArray(value) ? value : []}
          onChange={onChange}
        />
      )}
    </div>
  );
}

function MultiControl({
  field,
  values,
  onChange,
}: {
  field: BuilderField;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  function toggle(optionValue: string, checked: boolean) {
    onChange(
      checked
        ? [...values, optionValue]
        : values.filter((v) => v !== optionValue),
    );
  }

  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {field.options.map((option) => {
        const id = `${field.id}-${option.value}`;
        const checked = values.includes(option.value);
        return (
          <label
            key={option.value}
            htmlFor={id}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-2 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--border-strong)] has-[[data-state=checked]]:border-[var(--accent-primary)] has-[[data-state=checked]]:text-[var(--text-primary)]"
          >
            <Checkbox
              id={id}
              checked={checked}
              onCheckedChange={(v) => toggle(option.value, v === true)}
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
