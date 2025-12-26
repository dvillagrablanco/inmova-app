import { Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

/**
 * Lazy-loaded Tabs component
 * Optimiza la carga de pestañas con contenido pesado
 */

// Loading fallback
const TabsLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

// Lazy load de componentes Tabs usando dynamic con named exports
export const Tabs = dynamic(
  () => import('@/components/ui/tabs').then((mod) => mod.Tabs as ComponentType<any>),
  { loading: () => <TabsLoadingFallback />, ssr: true }
);

export const TabsContent = dynamic(
  () => import('@/components/ui/tabs').then((mod) => mod.TabsContent as ComponentType<any>),
  { loading: () => <TabsLoadingFallback />, ssr: true }
);

export const TabsList = dynamic(
  () => import('@/components/ui/tabs').then((mod) => mod.TabsList as ComponentType<any>),
  { loading: () => <TabsLoadingFallback />, ssr: true }
);

export const TabsTrigger = dynamic(
  () => import('@/components/ui/tabs').then((mod) => mod.TabsTrigger as ComponentType<any>),
  { loading: () => <TabsLoadingFallback />, ssr: true }
);
