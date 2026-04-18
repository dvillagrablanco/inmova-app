'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
    __INMOVA_GTRANS_INITED__?: boolean;
  }
}

const TRANSLATABLE: string[] = ['en', 'pt', 'fr', 'de', 'it'];

function getCookieLocale(): string {
  if (typeof document === 'undefined') return 'es';
  const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=(\w+)/);
  return match?.[1] || 'es';
}

function setGoogTransCookie(target: string) {
  if (typeof document === 'undefined') return;
  const host = window.location.hostname;
  const parts = host.split('.');
  const baseDomain = parts.length > 1 ? `.${parts.slice(-2).join('.')}` : host;
  const value = target ? `/es/${target}` : '';
  const expire = new Date();
  expire.setFullYear(expire.getFullYear() + 1);

  if (value) {
    document.cookie = `googtrans=${value}; path=/; expires=${expire.toUTCString()}`;
    document.cookie = `googtrans=${value}; path=/; domain=${host}; expires=${expire.toUTCString()}`;
    document.cookie = `googtrans=${value}; path=/; domain=${baseDomain}; expires=${expire.toUTCString()}`;
  } else {
    const past = 'Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = `googtrans=; path=/; expires=${past}`;
    document.cookie = `googtrans=; path=/; domain=${host}; expires=${past}`;
    document.cookie = `googtrans=; path=/; domain=${baseDomain}; expires=${past}`;
  }
}

function initWidget() {
  try {
    if (!window.google?.translate?.TranslateElement) return;
    if (window.__INMOVA_GTRANS_INITED__) return;
    new window.google.translate.TranslateElement(
      {
        pageLanguage: 'es',
        includedLanguages: TRANSLATABLE.join(','),
        autoDisplay: false,
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
      },
      'google_translate_element'
    );
    window.__INMOVA_GTRANS_INITED__ = true;
  } catch (e) {
    console.error('[GoogleTranslate] init error', e);
  }
}

export function GoogleTranslateWidget() {
  useEffect(() => {
    const locale = getCookieLocale();
    const isTranslatable = TRANSLATABLE.includes(locale);

    // Aplicar/limpiar cookie ANTES de cargar script
    setGoogTransCookie(isTranslatable ? locale : '');

    if (!isTranslatable) {
      // Locale = español: no cargamos el script
      return;
    }

    // CRÍTICO: definir callback global ANTES de añadir el script
    // Si el script ya está cargado, ejecutar init directamente
    if (window.google?.translate) {
      initWidget();
      return;
    }

    window.googleTranslateElementInit = initWidget;

    if (document.getElementById('google-translate-script')) {
      // Script presente pero google no listo todavía: poll corto
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.translate?.TranslateElement) {
          clearInterval(interval);
          initWidget();
        } else if (attempts > 20) {
          clearInterval(interval);
        }
      }, 250);
      return;
    }

    // Cargar script
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return (
    <div
      id="google_translate_element"
      style={{
        position: 'fixed',
        top: '-1000px',
        left: '-1000px',
        width: 1,
        height: 1,
        overflow: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
