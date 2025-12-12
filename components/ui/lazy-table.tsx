'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from './skeleton';

// Lazy load table components with loading fallback
export const LazyTable = dynamic(() => import('./table').then(mod => ({ default: mod.Table })), {
  loading: () => <Skeleton className="w-full h-[400px]" />,
  ssr: false,
});

export const LazyTableHeader = dynamic(() => import('./table').then(mod => ({ default: mod.TableHeader })), {
  ssr: false,
});

export const LazyTableBody = dynamic(() => import('./table').then(mod => ({ default: mod.TableBody })), {
  ssr: false,
});

export const LazyTableRow = dynamic(() => import('./table').then(mod => ({ default: mod.TableRow })), {
  ssr: false,
});

export const LazyTableHead = dynamic(() => import('./table').then(mod => ({ default: mod.TableHead })), {
  ssr: false,
});

export const LazyTableCell = dynamic(() => import('./table').then(mod => ({ default: mod.TableCell })), {
  ssr: false,
});
