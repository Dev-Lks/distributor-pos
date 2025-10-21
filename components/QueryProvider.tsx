"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Inicializa o QueryClient com política de cache consistente para reduzir refetches
 * e expõe o provider para todo o aplicativo.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 30,
            retry: (failureCount, error: unknown) => {
              const status = (error as { status?: number } | undefined)?.status;
              if (status === 404) {
                return false;
              }
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: false,
          },
          mutations: {
            retry: 1,
          },
        },
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (process.env.NODE_ENV !== "production") {
              console.error("React Query error", {
                error,
                queryKey: query?.queryKey,
              });
            }
          },
        }),
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}