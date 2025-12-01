"use client";

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { makeQueryClient } from '@/lib/react-query/query-client';

/**
 * QueryProvider para React Query
 * Proporciona caching inteligente y gestión de estado del servidor
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Crear query client solo una vez
  const [queryClient] = useState(() => makeQueryClient());
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
