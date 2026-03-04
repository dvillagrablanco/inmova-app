'use client';

import { useState, useEffect } from 'react';

export interface ConnectionStatusProps {
  lastUpdated?: Date;
  className?: string;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);

  if (diffMins === 0) {
    return diffSecs <= 1 ? 'hace un momento' : `hace ${diffSecs} s`;
  }
  if (diffMins === 1) {
    return 'hace 1 min';
  }
  if (diffMins < 60) {
    return `hace ${diffMins} min`;
  }
  const diffHours = Math.floor(diffMins / 60);
  return diffHours === 1 ? 'hace 1 h' : `hace ${diffHours} h`;
}

export function ConnectionStatus({ lastUpdated, className = '' }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [timeAgo, setTimeAgo] = useState<string | null>(
    lastUpdated ? formatTimeAgo(lastUpdated) : null
  );

  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!lastUpdated) return;

    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(lastUpdated));
    }, 10000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div
      className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}
      role="status"
      aria-live="polite"
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-red-500'
        }`}
        aria-hidden
      />
      <span>{isOnline ? 'Online' : 'Sin conexión'}</span>
      {lastUpdated && timeAgo && (
        <span className="opacity-80">· Actualizado {timeAgo}</span>
      )}
    </div>
  );
}
