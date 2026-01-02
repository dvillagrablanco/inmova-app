'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Landmark, Shield, TrendingUp, Users, Phone, Mail } from 'lucide-react';

const bancos = [
  {
    nombre: 'Banco Santander',
    logo: '🏦',
    descripcion: 'Hipotecas preferenciales para clientes Inmova',
    beneficios: [
      'Hasta 0.5% menos en tipo de interés',
      'Tasación gratuita',
      'Sin comisión de apertura',
      'Proceso acelerado 15 días',
    ],
    destacado: true,
  },
  {
    nombre: 'BBVA',
    logo: '🏦',
    descripcion: 'Financiación para inversión inmobiliaria',
    beneficios: [
      'Financiación hasta 80% LTV',
      'Productos para flipping',
      'Líneas de crédito flexibles',
      'Gestor dedicado',
    ],
    destacado: false,
  },
  {
    nombre: 'CaixaBank',
    logo: '🏦',
    descripcion: 'Soluciones hipotecarias integrales',
    beneficios: [
      'Hipoteca joven con ventajas',
      'Seguro de hogar incluido',
      'Domiciliación de nómina bonificada',
      'App de gestión',
    ],
    destacado: false,
  },
];

export default function BancosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <Link href="/landing" className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 mb-8">
            ← Volver a inicio
          </Link>

          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
              <Landmark className="h-4 w-4 mr-2 inline" />
              Partners Financieros
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Bancos Hipotecarios
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Accede a condiciones preferenciales y financiación especializada para tu negocio inmobiliario
            </p>
          </div>

          {/* Beneficios del programa */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {[
              { icon: TrendingUp, title: 'Mejores Tipos', desc: 'Hasta 0.5% menos' },
              { icon: Shield, title: 'Sin Comisiones', desc: 'Apertura gratuita' },
              { icon: Users, title: 'Gestor Dedicado', desc: 'Atención personalizada' },
              { icon: CheckCircle, title: 'Proceso Rápido', desc: 'Aprobación 15 días' },
            ].map((item, i) => (
              <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-3 rounded-lg w-fit mx-auto mb-3">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Lista de bancos */}
          <div className="space-y-6 mb-12">
            {bancos.map((banco, i) => (
              <Card
                key={i}
                className={`hover:shadow-xl transition-all ${
                  banco.destacado ? 'border-2 border-blue-500' : ''
                }`}
              >
                {banco.destacado && (
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-2 text-sm font-semibold">
                    ⭐ Partner Destacado
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{banco.logo}</div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{banco.nombre}</CardTitle>
                      <p className="text-gray-600">{banco.descripcion}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3 mb-6">
                    {banco.beneficios.map((beneficio, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{beneficio}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600">
                    Solicitar Información
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">¿Listo para Mejorar tu Financiación?</h2>
              <p className="text-lg mb-6 opacity-90">
                Contacta con nuestro equipo y te conectamos con el banco ideal para tu proyecto
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/landing/contacto">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                    <Mail className="h-5 w-5 mr-2" />
                    Contactar Ahora
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                  <Phone className="h-5 w-5 mr-2" />
                  +34 900 123 456
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
