'use client';

import { useState, useEffect } from 'react';
import { X, Cookie, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

interface CookiePreferences {
  necessary: boolean; // Siempre true
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Verificar si ya dio consentimiento
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Esperar 1 segundo antes de mostrar (mejor UX)
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Cargar preferencias guardadas
      try {
        const saved = JSON.parse(consent);
        setPreferences(saved);
        applyPreferences(saved);
      } catch (e) {
        // Si hay error, mostrar banner de nuevo
        setShowBanner(true);
      }
    }

    // Listener para abrir panel desde política de cookies
    const handleOpenSettings = () => {
      setShowBanner(true);
      setShowSettings(true);
    };

    window.addEventListener('open-cookie-banner', handleOpenSettings);
    return () => window.removeEventListener('open-cookie-banner', handleOpenSettings);
  }, []);

  const applyPreferences = (prefs: CookiePreferences) => {
    // Aplicar preferencias a Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: prefs.analytics ? 'granted' : 'denied',
        ad_storage: prefs.marketing ? 'granted' : 'denied',
      });
    }

    // Eliminar cookies no consentidas
    if (!prefs.analytics) {
      deleteCookie('_ga');
      deleteCookie('_gid');
      deleteCookie('_gat');
    }

    // Más lógica de aplicación de preferencias...
  };

  const deleteCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    
    setPreferences(allAccepted);
    localStorage.setItem('cookie-consent', JSON.stringify(allAccepted));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    applyPreferences(allAccepted);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleAcceptNecessary = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    
    setPreferences(onlyNecessary);
    localStorage.setItem('cookie-consent', JSON.stringify(onlyNecessary));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    applyPreferences(onlyNecessary);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    applyPreferences(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Banner Simple (Primera Vista) */}
      {!showSettings && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <Cookie className="h-6 w-6 text-blue-600" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Esta web utiliza cookies
                </h3>
                <p className="text-sm text-gray-600">
                  Utilizamos cookies propias y de terceros para mejorar nuestros servicios y
                  mostrarle publicidad relacionada con sus preferencias mediante el análisis de
                  sus hábitos de navegación. Puede aceptar todas las cookies pulsando{' '}
                  <strong>"Aceptar todas"</strong>, configurarlas o rechazar su uso en{' '}
                  <strong>"Configurar"</strong>.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Más información en nuestra{' '}
                  <Link href="/legal/cookies" className="text-blue-700 font-medium hover:underline hover:text-blue-800">
                    Política de Cookies
                  </Link>{' '}
                  y{' '}
                  <Link href="/legal/privacy" className="text-blue-700 font-medium hover:underline hover:text-blue-800">
                    Política de Privacidad
                  </Link>
                  .
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-gray-400 text-gray-900 hover:bg-gray-100 hover:border-gray-500 font-medium"
                >
                  <Settings className="h-4 w-4" />
                  Configurar
                </Button>
                <Button
                  onClick={handleAcceptNecessary}
                  variant="outline"
                  size="sm"
                  className="border-gray-400 text-gray-900 hover:bg-gray-100 hover:border-gray-500 font-medium"
                >
                  Solo necesarias
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Aceptar todas
                </Button>
              </div>

              <button
                onClick={handleAcceptNecessary}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de Configuración Avanzada */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              Configuración de Cookies
            </DialogTitle>
            <DialogDescription>
              Personaliza qué cookies quieres permitir. Las cookies necesarias no se pueden
              desactivar ya que son esenciales para el funcionamiento del sitio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Cookies Necesarias */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">
                    Cookies Necesarias
                  </Label>
                  <p className="text-sm text-gray-500">
                    Esenciales para el funcionamiento básico del sitio. No se pueden desactivar.
                  </p>
                </div>
                <Switch
                  checked={true}
                  disabled={true}
                  aria-label="Cookies necesarias (siempre activadas)"
                />
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-semibold mb-1">Incluye:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Sesión de usuario (autenticación)</li>
                  <li>Seguridad CSRF</li>
                  <li>Preferencias básicas de navegación</li>
                </ul>
              </div>
            </div>

            {/* Cookies Funcionales */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="functional" className="text-base font-semibold">
                    Cookies Funcionales
                  </Label>
                  <p className="text-sm text-gray-500">
                    Permiten recordar sus elecciones (tema, idioma, layout) para mejorar su experiencia.
                  </p>
                </div>
                <Switch
                  id="functional"
                  checked={preferences.functional}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, functional: checked })
                  }
                />
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-semibold mb-1">Incluye:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Preferencia de tema (claro/oscuro)</li>
                  <li>Configuración de sidebar</li>
                  <li>Tutoriales completados</li>
                </ul>
              </div>
            </div>

            {/* Cookies de Análisis */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="analytics" className="text-base font-semibold">
                    Cookies de Análisis
                  </Label>
                  <p className="text-sm text-gray-500">
                    Nos ayudan a entender cómo los usuarios interactúan con la Plataforma.
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, analytics: checked })
                  }
                />
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-semibold mb-1">Incluye:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Google Analytics (GA4)</li>
                  <li>Páginas más visitadas</li>
                  <li>Tiempo de permanencia</li>
                  <li>Flujo de navegación</li>
                </ul>
                <p className="mt-2 text-xs">
                  <strong>Nota:</strong> Los datos se anonimizan y no se utilizan para
                  identificarle personalmente.
                </p>
              </div>
            </div>

            {/* Cookies de Marketing */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="marketing" className="text-base font-semibold">
                    Cookies de Marketing
                  </Label>
                  <p className="text-sm text-gray-500">
                    Utilizadas para mostrar publicidad relevante y medir la efectividad de
                    campañas.
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, marketing: checked })
                  }
                />
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-semibold mb-1">Incluye:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Seguimiento de conversiones</li>
                  <li>Remarketing</li>
                  <li>Medición de campañas publicitarias</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-3 border-t pt-4">
            <Button
              onClick={handleAcceptNecessary}
              variant="outline"
              className="flex-1 border-gray-400 text-gray-900 hover:bg-gray-100 hover:border-gray-500 font-medium"
            >
              Solo necesarias
            </Button>
            <Button
              onClick={handleSavePreferences}
              variant="default"
              className="flex-1 gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium"
            >
              <Check className="h-4 w-4" />
              Guardar preferencias
            </Button>
            <Button
              onClick={handleAcceptAll}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Aceptar todas
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Puede cambiar sus preferencias en cualquier momento desde{' '}
            <Link href="/configuracion" className="text-blue-600 hover:underline">
              Configuración
            </Link>{' '}
            o en nuestra{' '}
            <Link href="/legal/cookies" className="text-blue-600 hover:underline">
              Política de Cookies
            </Link>
            .
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
