"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] transition-[color,border-color,box-shadow] outline-none hover:border-[var(--accent-primary)] focus-visible:border-[var(--accent-primary)] focus-visible:shadow-[0_0_0_3px_var(--accent-subtle)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--accent-primary)] data-[state=checked]:bg-[var(--accent-primary)] data-[state=checked]:text-white data-[state=checked]:shadow-[var(--shadow-raise)]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
