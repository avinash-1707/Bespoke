/**
 * Shared types for the Prompt Builder. The builder is data-driven on purpose:
 * templates and form fields are plain data, so new ones can be added without
 * touching any rendering or generation logic.
 */

/** Ready-made prompt instructions the user can drop in and then edit by hand. */
export interface PromptTemplate {
  id: string;
  label: string;
  /** One-line summary shown on the template card. */
  description: string;
  /** Suggested prompt name, applied only when the name field is still empty. */
  suggestedName: string;
  /** Returns prompt-instruction boilerplate. Never contains em dashes. */
  build: () => string;
}

export type BuilderFieldType = "select" | "multi";

/** Which part of the generated prompt a field's chosen lines flow into. */
export type BuilderSection = "intro" | "guideline" | "avoid";

export interface BuilderOption {
  value: string;
  label: string;
  /** Sentence fragment woven into the generated prompt for this choice. */
  line: string;
}

export interface BuilderField {
  id: string;
  label: string;
  /** Short helper shown under the label. */
  hint?: string;
  type: BuilderFieldType;
  section: BuilderSection;
  options: BuilderOption[];
  /** Default selection: a single value for "select", an array for "multi". */
  defaultValue: string | string[];
}

/** Form state: field id maps to a single value (select) or values (multi). */
export type BuilderState = Record<string, string | string[]>;
