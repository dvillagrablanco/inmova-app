'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Shield, Home, Users, Euro, Phone, Mail } from 'lucide-react';

const aseguradoras = [
  {
    nombre: 'Mapfre',
    logo: '🛡️',
    descripcion: 'Seguros de hogar y alquiler con coberturas premium',
    beneficios: [
      '15% descuento para clientes Inmova',
      'Cobertura multirriesgo completa',
      'Impago de alquiler incluido',
      'Asistencia 24/7',
    ],
    destacado: true,
  },
  {
    nombre: 'Generali',
    logo: '🛡️',
    descripcion: 'Protección integral para propietarios',
    beneficios: [
      'Sin carencias en impagos',
      'Cobertura de daños inquilino',
      'Defensa jurídica incluida',
      'Gestión digital completa',
    ],
    destacado: false,
  },
  {
    nombre: 'AXA',
    logo: '🛡️',
    descripcion: 'Seguros especializados en inmuebles de inversión',
    beneficios: [
      'Pólizas multi-propiedad',
      'Cobertura vacacional STR',
      'Responsabilidad civil ampliada',
      'Franquicia reducida',
    ],
    destacado: false,
  },
];

export default function AseguradorasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <Link href="/landing" className="inline-flex items-center text-sm text-gray-600 hover:text-green-600 mb-8">
            ← Volver a inicio
          </Link>

          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">
              <Shield className="h-4 w-4 mr-2 inline" />
              Partners Aseguradoras
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Aseguradoras de Confianza
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Protege tu patrimonio inmobiliario con las mejores condiciones del mercado
            </p>
          </div>

          {/* Beneficios del programa */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {[
              { icon: Euro, title: 'Hasta 15% Dto', desc: 'Descuento exclusivo' },
              { icon: Shield, title: 'Coberturas Premium', desc: 'Protección completa' },
              { icon: Home, title: 'Multi-Propiedad', desc: 'Gestión centralizada' },
              { icon: Users, title: 'Sin Franquicia', desc: 'En muchos casos' },
            ].map((item, i) => (
              <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-lg w-fit mx-auto mb-3">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tipos de seguros */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                titulo: 'Seguro de Hogar',
                desc: 'Protección completa del inmueble',
                items: ['Daños estructurales', 'Contenido', 'Responsabilidad civil', 'Fenómenos naturales'],
              },
              {
                titulo: 'Seguro de Impago',
                desc: 'Protección contra morosidad',
                items: ['Impago de alquiler', 'Defensa jurídica', 'Desahucio express', 'Daños inquilino'],
              },
              {
                titulo: 'Seguro STR/Vacacional',
                desc: 'Específico para alquiler turístico',
                items: ['Cancelaciones', 'Daños huéspedes', 'RC ampliada', 'Robo contenido'],
              },
            ].map((tipo, i) => (
              <Card key={i} className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{tipo.titulo}</CardTitle>
                  <p className="text-sm text-gray-600">{tipo.desc}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tipo.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Lista de aseguradoras */}
          <div className="space-y-6 mb-12">
            {aseguradoras.map((aseguradora, i) => (
              <Card
                key={i}
                className={`hover:shadow-xl transition-all ${
                  aseguradora.destacado ? 'border-2 border-green-500' : ''
                }`}
              >
                {aseguradora.destacado && (
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center py-2 text-sm font-semibold">
                    ⭐ Partner Destacado
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{aseguradora.logo}</div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{aseguradora.nombre}</CardTitle>
                      <p className="text-gray-600">{aseguradora.descripcion}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3 mb-6">
                    {aseguradora.beneficios.map((beneficio, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{beneficio}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-600">
                    Solicitar Cotización
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Protege tu Inversión Inmobiliaria</h2>
              <p className="text-lg mb-6 opacity-90">
                Solicita una cotización personalizada sin compromiso
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/landing/contacto">
                  <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                    <Mail className="h-5 w-5 mr-2" />
                    Solicitar Cotización
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
