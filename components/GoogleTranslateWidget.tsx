'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

function getCookieLocale(): string {
  if (typeof document === 'undefined') return 'es';
  const match = document.cookie.match(/NEXT_LOCALE=(\w+)/);
  return match?.[1] || 'es';
}

function applyGoogleTranslate(locale: string) {
  const target = locale === 'es' ? '' : locale;
  const existing = document.cookie.match(/googtrans=([^;]+)/)?.[1];
  const desired = target ? `/es/${target}` : '';

  if (existing === desired) return;

  const host = window.location.hostname;
  const parts = host.split('.');
  const domain = parts.length > 1 ? `.${parts.slice(-2).join('.')}` : host;

  if (desired) {
    document.cookie = `googtrans=${desired}; path=/`;
    document.cookie = `googtrans=${desired}; path=/; domain=${domain}`;
  } else {
    document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = `googtrans=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
  }
}

export function GoogleTranslateWidget() {
  useEffect(() => {
    const locale = getCookieLocale();

    if (locale === 'es') {
      const existing = document.cookie.match(/googtrans=([^;]+)/)?.[1];
      if (existing) {
        applyGoogleTranslate('es');
      }
      return;
    }

    applyGoogleTranslate(locale);

    if (document.getElementById('google-translate-script')) return;

    window.googleTranslateElementInit = () => {
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'es',
            includedLanguages: 'en,pt,fr,de,it',
            autoDisplay: false,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          'google_translate_element'
        );
      } catch (error) {
        console.error('[GoogleTranslate] init error', error);
      }
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div
      id="google_translate_element"
      style={{ position: 'fixed', top: '-1000px', left: '-1000px', visibility: 'hidden' }}
      aria-hidden="true"
    />
  );
}
