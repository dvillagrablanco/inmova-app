/**
 * Lazy-loaded Calendar Component
 * Calendar components can be heavy with date manipulation libraries
 */
import { lazy, Suspense } from 'react';
import type { DayPickerProps } from 'react-day-picker';

// Lazy load Calendar
const CalendarComponent = lazy(() => 
  import('@/components/ui/calendar').then(module => ({ 
    default: module.Calendar 
  }))
);

interface LazyCalendarProps {
  loadingComponent?: React.ReactNode;
  [key: string]: any;
}

export function LazyCalendar({ loadingComponent, ...props }: LazyCalendarProps) {
  const defaultLoading = (
    <div className="flex items-center justify-center h-72 bg-muted/50 rounded-lg animate-pulse">
      <div className="text-sm text-muted-foreground">Cargando calendario...</div>
    </div>
  );

  return (
    <Suspense fallback={loadingComponent || defaultLoading}>
      <CalendarComponent {...props} />
    </Suspense>
  );
}

export default LazyCalendar;
