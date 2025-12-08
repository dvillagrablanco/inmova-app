/**
 * Lazy-loaded Plotly Component
 * Plotly.js is a heavy library (~3MB), so we lazy load it
 */
import { ComponentType, lazy, Suspense } from 'react';
import { PlotParams } from 'react-plotly.js';

// Lazy load the Plotly component
const Plot = lazy(() => import('react-plotly.js'));

interface LazyPlotlyProps extends PlotParams {
  loadingComponent?: React.ReactNode;
}

export function LazyPlotly({ loadingComponent, ...props }: LazyPlotlyProps) {
  const defaultLoading = (
    <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg animate-pulse">
      <div className="text-muted-foreground">Cargando gráfico...</div>
    </div>
  );

  return (
    <Suspense fallback={loadingComponent || defaultLoading}>
      <Plot {...props} />
    </Suspense>
  );
}

export default LazyPlotly;
