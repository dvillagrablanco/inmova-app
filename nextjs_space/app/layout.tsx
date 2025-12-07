import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { SkipLink } from '@/components/ui/skip-link';
import { WebVitalsInit } from '@/components/WebVitalsInit';
import { defaultMetadata } from '@/lib/seo-config';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  ...defaultMetadata,
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <SkipLink />
        <Providers>
          {children}
          <WebVitalsInit />
        </Providers>
      </body>
    </html>
  );
}
