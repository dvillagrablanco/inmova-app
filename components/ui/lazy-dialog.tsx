import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

/**
 * Lazy-loaded Dialog component para formularios complejos
 * Reduce el tamaño inicial del bundle
 */

// Loading fallback component
const DialogLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

// Lazy load del Dialog principal usando dynamic con named exports
export const Dialog = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.Dialog as ComponentType<any>),
  { loading: () => <DialogLoadingFallback />, ssr: true }
);

export const DialogContent = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.DialogContent as ComponentType<any>),
  { loading: () => <DialogLoadingFallback />, ssr: true }
);

export const DialogDescription = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.DialogDescription as ComponentType<any>),
  { loading: () => <DialogLoadingFallback />, ssr: true }
);

export const DialogFooter = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.DialogFooter as ComponentType<any>),
  { loading: () => <DialogLoadingFallback />, ssr: true }
);

export const DialogHeader = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.DialogHeader as ComponentType<any>),
  { loading: () => <DialogLoadingFallback />, ssr: true }
);

export const DialogTitle = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.DialogTitle as ComponentType<any>),
  { loading: () => <DialogLoadingFallback />, ssr: true }
);

export const DialogTrigger = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.DialogTrigger as ComponentType<any>),
  { loading: () => <DialogLoadingFallback />, ssr: true }
);
