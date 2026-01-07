'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2, HardHat } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-6 w-6" />
              <span className="text-xl font-bold">INMOVA</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              La plataforma PropTech multi-vertical más avanzada de España
            </p>
            <div className="flex gap-3">
              <a href="https://twitter.com/inmova" target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="text-white border-gray-600 hover:bg-gray-800 hover:text-indigo-300 hover:border-gray-500 font-medium">Twitter</Button>
              </a>
              <a href="https://linkedin.com/company/inmova" target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="text-white border-gray-600 hover:bg-gray-800 hover:text-indigo-300 hover:border-gray-500 font-medium">LinkedIn</Button>
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
              <li><Link href="/landing/ventajas" className="hover:text-indigo-400 transition-colors font-medium">Ventajas de INMOVA</Link></li>
            </ul>
          </div>

          {/* eWoorker - Construcción B2B */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <HardHat className="h-5 w-5 text-orange-500" />
              eWoorker
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/ewoorker/landing" className="hover:text-orange-400 transition-colors font-medium">Marketplace B2B</Link></li>
              <li><Link href="/ewoorker/landing#como-funciona" className="hover:text-white transition-colors">Cómo Funciona</Link></li>
              <li><Link href="/ewoorker/landing#planes" className="hover:text-white transition-colors">Planes</Link></li>
              <li><Link href="/ewoorker/compliance" className="hover:text-white transition-colors">Compliance Hub</Link></li>
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

        {/* CTA Final */}
        <div className="border-t border-gray-800 pt-8 pb-6 text-center">
          <h3 className="text-2xl font-bold mb-3">¿Listo para simplificar tu gestión?</h3>
          <p className="text-gray-400 mb-6">Empieza gratis hoy. Sin tarjeta de crédito.</p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-indigo-500/50"
            >
              Empezar Gratis
            </Button>
          </Link>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-400">
          <p>© 2026 INMOVA. Todos los derechos reservados.</p>
          <p className="mt-2">Powered by <span className="text-indigo-400 font-semibold">Enxames Investments SL</span></p>
        </div>
      </div>
    </footer>
  );
}
