'use client';

import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Activity, Zap, HardDrive, Clock } from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  memory: number;
  loadTime: number;
  resourceCount: number;
}

/**
 * Componente de monitoreo de performance en tiempo real
 * Solo visible en desarrollo
 */
export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    loadTime: 0,
    resourceCount: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Solo en desarrollo
    if (process.env.NODE_ENV !== 'development') return;

    // Toggle visibility con Ctrl+Shift+P
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    // FPS Monitor
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;

        setMetrics((prev) => ({ ...prev, fps }));
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    measureFPS();

    // Memory Monitor
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
        setMetrics((prev) => ({ ...prev, memory: usedMB }));
      }
    };

    const memoryInterval = setInterval(measureMemory, 2000);

    // Load Time
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    setMetrics((prev) => ({ ...prev, loadTime: Math.round(loadTime) }));

    // Resource Count
    const resources = performance.getEntriesByType('resource');
    setMetrics((prev) => ({ ...prev, resourceCount: resources.length }));

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      cancelAnimationFrame(animationFrameId);
      clearInterval(memoryInterval);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null;
  }

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMemoryColor = (memory: number) => {
    if (memory < 100) return 'text-green-500';
    if (memory < 200) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="fixed bottom-4 right-4 z-50 p-3 bg-background/95 backdrop-blur shadow-lg border">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="h-4 w-4" />
        <span className="text-xs font-semibold">Performance Monitor</span>
        <Badge variant="outline" className="text-xs">
          DEV
        </Badge>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">FPS:</span>
          </div>
          <span className={`font-mono font-semibold ${getFPSColor(metrics.fps)}`}>
            {metrics.fps}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <HardDrive className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Memory:</span>
          </div>
          <span className={`font-mono font-semibold ${getMemoryColor(metrics.memory)}`}>
            {metrics.memory} MB
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Load:</span>
          </div>
          <span className="font-mono font-semibold">{metrics.loadTime}ms</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Resources:</span>
          </div>
          <span className="font-mono font-semibold">{metrics.resourceCount}</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
        Press <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+Shift+P</kbd> to toggle
      </div>
    </Card>
  );
}
