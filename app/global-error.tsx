'use client';

/**
 * Global Error Handler
 * Captura errores críticos incluso fuera del layout de la aplicación
 */

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global critical error:', error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)',
            padding: '1rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '32rem',
              width: '100%',
              background: 'white',
              borderRadius: '1rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              padding: '2rem',
            }}
          >
            {/* Icon */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '5rem',
                  height: '5rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(to bottom right, #ef4444, #dc2626)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                <svg
                  style={{ width: '2.5rem', height: '2.5rem', color: 'white' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#111827',
                textAlign: 'center',
                marginBottom: '0.5rem',
              }}
            >
              Error Crítico
            </h1>

            <p
              style={{
                fontSize: '1.125rem',
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: '1.5rem',
              }}
            >
              Ha ocurrido un error crítico en la aplicación. Por favor, recarga la página.
            </p>

            {/* Error ID */}
            {error.digest && (
              <div
                style={{
                  background: '#f3f4f6',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  <strong>ID del error:</strong>{' '}
                  <code
                    style={{
                      background: '#e5e7eb',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                    }}
                  >
                    {error.digest}
                  </code>
                </p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={reset}
                style={{
                  flex: 1,
                  background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
                  color: 'white',
                  fontWeight: '500',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Reintentar
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  flex: 1,
                  background: 'white',
                  color: '#374151',
                  fontWeight: '500',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Ir al inicio
              </button>
            </div>

            {/* Help text */}
            <p
              style={{
                fontSize: '0.875rem',
                color: '#9ca3af',
                textAlign: 'center',
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              Si el problema persiste, contacta con soporte técnico
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
