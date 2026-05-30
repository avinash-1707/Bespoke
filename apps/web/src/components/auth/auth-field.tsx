"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type AuthFieldProps = {
  label: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

const INPUT_CLASS =
  "w-full rounded-md border border-(--lp-line) bg-(--lp-bg-raised) px-3.5 py-2.5 " +
  "text-sm text-(--lp-text) placeholder:text-(--lp-text-faint) " +
  "shadow-[inset_0_1px_2px_rgba(33,28,23,0.04)] outline-none " +
  // Focus ring is a CSS transition only — high-frequency interaction, no JS motion (Emil).
  "transition-[border-color,box-shadow] duration-150 ease-out " +
  "focus:border-(--lp-accent) focus:shadow-[0_0_0_3px_var(--lp-accent-tint)] " +
  "disabled:opacity-60";

/**
 * Labeled auth input on the warm landing palette. When `type="password"` it
 * grows a show/hide eye toggle; toggling swaps the icon instantly (no motion —
 * the user may click it repeatedly and wants speed, not a show).
 */
export function AuthField({ label, type = "text", ...props }: AuthFieldProps) {
  const id = useId();
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);
  const resolvedType = isPassword && revealed ? "text" : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-[0.12em] text-(--lp-text-soft)"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={resolvedType}
          className={isPassword ? `${INPUT_CLASS} pr-11` : INPUT_CLASS}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-(--lp-text-faint) transition-colors duration-150 hover:text-(--lp-text) focus-visible:text-(--lp-text) focus-visible:outline-none"
          >
            {revealed ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
