'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { I18nProvider } from '@/lib/i18n-context';
import { BrandingProvider } from '@/components/BrandingProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <BrandingProvider>
        <I18nProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ServiceWorkerRegister />
            {children}
            <InstallPrompt />
            <Toaster />
          </ThemeProvider>
        </I18nProvider>
      </BrandingProvider>
    </SessionProvider>
  );
}