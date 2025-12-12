'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import logger from '@/lib/logger';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log el error a un servicio de monitoreo
    logger.error('Error crítico capturado por global-error.tsx', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            padding: '2rem',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertTriangle style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                Error crítico
              </h1>
            </div>
            
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Se ha producido un error crítico en la aplicación. Por favor, recarga la página o contacta al soporte técnico.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '0.375rem',
                marginBottom: '1.5rem',
                overflowWrap: 'break-word'
              }}>
                <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#4b5563', margin: 0 }}>
                  {error.message}
                </p>
                {error.digest && (
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem', margin: 0 }}>
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              <button
                onClick={reset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                Intentar nuevamente
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '0.625rem 1rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Ir a la página principal
              </button>
            </div>

            {error.digest && (
              <p style={{ 
                fontSize: '0.75rem', 
                textAlign: 'center', 
                color: '#9ca3af', 
                marginTop: '1rem'
              }}>
                Si el problema persiste, proporciona este ID al soporte: <code style={{ fontFamily: 'monospace' }}>{error.digest}</code>
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
