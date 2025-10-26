"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Inicializa o QueryClient com política de cache otimizada para desenvolvimento com hot-reload.
 * 
 * Configuração:
 * - staleTime: 0 em dev (sempre re-fetch), 5 min em prod
 * - refetchOnWindowFocus: habilitado em dev, desabilitado em prod
 * - refetchOnMount: habilitado em dev para sincronizar novo componentes
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dados sempre consideram "stale" em dev (força refetch)
            staleTime: 0,
            gcTime: 1000 * 60 * 30,
            retry: (failureCount: number) => {
              return failureCount < 2;
            },
            // Habilitar atualização automática para refletir mudanças em tempo real
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchOnMount: true,
          },
          mutations: {
            retry: 1,
          },
        },
        queryCache: new QueryCache({
          onError: (error: unknown) => {
            console.error("React Query error", { error });
          },
        }),
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}