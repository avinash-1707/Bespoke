import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded border border-transparent px-2 py-0.5 text-xs font-medium tracking-wide whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent-subtle)] text-[var(--accent-text)] [a&]:hover:bg-[var(--bg-surface-hover)]",
        secondary:
          "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] [a&]:hover:bg-[var(--bg-surface-hover)]",
        destructive:
          "bg-[var(--state-error-subtle)] text-[var(--state-error)] [a&]:hover:bg-[var(--bg-surface-hover)]",
        outline:
          "border-[var(--border-strong)] text-[var(--text-secondary)] [a&]:hover:bg-[var(--bg-surface-hover)] [a&]:hover:text-[var(--text-primary)]",
        ghost:
          "[a&]:hover:bg-[var(--bg-surface-hover)] [a&]:hover:text-[var(--text-primary)]",
        link: "text-[var(--accent-text)] underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
