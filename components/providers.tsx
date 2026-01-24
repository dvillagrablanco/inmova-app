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
import { ErrorBoundary } from '@/components/ui/error-boundary';
import GlobalErrorBoundary from '@/components/error/GlobalErrorBoundary';
import { GlobalErrorInitializer } from '@/components/error/GlobalErrorInitializer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GlobalErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <ErrorBoundary>
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
                    <GlobalErrorInitializer />
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
      </ErrorBoundary>
    </GlobalErrorBoundary>
  );
}