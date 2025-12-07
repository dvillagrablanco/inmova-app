import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { ComponentType } from 'react';

/**
 * Lazy-loaded Dialog component para formularios complejos
 * Reduce el tamaño inicial del bundle
 */

// Lazy load del Dialog principal
const Dialog = lazy(() => import('@/components/ui/dialog').then(mod => ({ default: mod.Dialog })));
const DialogContent = lazy(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogContent })));
const DialogDescription = lazy(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogDescription })));
const DialogFooter = lazy(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogFooter })));
const DialogHeader = lazy(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogHeader })));
const DialogTitle = lazy(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogTitle })));
const DialogTrigger = lazy(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogTrigger })));

// Loading fallback component
const DialogLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

// Wrapped components with Suspense
export const LazyDialog = (props: any) => (
  <Suspense fallback={<DialogLoadingFallback />}>
    <Dialog {...props} />
  </Suspense>
);

export const LazyDialogContent = (props: any) => (
  <Suspense fallback={<DialogLoadingFallback />}>
    <DialogContent {...props} />
  </Suspense>
);

export const LazyDialogDescription = (props: any) => (
  <Suspense fallback={<DialogLoadingFallback />}>
    <DialogDescription {...props} />
  </Suspense>
);

export const LazyDialogFooter = (props: any) => (
  <Suspense fallback={<DialogLoadingFallback />}>
    <DialogFooter {...props} />
  </Suspense>
);

export const LazyDialogHeader = (props: any) => (
  <Suspense fallback={<DialogLoadingFallback />}>
    <DialogHeader {...props} />
  </Suspense>
);

export const LazyDialogTitle = (props: any) => (
  <Suspense fallback={<DialogLoadingFallback />}>
    <DialogTitle {...props} />
  </Suspense>
);

export const LazyDialogTrigger = (props: any) => (
  <Suspense fallback={<DialogLoadingFallback />}>
    <DialogTrigger {...props} />
  </Suspense>
);

// Re-export as default
export {
  LazyDialog as Dialog,
  LazyDialogContent as DialogContent,
  LazyDialogDescription as DialogDescription,
  LazyDialogFooter as DialogFooter,
  LazyDialogHeader as DialogHeader,
  LazyDialogTitle as DialogTitle,
  LazyDialogTrigger as DialogTrigger,
};
