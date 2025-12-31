import { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { seoMetadata } from '@/lib/data/landing-data';

export const metadata: Metadata = {
  title: seoMetadata.title,
  description: seoMetadata.description,
  keywords:
    typeof seoMetadata.keywords === 'string'
      ? seoMetadata.keywords
      : seoMetadata.keywords.join(', '),
  authors: [{ name: 'INMOVA' }],
  openGraph: {
    title: seoMetadata.title,
    description: seoMetadata.description,
    url: 'https://inmovaapp.com',
    siteName: 'INMOVA',
    images: [
      {
        url: '/images/hero/dashboard-preview.png',
        width: 1920,
        height: 1080,
        alt: 'INMOVA Dashboard',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: seoMetadata.title,
    description: seoMetadata.description,
    images: ['/images/hero/dashboard-preview.png'],
    creator: '@inmovaapp',
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      {children}
      {gaId && <GoogleAnalytics gaId={gaId} />}
      {/* Hotjar Script */}
      {process.env.NEXT_PUBLIC_HOTJAR_ID && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:${process.env.NEXT_PUBLIC_HOTJAR_ID},hjsv:6};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `,
          }}
        />
      )}
      {/* Microsoft Clarity */}
      {process.env.NEXT_PUBLIC_CLARITY_ID && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
            `,
          }}
        />
      )}
    </>
  );
}
