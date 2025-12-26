'use client';

/**
 * Helpers para manejo seguro de fechas en SSR/CSR
 * Previene hydration errors al usar fechas en Next.js
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

/**
 * Hook para obtener la fecha actual de manera segura en SSR
 * Retorna null en el servidor y la fecha real en el cliente
 *
 * @example
 * const currentDate = useClientDate();
 * if (!currentDate) return <div>Loading...</div>;
 * return <div>{currentDate.toLocaleDateString()}</div>;
 */
export function useClientDate(initialDate?: Date): Date | null {
  const [date, setDate] = useState<Date | null>(null);

  useEffect(() => {
    setDate(initialDate || new Date());
  }, [initialDate]);

  return date;
}

/**
 * Hook para obtener un timestamp de manera segura en SSR
 *
 * @example
 * const now = useClientTimestamp();
 * if (now === null) return <div>Loading...</div>;
 * return <div>{now}</div>;
 */
export function useClientTimestamp(): number | null {
  const [timestamp, setTimestamp] = useState<number | null>(null);

  useEffect(() => {
    setTimestamp(Date.now());
  }, []);

  return timestamp;
}

/**
 * Hook para formatear fechas de manera segura
 * Usa un placeholder durante SSR y el valor real en el cliente
 *
 * @param date - Fecha a formatear
 * @param formatStr - Formato de fecha (date-fns)
 * @param placeholder - Texto a mostrar durante SSR
 *
 * @example
 * const formattedDate = useSafeFormattedDate(new Date(), 'yyyy-MM-dd', '--');
 * return <div>{formattedDate}</div>; // Muestra '--' en SSR, fecha real en cliente
 */
export function useSafeFormattedDate(
  date: Date | string | null | undefined,
  formatStr: string = 'yyyy-MM-dd',
  placeholder: string = '--'
): string {
  const [formatted, setFormatted] = useState<string>(placeholder);

  useEffect(() => {
    if (date) {
      try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        setFormatted(format(dateObj, formatStr));
      } catch (error) {
        console.error('Error formatting date:', error);
        setFormatted(placeholder);
      }
    }
  }, [date, formatStr, placeholder]);

  return formatted;
}

/**
 * Verifica si estamos en el cliente (navegador)
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Verifica si estamos en el servidor
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Obtiene la fecha actual de manera segura
 * En servidor retorna una fecha fija, en cliente retorna la fecha actual
 *
 * NOTA: Solo usar esto si necesitas un valor durante SSR.
 * Si puedes esperar al montaje del cliente, usa useClientDate() en su lugar.
 *
 * @param fallbackDate - Fecha a usar durante SSR (default: epoch)
 */
export function getSafeDate(fallbackDate?: Date): Date {
  if (isClient()) {
    return new Date();
  }
  return fallbackDate || new Date(0); // Epoch como fallback
}

/**
 * Hook para inicializar estado con fecha de manera segura
 * Previene hydration errors usando null como estado inicial
 *
 * @example
 * const [selectedDate, setSelectedDate] = useSafeDateState();
 * // selectedDate será null inicialmente, luego new Date() después del montaje
 */
export function useSafeDateState(initialDate?: Date): [Date | null, (date: Date | null) => void] {
  const [date, setDate] = useState<Date | null>(null);

  useEffect(() => {
    setDate(initialDate || new Date());
  }, [initialDate]);

  return [date, setDate];
}

/**
 * Componente wrapper que solo renderiza children en el cliente
 * Útil para componentes que dependen de APIs del navegador
 *
 * @example
 * <ClientOnly fallback={<div>Loading...</div>}>
 *   <ComponentThatUsesWindow />
 * </ClientOnly>
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Genera un ID único de manera segura para SSR
 * En servidor usa un contador, en cliente usa timestamp + random
 */
let serverSideIdCounter = 0;

export function generateSafeId(prefix: string = 'id'): string {
  if (isServer()) {
    return `${prefix}-${++serverSideIdCounter}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
