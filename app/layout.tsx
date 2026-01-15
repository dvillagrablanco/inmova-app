import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { CookieConsentBanner } from '@/components/legal/cookie-consent-banner';
import { SkipLink } from '@/components/accessibility/SkipLink';
import { ErrorSuppressionInitializer } from '@/components/error-suppression-initializer';
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

        {/* Hotjar Script */}
        {process.env.NEXT_PUBLIC_HOTJAR_ID && (
          <Script id="hotjar" strategy="afterInteractive">
            {`
              (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:${process.env.NEXT_PUBLIC_HOTJAR_ID},hjsv:6};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `}
          </Script>
        )}

        {/* Microsoft Clarity */}
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script id="clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
            `}
          </Script>
        )}

        {/* CSS Bug Workaround - DESACTIVADO TEMPORALMENTE
            Causa problemas de serialización en Next.js streaming.
            El script se duplica en __next_s push y causa "Invalid or unexpected token"
        
        <Script id="css-error-suppressor" strategy="beforeInteractive">
          {`
            (function() {
              const originalError = console.error;
              console.error = function(...args) {
                const firstArg = args[0];
                const message = firstArg?.toString() || '';
                const stack = firstArg?.stack || args[1]?.toString() || '';
                
                // Suprimir solo error CSS de Next.js RSC
                if (
                  message.includes('Invalid or unexpected token') &&
                  (stack.includes('/_next/static/css/') || stack.includes('.css'))
                ) {
                  // Silencioso en producción
                  return;
                }
                
                // Pasar todos los demás errores
                originalError.apply(console, args);
              };
            })();
          `}
        </Script>
        */}

        {/* Crisp Chat - Live Support */}
        <Script id="crisp-chat" strategy="afterInteractive">
          {`
            window.$crisp=[];
            window.CRISP_WEBSITE_ID="1f115549-e9ef-49e5-8fd7-174e6d896a7e";
            (function(){
              var d=document;
              var s=d.createElement("script");
              s.src="https://client.crisp.chat/l.js";
              s.async=1;
              d.getElementsByTagName("head")[0].appendChild(s);
            })();
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <Providers>
          {/* Error suppression for non-critical errors in production */}
          <ErrorSuppressionInitializer />
          {/* WCAG 2.1 AA - Skip Link for keyboard navigation */}
          <SkipLink />
          {children}
          <Toaster />
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
