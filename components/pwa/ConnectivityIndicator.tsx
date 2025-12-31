'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Connectivity Indicator - Shows online/offline status
 * PWA Enhancement for INMOVA
 */
export function ConnectivityIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // ✅ FIX: Safe check for browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      toast.success('Conexi\u00f3n restablecida', {
        description: 'Ya est\u00e1s conectado a internet',
        icon: <Wifi className="h-4 w-4" />,
      });
      
      // Hide indicator after 3 seconds
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
      toast.error('Sin conexi\u00f3n', {
        description: 'Trabajando en modo offline',
        icon: <WifiOff className="h-4 w-4" />,
        duration: Infinity,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      if (response.ok) {
        setIsOnline(true);
        setShowIndicator(false);
        toast.success('Conexi\u00f3n restablecida');
      }
    } catch (error) {
      toast.error('A\u00fan sin conexi\u00f3n');
    } finally {
      setIsRetrying(false);
    }
  };

  if (!showIndicator && isOnline) return null;

  return (
    <>
      {/* Floating indicator */}
      <div
        className={cn(
          "fixed bottom-4 right-4 z-50",
          "flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg",
          "transition-all duration-300",
          isOnline 
            ? "bg-green-500 text-white" 
            : "bg-red-500 text-white"
        )}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {isOnline ? (
          <>
            <Wifi className="h-5 w-5" aria-hidden="true" />
            <span className="font-medium">En l\u00ednea</span>
          </>
        ) : (
          <>
            <WifiOff className="h-5 w-5" aria-hidden="true" />
            <span className="font-medium">Sin conexi\u00f3n</span>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="ml-2 p-1 rounded hover:bg-white/20 transition-colors"
              aria-label="Reintentar conexi\u00f3n"
            >
              <RefreshCw 
                className={cn(
                  "h-4 w-4",
                  isRetrying && "animate-spin"
                )} 
                aria-hidden="true"
              />
            </button>
          </>
        )}
      </div>

      {/* Persistent banner when offline */}
      {!isOnline && (
        <div 
          className="fixed top-0 left-0 right-0 z-40 bg-yellow-500 text-black px-4 py-2 text-center font-medium"
          role="alert"
          aria-live="assertive"
        >
          <div className="container mx-auto flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" aria-hidden="true" />
            <span>Modo offline - Algunas funciones pueden no estar disponibles</span>
          </div>
        </div>
      )}
    </>
  );
}