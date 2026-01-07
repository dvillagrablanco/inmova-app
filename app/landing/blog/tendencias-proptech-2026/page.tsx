'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, User, ArrowLeft, Share2 } from 'lucide-react';

export default function BlogPostPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/landing" className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                INMOVA
              </span>
            </Link>
            <Link href="/landing/blog">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Blog
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <article className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <Badge className="mb-4 bg-indigo-100 text-indigo-700">Tendencias</Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            7 Tendencias PropTech que Transformarán el Sector en 2026
          </h1>
          
          <div className="flex items-center gap-6 text-gray-600 mb-8 pb-8 border-b">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span>Equipo INMOVA</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>15 Enero 2026</span>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="lead text-xl text-gray-600 mb-8">
              El sector inmobiliario está experimentando una transformación digital sin precedentes. 
              En INMOVA, analizamos las 7 tendencias PropTech que definirán el 2026.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              1. Inteligencia Artificial para Valoración de Propiedades
            </h2>
            <p className="text-gray-700 mb-4">
              Los algoritmos de IA están alcanzando niveles de precisión del 95% en la valoración 
              automática de propiedades, considerando factores como ubicación, tendencias del mercado, 
              y características específicas del inmueble. En INMOVA, nuestra herramienta de valoración 
              IA ya está disponible para todos los planes.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              2. Tours Virtuales 360° y Realidad Aumentada
            </h2>
            <p className="text-gray-700 mb-4">
              El 78% de los inquilinos prefiere ver tours virtuales antes de una visita presencial. 
              Las plataformas que ofrecen experiencias inmersivas están viendo un aumento del 40% 
              en las conversiones de leads a contratos.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              3. Automatización de la Gestión de Propiedades
            </h2>
            <p className="text-gray-700 mb-4">
              Desde la facturación automática hasta la coordinación de mantenimiento, la automatización 
              permite a los gestores manejar hasta 5 veces más propiedades con el mismo equipo. 
              Los pagos automáticos y las notificaciones inteligentes reducen la morosidad en un 60%.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              4. IoT y Smart Buildings
            </h2>
            <p className="text-gray-700 mb-4">
              Los sensores conectados permiten monitorizar consumos energéticos, detectar fugas de agua 
              y optimizar el mantenimiento preventivo. Los edificios inteligentes reducen costes 
              operativos hasta un 30%.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              5. Blockchain y Tokenización Inmobiliaria
            </h2>
            <p className="text-gray-700 mb-4">
              La tokenización permite fraccionar propiedades en participaciones digitales, 
              democratizando la inversión inmobiliaria. Los contratos inteligentes automatizan 
              el reparto de rendimientos y la gobernanza de los activos.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              6. ESG y Sostenibilidad Digital
            </h2>
            <p className="text-gray-700 mb-4">
              Las regulaciones europeas exigen cada vez más reportes de sostenibilidad. 
              Las plataformas PropTech que automatizan la medición de huella de carbono y 
              eficiencia energética serán indispensables para cumplir con la normativa.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              7. Plataformas Multi-Vertical
            </h2>
            <p className="text-gray-700 mb-4">
              La fragmentación del mercado está dando paso a plataformas integradas que 
              gestionan múltiples modelos de negocio: alquiler tradicional, coliving, 
              vacacional, house flipping y más. INMOVA lidera esta tendencia con 7 verticales 
              y 15 módulos transversales en una única solución.
            </p>

            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl p-8 mt-12">
              <h3 className="text-2xl font-bold mb-4">
                ¿Listo para el futuro del PropTech?
              </h3>
              <p className="mb-6 opacity-90">
                Descubre cómo INMOVA puede ayudarte a implementar estas tendencias en tu negocio.
              </p>
              <Link href="/register">
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 font-bold">
                  Prueba Gratis 30 Días
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </article>

      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-gray-400">
            © 2026 INMOVA. Powered by Enxames Investments SL. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
