import type { BuilderField, BuilderState } from "./types";

/**
 * The structured builder fields. This array is the single source of truth: the
 * form renders directly from it and the generator reads selected option lines
 * back out of it, so adding a new field or option is a pure data change.
 *
 * `section` decides where a field's chosen lines land in the generated prompt:
 *   - intro     -> the opening directive (one select field expected)
 *   - guideline -> a "Follow these guidelines" bullet
 *   - avoid     -> an "Avoid the following" bullet
 */
export const BUILDER_FIELDS: BuilderField[] = [
  {
    id: "goal",
    label: "Goal / message type",
    hint: "What this message is meant to do.",
    type: "select",
    section: "intro",
    defaultValue: "sales",
    options: [
      {
        value: "sales",
        label: "Sales outreach",
        line: "a cold sales outreach message that introduces the offering and earns a reply",
      },
      {
        value: "linkedin",
        label: "LinkedIn outreach",
        line: "a short LinkedIn note that feels personal rather than promotional",
      },
      {
        value: "follow_up",
        label: "Follow up message",
        line: "a polite follow up to a message that has not yet received a reply",
      },
      {
        value: "partnership",
        label: "Partnership request",
        line: "a partnership message that proposes a collaboration with shared upside",
      },
      {
        value: "reengagement",
        label: "Customer re-engagement",
        line: "a re-engagement message that revives a conversation that has gone quiet",
      },
      {
        value: "general",
        label: "General outreach",
        line: "an outreach message tailored to the prospect",
      },
    ],
  },
  {
    id: "tone",
    label: "Tone",
    type: "select",
    section: "guideline",
    defaultValue: "friendly",
    options: [
      { value: "friendly", label: "Friendly", line: "Keep the tone friendly and approachable." },
      { value: "professional", label: "Professional", line: "Keep the tone professional and credible." },
      { value: "direct", label: "Direct", line: "Be direct and get to the point quickly." },
      { value: "warm", label: "Warm", line: "Use a warm, genuine voice." },
      { value: "confident", label: "Confident", line: "Sound confident without being pushy." },
      { value: "casual", label: "Casual", line: "Keep it casual and conversational." },
    ],
  },
  {
    id: "length",
    label: "Length",
    type: "select",
    section: "guideline",
    defaultValue: "short",
    options: [
      { value: "tiny", label: "Very short (under 60 words)", line: "Keep it very short, under 60 words." },
      { value: "short", label: "Short (under 90 words)", line: "Keep it concise, under 90 words." },
      { value: "medium", label: "Medium (under 150 words)", line: "Keep it focused, under 150 words." },
    ],
  },
  {
    id: "personalization",
    label: "Personalization",
    hint: "Prospect details to weave in.",
    type: "multi",
    section: "guideline",
    defaultValue: ["role", "company"],
    options: [
      { value: "role", label: "Their role", line: "Reference the prospect's role and responsibilities." },
      { value: "company", label: "Their company", line: "Reference the prospect's company and what it does." },
      { value: "recent", label: "Recent activity", line: "Reference recent work, posts, or activity when available." },
      { value: "shared", label: "Shared connection", line: "Mention a relevant shared interest or connection if one exists." },
      { value: "painpoint", label: "Likely pain point", line: "Tie the message to a likely pain point the prospect faces." },
    ],
  },
  {
    id: "cta",
    label: "Call to action",
    type: "select",
    section: "guideline",
    defaultValue: "soft",
    options: [
      { value: "soft", label: "Soft question", line: "End with a soft, low pressure question that invites a reply." },
      { value: "meeting", label: "Meeting request", line: "End with a clear request for a short call or meeting." },
      { value: "reply", label: "Easy yes or no", line: "End by asking a simple yes or no question to make replying easy." },
      { value: "resource", label: "Offer a resource", line: "End by offering a useful resource with no strings attached." },
      { value: "none", label: "No explicit CTA", line: "Do not force a call to action; let the message breathe." },
    ],
  },
  {
    id: "avoid",
    label: "Things to avoid",
    type: "multi",
    section: "avoid",
    defaultValue: ["buzzwords", "salesy", "templates"],
    options: [
      { value: "buzzwords", label: "Buzzwords", line: "corporate buzzwords and jargon" },
      { value: "salesy", label: "Salesy tone", line: "a salesy or pushy tone" },
      { value: "long", label: "Long paragraphs", line: "long paragraphs and walls of text" },
      { value: "flattery", label: "Generic flattery", line: "generic flattery and empty compliments" },
      { value: "templates", label: "Template feel", line: "anything that reads like a mass template" },
    ],
  },
];

/** A fresh form state seeded from each field's default selection. */
export function defaultBuilderState(): BuilderState {
  const state: BuilderState = {};
  for (const field of BUILDER_FIELDS) {
    state[field.id] = Array.isArray(field.defaultValue)
      ? [...field.defaultValue]
      : field.defaultValue;
  }
  return state;
}

function selectedLine(field: BuilderField, state: BuilderState): string | undefined {
  const value = state[field.id];
  if (typeof value !== "string") return undefined;
  return field.options.find((o) => o.value === value)?.line;
}

function selectedLines(field: BuilderField, state: BuilderState): string[] {
  const value = state[field.id];
  const values = Array.isArray(value) ? value : [];
  return field.options.filter((o) => values.includes(o.value)).map((o) => o.line);
}

/**
 * Composes a system-prompt draft from the builder selections. Output is plain,
 * editable boilerplate and never contains em dashes.
 */
export function buildPromptFromConfig(state: BuilderState): string {
  const introField = BUILDER_FIELDS.find((f) => f.section === "intro");
  const goalLine =
    (introField && selectedLine(introField, state)) ??
    introField?.options[0]?.line ??
    "an outreach message tailored to the prospect";

  const parts: string[] = [`You write outreach on behalf of the user. Draft ${goalLine}.`];

  const guidelineBullets: string[] = [];
  for (const field of BUILDER_FIELDS.filter((f) => f.section === "guideline")) {
    if (field.type === "select") {
      const line = selectedLine(field, state);
      if (line) guidelineBullets.push(line);
    } else {
      guidelineBullets.push(...selectedLines(field, state));
    }
  }
  if (guidelineBullets.length > 0) {
    parts.push("", "Follow these guidelines:", ...guidelineBullets.map((b) => `- ${b}`));
  }

  const avoidItems: string[] = [];
  for (const field of BUILDER_FIELDS.filter((f) => f.section === "avoid")) {
    avoidItems.push(...selectedLines(field, state));
  }
  if (avoidItems.length > 0) {
    parts.push("", "Avoid the following:", ...avoidItems.map((a) => `- ${a}`));
  }

  parts.push(
    "",
    "Write only the message itself, ready to send. Sound like a real person, not a template.",
  );

  return parts.join("\n");
}

/** A sensible default prompt name derived from the chosen goal. */
export function suggestedNameFromState(state: BuilderState): string {
  const introField = BUILDER_FIELDS.find((f) => f.section === "intro");
  const value = introField ? state[introField.id] : undefined;
  const label =
    introField && typeof value === "string"
      ? introField.options.find((o) => o.value === value)?.label
      : undefined;
  return label ? `${label} draft` : "Outreach draft";
}
