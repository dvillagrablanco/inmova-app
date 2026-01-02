'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, GraduationCap, BookOpen, Award, Users, Phone, Mail, Calendar } from 'lucide-react';

const escuelas = [
  {
    nombre: 'IE Business School',
    logo: '🎓',
    descripcion: 'Programas de Real Estate Management y PropTech',
    programas: [
      'MBA en Real Estate',
      'Máster en PropTech Innovation',
      'Executive Program Gestión Inmobiliaria',
      'Certificación Property Manager',
    ],
    destacado: true,
  },
  {
    nombre: 'ESADE',
    logo: '🎓',
    descripcion: 'Formación ejecutiva en sector inmobiliario',
    programas: [
      'Programa Superior Real Estate',
      'Gestión de Activos Inmobiliarios',
      'Finanzas Inmobiliarias',
      'Valoración de Inmuebles',
    ],
    destacado: false,
  },
  {
    nombre: 'Universidad Politécnica de Madrid',
    logo: '🎓',
    descripcion: 'Formación técnica y de gestión',
    programas: [
      'Máster en Gestión Inmobiliaria',
      'BIM y Tecnología Construcción',
      'Tasación de Inmuebles',
      'Urbanismo y Planificación',
    ],
    destacado: false,
  },
];

const cursos = [
  {
    titulo: 'Introducción a PropTech',
    duracion: '20 horas',
    nivel: 'Básico',
    precio: 'Gratis para clientes',
  },
  {
    titulo: 'Gestión Profesional de Alquileres',
    duracion: '40 horas',
    nivel: 'Intermedio',
    precio: '€299',
  },
  {
    titulo: 'STR & Revenue Management',
    duracion: '30 horas',
    nivel: 'Avanzado',
    precio: '€499',
  },
  {
    titulo: 'House Flipping & ROI',
    duracion: '25 horas',
    nivel: 'Intermedio',
    precio: '€399',
  },
];

export default function EscuelasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <Link href="/landing" className="inline-flex items-center text-sm text-gray-600 hover:text-purple-600 mb-8">
            ← Volver a inicio
          </Link>

          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
              <GraduationCap className="h-4 w-4 mr-2 inline" />
              Partners Educativos
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Escuelas de Negocios
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Formación especializada en gestión inmobiliaria y PropTech para profesionales
            </p>
          </div>

          {/* Beneficios del programa */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {[
              { icon: Award, title: 'Certificación', desc: 'Títulos oficiales' },
              { icon: Users, title: 'Networking', desc: 'Red de profesionales' },
              { icon: BookOpen, title: 'Casos Reales', desc: 'Metodología práctica' },
              { icon: Calendar, title: 'Flexibilidad', desc: 'Online y presencial' },
            ].map((item, i) => (
              <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-500 p-3 rounded-lg w-fit mx-auto mb-3">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cursos disponibles */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">Cursos Disponibles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cursos.map((curso, i) => (
                <Card key={i} className="hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <Badge className="mb-2 w-fit">{curso.nivel}</Badge>
                    <CardTitle className="text-lg">{curso.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        <strong>Duración:</strong> {curso.duracion}
                      </p>
                      <p className="text-xl font-bold text-purple-600">{curso.precio}</p>
                    </div>
                    <Button variant="outline" className="w-full">
                      Ver Detalles
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Lista de escuelas */}
          <div className="space-y-6 mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">Escuelas Partners</h2>
            {escuelas.map((escuela, i) => (
              <Card
                key={i}
                className={`hover:shadow-xl transition-all ${
                  escuela.destacado ? 'border-2 border-purple-500' : ''
                }`}
              >
                {escuela.destacado && (
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-2 text-sm font-semibold">
                    ⭐ Partner Destacado
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{escuela.logo}</div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{escuela.nombre}</CardTitle>
                      <p className="text-gray-600">{escuela.descripcion}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-3">Programas disponibles:</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {escuela.programas.map((programa, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{programa}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button className="bg-gradient-to-r from-purple-600 to-indigo-600">
                      Ver Programas
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button variant="outline">Solicitar Info</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Descuentos para clientes */}
          <Card className="mb-12 border-2 border-green-300 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-green-500 p-3 rounded-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Descuentos Exclusivos para Clientes Inmova</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>20% descuento en programas ejecutivos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Acceso gratis a cursos introductorios</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Webinars mensuales sin coste</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Impulsa tu Carrera Inmobiliaria</h2>
              <p className="text-lg mb-6 opacity-90">
                Descubre nuestros programas de formación y aprovecha los descuentos exclusivos
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/landing/contacto">
                  <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                    <Mail className="h-5 w-5 mr-2" />
                    Solicitar Información
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
