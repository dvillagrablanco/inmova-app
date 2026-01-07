'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, User, ArrowLeft } from 'lucide-react';

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
          <Badge className="mb-4 bg-purple-100 text-purple-700">Tecnología</Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Cómo la IA Está Cambiando la Gestión de Propiedades
          </h1>
          
          <div className="flex items-center gap-6 text-gray-600 mb-8 pb-8 border-b">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span>María González</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>10 Enero 2026</span>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="lead text-xl text-gray-600 mb-8">
              La inteligencia artificial ya no es ciencia ficción en el sector inmobiliario. 
              Descubre cómo los gestores de propiedades están aumentando su ROI hasta un 25% 
              gracias a estas tecnologías.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Valoración Automática de Propiedades
            </h2>
            <p className="text-gray-700 mb-4">
              Los sistemas de valoración basados en IA analizan miles de variables en segundos: 
              precios de mercado, tendencias del barrio, características del inmueble, y datos 
              socioeconómicos. El resultado es una estimación precisa que antes requería horas 
              de trabajo manual.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Caso real:</strong> Un gestor de Barcelona utilizó nuestra herramienta de 
              valoración IA para ajustar los precios de 50 propiedades. El resultado fue un 
              aumento del 15% en los ingresos por alquiler sin incrementar la tasa de vacantes.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Chatbots para Atención al Inquilino 24/7
            </h2>
            <p className="text-gray-700 mb-4">
              Los asistentes virtuales pueden resolver el 80% de las consultas habituales: 
              estados de cuenta, solicitudes de mantenimiento, información de contratos, etc. 
              Esto libera al equipo para tareas de mayor valor añadido.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Predicción de Morosidad
            </h2>
            <p className="text-gray-700 mb-4">
              Los algoritmos de machine learning pueden identificar señales tempranas de 
              problemas de pago analizando patrones de comportamiento. Esto permite actuar 
              proactivamente antes de que la situación se deteriore.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Optimización de Precios Dinámicos
            </h2>
            <p className="text-gray-700 mb-4">
              Al igual que las aerolíneas y hoteles, la IA permite ajustar precios en 
              tiempo real según la demanda, la temporada, y las condiciones del mercado. 
              Especialmente útil para alquiler vacacional y coliving.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Mantenimiento Predictivo
            </h2>
            <p className="text-gray-700 mb-4">
              Combinando datos de sensores IoT con algoritmos de IA, es posible predecir 
              cuándo un equipo va a fallar antes de que ocurra. Esto reduce costes de 
              reparación de emergencia hasta un 40%.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Generación Automática de Documentos
            </h2>
            <p className="text-gray-700 mb-4">
              La IA puede generar contratos, informes de estado, y comunicaciones 
              personalizadas automáticamente. Lo que antes tomaba horas, ahora se 
              completa en segundos con total precisión legal.
            </p>

            <div className="bg-gray-100 rounded-xl p-6 my-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Resultados típicos con IA en INMOVA:
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>📈 <strong>+25%</strong> aumento en ROI de propiedades</li>
                <li>⏱️ <strong>-60%</strong> tiempo en tareas administrativas</li>
                <li>💰 <strong>-40%</strong> reducción de costes de mantenimiento</li>
                <li>😊 <strong>+35%</strong> satisfacción de inquilinos</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl p-8 mt-12">
              <h3 className="text-2xl font-bold mb-4">
                Implementa IA en tu gestión inmobiliaria
              </h3>
              <p className="mb-6 opacity-90">
                INMOVA incluye todas estas funcionalidades de IA en sus planes. 
                Empieza hoy y transforma tu negocio.
              </p>
              <Link href="/register">
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 font-bold">
                  Empezar Prueba Gratuita
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
