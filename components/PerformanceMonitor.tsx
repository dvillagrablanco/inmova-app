'use client';

import { useEffect, useState } from 'react';
import { getWebVitals } from '@/lib/web-vitals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Layout, Clock, Server } from 'lucide-react';

interface VitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<VitalMetric[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Solo mostrar en desarrollo
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
      
      // Actualizar métricas cada 2 segundos
      const interval = setInterval(() => {
        const vitals = getWebVitals();
        setMetrics(vitals);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, []);

  if (!isVisible || metrics.length === 0) return null;

  const getIcon = (name: string) => {
    switch (name) {
      case 'LCP': return <Clock className="h-4 w-4" />;
      case 'FID': return <Zap className="h-4 w-4" />;
      case 'CLS': return <Layout className="h-4 w-4" />;
      case 'FCP': return <Activity className="h-4 w-4" />;
      case 'TTFB': return <Server className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'bg-green-100 text-green-800 border-green-200';
      case 'needs-improvement': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLabel = (name: string) => {
    const labels: Record<string, string> = {
      LCP: 'Largest Contentful Paint',
      FID: 'First Input Delay',
      CLS: 'Cumulative Layout Shift',
      FCP: 'First Contentful Paint',
      TTFB: 'Time to First Byte',
      INP: 'Interaction to Next Paint',
    };
    return labels[name] || name;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-600" />
            Core Web Vitals
          </CardTitle>
          <CardDescription className="text-xs">
            Métricas de performance en tiempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getIcon(metric.name)}
                  <div>
                    <div className="text-xs font-medium">{metric.name}</div>
                    <div className="text-xs text-gray-500">{getLabel(metric.name)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {metric.name === 'CLS' 
                      ? metric.value.toFixed(3)
                      : `${metric.value.toFixed(0)}ms`
                    }
                  </span>
                  <Badge className={`text-xs ${getColor(metric.rating)}`}>
                    {metric.rating === 'good' ? '✓' : metric.rating === 'needs-improvement' ? '!' : '✗'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t text-xs text-gray-500 text-center">
            Solo visible en desarrollo
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
