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
          <Badge className="mb-4 bg-green-100 text-green-700">Guía Práctica</Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Guía Completa de Coliving en España 2026
          </h1>
          
          <div className="flex items-center gap-6 text-gray-600 mb-8 pb-8 border-b">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span>Carlos Ruiz</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>5 Enero 2026</span>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="lead text-xl text-gray-600 mb-8">
              El coliving se ha consolidado como uno de los modelos de negocio inmobiliario 
              con mayor crecimiento en España. Esta guía te explica todo lo que necesitas 
              saber para gestionar un espacio de coliving de forma profesional.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              ¿Qué es el Coliving?
            </h2>
            <p className="text-gray-700 mb-4">
              El coliving es un modelo de alojamiento donde los residentes comparten espacios 
              comunes (cocina, salón, zonas de trabajo) mientras mantienen habitaciones privadas. 
              Va más allá del simple alquiler de habitaciones: incluye servicios, comunidad y 
              flexibilidad.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Marco Legal en España
            </h2>
            <p className="text-gray-700 mb-4">
              A diferencia del alquiler tradicional regulado por la LAU, el coliving se considera 
              "alojamiento con servicios" y tiene mayor flexibilidad contractual:
            </p>
            <ul className="text-gray-700 mb-4 list-disc pl-6">
              <li>Contratos de prestación de servicios (no LAU)</li>
              <li>Estancias mínimas de 32 días para evitar licencia turística</li>
              <li>IVA aplicable al 10% (hospedaje) o 21% según servicios</li>
              <li>Depósitos y fianzas con mayor libertad</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Gestión de Suministros y Gastos Comunes
            </h2>
            <p className="text-gray-700 mb-4">
              Uno de los mayores retos del coliving es el prorrateo justo de gastos. 
              Los métodos más comunes son:
            </p>
            <ul className="text-gray-700 mb-4 list-disc pl-6">
              <li><strong>Por habitación:</strong> División igualitaria entre residentes</li>
              <li><strong>Por metros cuadrados:</strong> Proporcional al espacio privado</li>
              <li><strong>Por consumo:</strong> Con subcontadores individuales</li>
              <li><strong>Tarifa fija:</strong> Todo incluido en la renta mensual</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Consejo:</strong> INMOVA automatiza el prorrateo de gastos con su módulo 
              de Coliving, calculando automáticamente las facturas individuales según el método 
              que prefieras.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Servicios que Marcan la Diferencia
            </h2>
            <p className="text-gray-700 mb-4">
              Los espacios de coliving premium ofrecen servicios que justifican precios 
              un 20-40% superiores al alquiler tradicional:
            </p>
            <ul className="text-gray-700 mb-4 list-disc pl-6">
              <li>Limpieza de zonas comunes (2-3 veces por semana)</li>
              <li>WiFi de alta velocidad (mínimo 300 Mbps)</li>
              <li>Gestión de paquetería</li>
              <li>Eventos comunitarios</li>
              <li>Coworking integrado</li>
              <li>Gimnasio o wellness</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Perfil del Residente Tipo
            </h2>
            <p className="text-gray-700 mb-4">
              Conocer a tu público objetivo es clave para el éxito:
            </p>
            <div className="bg-gray-100 rounded-xl p-6 my-4">
              <ul className="space-y-2 text-gray-700">
                <li>🎯 <strong>Nómadas digitales:</strong> 25-40 años, trabajo remoto, estancias 1-6 meses</li>
                <li>👩‍💼 <strong>Jóvenes profesionales:</strong> 22-35 años, primer empleo en ciudad</li>
                <li>🎓 <strong>Estudiantes de postgrado:</strong> Másters internacionales, 9-12 meses</li>
                <li>🌍 <strong>Expatriados:</strong> Profesionales en movilidad, 3-12 meses</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Rentabilidad del Modelo
            </h2>
            <p className="text-gray-700 mb-4">
              Un piso de 3 habitaciones puede generar hasta un 40% más de rentabilidad 
              en modelo coliving vs. alquiler tradicional:
            </p>
            <div className="bg-gray-100 rounded-xl p-6 my-4">
              <table className="w-full text-gray-700">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Modelo</th>
                    <th className="text-right py-2">Ingresos/mes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Alquiler tradicional</td>
                    <td className="text-right">€1.200</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Coliving (3 hab x €600)</td>
                    <td className="text-right">€1.800</td>
                  </tr>
                  <tr className="font-bold">
                    <td className="py-2">Diferencia</td>
                    <td className="text-right text-green-600">+50%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Herramientas de Gestión
            </h2>
            <p className="text-gray-700 mb-4">
              Gestionar un coliving manualmente es inviable a escala. Necesitas:
            </p>
            <ul className="text-gray-700 mb-4 list-disc pl-6">
              <li>Sistema de reservas y check-in/out</li>
              <li>Portal de residentes</li>
              <li>Prorrateo automático de gastos</li>
              <li>Gestión de incidencias</li>
              <li>Comunicación con inquilinos</li>
              <li>Facturación y cobros</li>
            </ul>

            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl p-8 mt-12">
              <h3 className="text-2xl font-bold mb-4">
                INMOVA: Todo lo que necesitas para gestionar Coliving
              </h3>
              <p className="mb-6 opacity-90">
                Nuestro módulo de Coliving incluye prorrateo automático de suministros, 
                contratos flexibles, portal de residentes y mucho más.
              </p>
              <Link href="/register">
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 font-bold">
                  Probar Gratis 30 Días
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
