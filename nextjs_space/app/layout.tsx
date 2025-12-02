import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { SkipLink } from '@/components/ui/skip-link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'INMOVA - Sistema de Gestión Inmobiliaria',
  description: 'Sistema profesional de gestión de propiedades inmobiliarias con innovación y tecnología',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'INMOVA - Gestión Inmobiliaria Innovadora',
    description: 'Sistema profesional de gestión de propiedades',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <SkipLink />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
