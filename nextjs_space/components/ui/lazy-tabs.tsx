import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Lazy-loaded Tabs component
 * Optimiza la carga de pestañas con contenido pesado
 */

// Lazy load de componentes Tabs
const Tabs = lazy(() => import('@/components/ui/tabs').then(mod => ({ default: mod.Tabs })));
const TabsContent = lazy(() => import('@/components/ui/tabs').then(mod => ({ default: mod.TabsContent })));
const TabsList = lazy(() => import('@/components/ui/tabs').then(mod => ({ default: mod.TabsList })));
const TabsTrigger = lazy(() => import('@/components/ui/tabs').then(mod => ({ default: mod.TabsTrigger })));

// Loading fallback
const TabsLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

// Wrapped components
export const LazyTabs = (props: any) => (
  <Suspense fallback={<TabsLoadingFallback />}>
    <Tabs {...props} />
  </Suspense>
);

export const LazyTabsContent = (props: any) => (
  <Suspense fallback={<TabsLoadingFallback />}>
    <TabsContent {...props} />
  </Suspense>
);

export const LazyTabsList = (props: any) => (
  <Suspense fallback={<TabsLoadingFallback />}>
    <TabsList {...props} />
  </Suspense>
);

export const LazyTabsTrigger = (props: any) => (
  <Suspense fallback={<TabsLoadingFallback />}>
    <TabsTrigger {...props} />
  </Suspense>
);

// Re-export
export {
  LazyTabs as Tabs,
  LazyTabsContent as TabsContent,
  LazyTabsList as TabsList,
  LazyTabsTrigger as TabsTrigger,
};
