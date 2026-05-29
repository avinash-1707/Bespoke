"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** App-wide client providers. TanStack Query drives all client data fetching. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
