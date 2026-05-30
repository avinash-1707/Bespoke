import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-base transition-[color,border-color,box-shadow] outline-none placeholder:text-[var(--text-muted)] hover:border-[var(--border-strong)] focus-visible:border-[var(--accent-primary)] focus-visible:shadow-[0_0_0_3px_var(--accent-subtle)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--state-error)] aria-invalid:shadow-[0_0_0_3px_var(--state-error-subtle)] md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
