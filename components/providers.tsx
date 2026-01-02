'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { ConnectivityIndicator } from '@/components/pwa/ConnectivityIndicator';
import { I18nProvider } from '@/lib/i18n-context';
import { BrandingProvider } from '@/components/BrandingProvider';
import { DesignSystemProvider } from '@/components/DesignSystemProvider';
import { QueryProvider } from '@/components/QueryProvider';
import { EnhancedErrorBoundary } from '@/components/ui/enhanced-error-boundary';
import { WhiteScreenMonitor } from '@/components/WhiteScreenMonitor';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EnhancedErrorBoundary
      onError={(error, errorInfo) => {
        // Log a servicio de monitoreo (Sentry, etc.)
        console.error('🔴 [Providers] Error capturado:', { error, errorInfo });
      }}
    >
      <SessionProvider>
        <QueryProvider>
          <DesignSystemProvider>
            <BrandingProvider>
              <I18nProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="light"
                  enableSystem
                  disableTransitionOnChange
                >
                  <WhiteScreenMonitor />
                  <ServiceWorkerRegister />
                  {children}
                  <InstallPrompt />
                  <ConnectivityIndicator />
                  <Toaster />
                </ThemeProvider>
              </I18nProvider>
            </BrandingProvider>
          </DesignSystemProvider>
        </QueryProvider>
      </SessionProvider>
    </EnhancedErrorBoundary>
  );
}