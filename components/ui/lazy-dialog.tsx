'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from './skeleton';

// Lazy load Dialog components
export const LazyDialog = dynamic(() => import('./dialog').then(mod => ({ default: mod.Dialog })), {
  ssr: false,
});

export const LazyDialogTrigger = dynamic(() => import('./dialog').then(mod => ({ default: mod.DialogTrigger })), {
  ssr: false,
});

export const LazyDialogContent = dynamic(() => import('./dialog').then(mod => ({ default: mod.DialogContent })), {
  loading: () => <Skeleton className="w-full h-[300px]" />,
  ssr: false,
});

export const LazyDialogHeader = dynamic(() => import('./dialog').then(mod => ({ default: mod.DialogHeader })), {
  ssr: false,
});

export const LazyDialogTitle = dynamic(() => import('./dialog').then(mod => ({ default: mod.DialogTitle })), {
  ssr: false,
});

export const LazyDialogDescription = dynamic(() => import('./dialog').then(mod => ({ default: mod.DialogDescription })), {
  ssr: false,
});

export const LazyDialogFooter = dynamic(() => import('./dialog').then(mod => ({ default: mod.DialogFooter })), {
  ssr: false,
});

export const LazyDialogPortal = dynamic(() => import('./dialog').then(mod => ({ default: mod.DialogPortal })), {
  ssr: false,
});

export const LazyDialogOverlay = dynamic(() => import('./dialog').then(mod => ({ default: mod.DialogOverlay })), {
  ssr: false,
});

export const LazyDialogClose = dynamic(() => import('./dialog').then(mod => ({ default: mod.DialogClose })), {
  ssr: false,
});

// Export aliases for backwards compatibility
export {
  LazyDialog as Dialog,
  LazyDialogTrigger as DialogTrigger,
  LazyDialogContent as DialogContent,
  LazyDialogHeader as DialogHeader,
  LazyDialogTitle as DialogTitle,
  LazyDialogDescription as DialogDescription,
  LazyDialogFooter as DialogFooter,
  LazyDialogPortal as DialogPortal,
  LazyDialogOverlay as DialogOverlay,
  LazyDialogClose as DialogClose,
};
