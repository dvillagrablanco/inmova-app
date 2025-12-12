'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';
import { PartnerBranding } from '@/hooks/use-partner-branding';

interface FooterProps {
  partnerBranding?: PartnerBranding | null;
}

export function Footer({ partnerBranding }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            {partnerBranding?.logoFooter ? (
              <div className="mb-4">
                <Image
                  src={partnerBranding.logoFooter}
                  alt={partnerBranding.nombre || 'Partner Logo'}
                  width={150}
                  height={50}
                  className="h-8 w-auto object-contain brightness-0 invert"
                />
                <p className="text-xs text-gray-500 mt-2">Powered by INMOVA</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-6 w-6" />
                <span className="text-xl font-bold">INMOVA</span>
              </div>
            )}
            <p className="text-sm text-gray-400 mb-4">
              {partnerBranding ? `Solución proporcionada en colaboración con ${partnerBranding.nombre}` : 'La plataforma PropTech multi-vertical más avanzada de España'}
            </p>
            <div className="flex gap-3">
              <a href="https://twitter.com/inmova" target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost" className="text-white hover:text-indigo-400">Twitter</Button>
              </a>
              <a href="https://linkedin.com/company/inmova" target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost" className="text-white hover:text-indigo-400">LinkedIn</Button>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Producto</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-white transition-colors">Características</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Precios</a></li>
              <li><Link href="/landing/demo" className="hover:text-white transition-colors">Ver Demo</Link></li>
              <li><a href="#integraciones" className="hover:text-white transition-colors">Integraciones</a></li>
              <li><Link href="/comparativa/competidor-1" className="hover:text-indigo-400 transition-colors font-medium">INMOVA vs Competidor 1</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/landing/sobre-nosotros" className="hover:text-white transition-colors">Sobre Nosotros</Link></li>
              <li><Link href="/landing/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/landing/casos-exito" className="hover:text-white transition-colors">Casos de Éxito</Link></li>
              <li><Link href="/landing/contacto" className="hover:text-white transition-colors">Contacto</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/landing/legal/privacidad" className="hover:text-white transition-colors">Privacidad</Link></li>
              <li><Link href="/landing/legal/terminos" className="hover:text-white transition-colors">Términos</Link></li>
              <li><Link href="/landing/legal/gdpr" className="hover:text-white transition-colors">GDPR</Link></li>
              <li><Link href="/landing/legal/cookies" className="hover:text-white transition-colors">Cookies</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>© 2026 INMOVA. Todos los derechos reservados.</p>
          <p className="mt-2">Powered by <span className="text-indigo-400 font-semibold">Enxames Investments SL</span></p>
        </div>
      </div>
    </footer>
  );
}
