"use client";

import type { ReactNode } from "react";

interface SmoothScrollProps {
  children: ReactNode;
  className?: string;
}

export function SmoothScroll({ children, className }: SmoothScrollProps) {
  return (
    <main
      className={`dashboard-scroll min-h-0 overflow-y-auto ${className ?? ""}`}
    >
      {children}
    </main>
  );
}
