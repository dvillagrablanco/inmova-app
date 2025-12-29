import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import Script from 'next/script';
import { GA_MEASUREMENT_ID } from '@/lib/analytics';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Inmova App - Gestión Inmobiliaria Inteligente',
    template: '%s | Inmova App',
  },
  description:
    'Plataforma PropTech B2B/B2C para gestión inmobiliaria integral. CRM, gestión de propiedades, inquilinos, contratos y más.',
  keywords: [
    'gestión inmobiliaria',
    'proptech',
    'CRM inmobiliario',
    'gestión de propiedades',
    'alquiler',
    'contratos',
  ],
  authors: [{ name: 'Inmova' }],
  creator: 'Inmova',
  publisher: 'Inmova',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://inmovaapp.com'),
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://inmovaapp.com',
    title: 'Inmova App - Gestión Inmobiliaria Inteligente',
    description:
      'Plataforma PropTech B2B/B2C para gestión inmobiliaria integral. CRM, gestión de propiedades, inquilinos, contratos y más.',
    siteName: 'Inmova App',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inmova App - Gestión Inmobiliaria Inteligente',
    description: 'Plataforma PropTech B2B/B2C para gestión inmobiliaria integral.',
    creator: '@inmovaapp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
