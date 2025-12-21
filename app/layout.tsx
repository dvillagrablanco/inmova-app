import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@/styles/mobile-first.css';
// import 'react-big-calendar/lib/css/react-big-calendar.css'; // Desactivado temporalmente - requiere paquete react-big-calendar
import { Providers } from '@/components/providers';
import { SkipLink } from '@/components/ui/skip-link';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
// import { WebVitalsInit } from '@/components/WebVitalsInit'; // Desactivado temporalmente - requiere paquete web-vitals
import { defaultMetadata } from '@/lib/seo-config';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  ...defaultMetadata,
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
  verification: {
    other: {
      'vercel-deployment': '220194',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <SkipLink />
        <Providers>
          {children}
          <BottomNavigation />
          {/* <WebVitalsInit /> */}
        </Providers>
      </body>
    </html>
  );
}
