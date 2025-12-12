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
import { CommandPalette } from '@/components/CommandPalette';
import { ShortcutsHelpModal } from '@/components/ShortcutsHelpModal';
import { AdminTour } from '@/components/AdminTour';
import { useDefaultKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

function KeyboardShortcutsProvider() {
  useDefaultKeyboardShortcuts();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
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
                  <ServiceWorkerRegister />
                  <KeyboardShortcutsProvider />
                  {children}
                  <InstallPrompt />
                  <ConnectivityIndicator />
                  <Toaster />
                  <CommandPalette />
                  <ShortcutsHelpModal />
                  <AdminTour />
                </ThemeProvider>
              </I18nProvider>
            </BrandingProvider>
          </DesignSystemProvider>
        </QueryProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}