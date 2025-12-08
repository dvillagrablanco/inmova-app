'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import type { CalendarProps } from 'react-big-calendar';

// Lazy load react-big-calendar for better performance
const BigCalendar = dynamic(
  () => import('react-big-calendar').then(mod => mod.Calendar as any),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] bg-gradient-bg rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    ),
  }
) as ComponentType<CalendarProps>;

export { BigCalendar as Calendar };

// Export other react-big-calendar utilities
export { dateFnsLocalizer, Views } from 'react-big-calendar';
export type { View } from 'react-big-calendar';
