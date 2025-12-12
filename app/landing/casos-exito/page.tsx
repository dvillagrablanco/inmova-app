'use client';
export const dynamic = 'force-dynamic';


import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, Users, DollarSign, Star } from 'lucide-react';

export default function CasosExitoPage() {
  const casos = [
    {
      empresa: 'Inmobiliaria MGonzalez',
      sector: 'Alquiler Residencial',
      propiedades: 150,
      mejora: '+35% ROI',
      testimonio:
        'INMOVA nos permitió centralizar toda nuestra operación. Antes usábamos 6 herramientas diferentes, ahora todo está en una sola plataforma.',
      logo: '🏢',
    },
    {
      empresa: 'Barcelona STR Properties',
      sector: 'Short-Term Rental',
      propiedades: 80,
      mejora: '+50% Ocupación',
      testimonio:
        'El channel manager nativo y el pricing dinámico aumentaron nuestra ocupación del 65% al 98% en solo 3 meses.',
      logo: '🏨',
    },
    {
      empresa: 'Inversiones Coliving Madrid',
      sector: 'Coliving',
      propiedades: 25,
      mejora: '-70% Costes',
      testimonio:
        'La gestión por habitaciones con prorrateo automático nos ahorró 40 horas mensuales y €3,000 en software.',
      logo: '👥',
    },
  ];

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
            <Link href="/landing">
              <Button>Volver a Inicio</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4">Casos de Éxito</Badge>
            <h1 className="text-5xl font-bold mb-4">Historias Reales de Transformación</h1>
            <p className="text-xl text-gray-600">
              Descubre cómo empresas como la tuya han revolucionado su negocio con INMOVA
            </p>
          </div>

          <div className="space-y-8">
            {casos.map((caso, i) => (
              <Card key={i} className="border-2 hover:shadow-2xl transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{caso.logo}</div>
                      <div>
                        <CardTitle className="text-2xl">{caso.empresa}</CardTitle>
                        <CardDescription className="text-base">{caso.sector}</CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-green-500 text-white">{caso.mejora}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                      <span className="font-semibold">{caso.propiedades} Propiedades</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-semibold">Crecimiento Acelerado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="font-semibold">Cliente Satisfecho</span>
                    </div>
                  </div>
                  <blockquote className="border-l-4 border-indigo-600 pl-4 italic text-gray-700">
                    "{caso.testimonio}"
                  </blockquote>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold mb-6">¿Quieres ser el Próximo Caso de Éxito?</h2>
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600">
                Comenzar Ahora
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
