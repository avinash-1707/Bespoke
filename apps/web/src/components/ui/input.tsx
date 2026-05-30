import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 text-base transition-[color,border-color,box-shadow] outline-none selection:bg-[var(--accent-primary)] selection:text-white file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--text-primary)] placeholder:text-[var(--text-muted)] hover:border-[var(--border-strong)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[var(--accent-primary)] focus-visible:shadow-[0_0_0_3px_var(--accent-subtle)]",
        "aria-invalid:border-[var(--state-error)] aria-invalid:shadow-[0_0_0_3px_var(--state-error-subtle)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
