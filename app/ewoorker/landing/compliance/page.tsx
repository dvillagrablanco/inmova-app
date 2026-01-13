'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Upload,
  Users,
  Building2,
  FileText,
  ArrowRight,
  Hammer,
  Scale
} from 'lucide-react';

const requisitosCumplimiento = [
  {
    titulo: 'Libro de Subcontratación',
    descripcion: 'Registro obligatorio de todas las subcontrataciones con firma digital',
    icon: FileText,
    obligatorio: true,
  },
  {
    titulo: 'Registro REA',
    descripcion: 'Verificación automática del Registro de Empresas Acreditadas',
    icon: Building2,
    obligatorio: true,
  },
  {
    titulo: 'TC1/TC2 Vigentes',
    descripcion: 'Control de documentación de Seguridad Social actualizada',
    icon: FileCheck,
    obligatorio: true,
  },
  {
    titulo: 'Seguro RC',
    descripcion: 'Validación de pólizas de Responsabilidad Civil',
    icon: Shield,
    obligatorio: true,
  },
  {
    titulo: 'Plan de Seguridad',
    descripcion: 'Documentación de prevención de riesgos laborales',
    icon: AlertTriangle,
    obligatorio: true,
  },
  {
    titulo: 'Certificados PRL',
    descripcion: 'Formación en prevención de riesgos para trabajadores',
    icon: Users,
    obligatorio: true,
  },
];

const beneficios = [
  {
    titulo: 'Evita sanciones',
    descripcion: 'Multas de hasta €10.000 por incumplimientos',
    valor: '€10K+',
    icon: Scale,
  },
  {
    titulo: 'OCR Automático',
    descripcion: 'Lectura de documentos y fechas de caducidad',
    valor: '95%',
    icon: FileCheck,
  },
  {
    titulo: 'Alertas proactivas',
    descripcion: 'Notificaciones antes de que caduque la documentación',
    valor: '30 días',
    icon: Clock,
  },
  {
    titulo: 'Verificación REA',
    descripcion: 'Consulta automática al registro oficial',
    valor: 'Real-time',
    icon: CheckCircle2,
  },
];

export default function ComplianceLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/ewoorker/landing" className="flex items-center gap-3">
              <Hammer className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                eWoorker
              </span>
            </Link>
            <div className="flex gap-4">
              <Link href="/ewoorker/landing">
                <Button variant="ghost">Inicio</Button>
              </Link>
              <Link href="/ewoorker/login">
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                  Acceder
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 px-4 py-2">
              <Shield className="h-4 w-4 mr-1 inline" />
              Ley 32/2006
            </Badge>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Compliance Hub
              </span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Gestión automática del cumplimiento de la Ley de Subcontratación. 
              Libro de subcontratación digital, verificación REA y alertas de caducidad.
            </p>
          </div>
        </div>
      </section>

      {/* REQUISITOS */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
            Requisitos de la Ley 32/2006
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            El Compliance Hub de eWoorker gestiona automáticamente todos los requisitos legales
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requisitosCumplimiento.map((req, i) => (
              <Card key={i} className="border-2 hover:border-orange-300 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <req.icon className="h-5 w-5 text-orange-600" />
                    </div>
                    <CardTitle className="text-lg">{req.titulo}</CardTitle>
                    {req.obligatorio && (
                      <Badge variant="destructive" className="ml-auto text-xs">
                        Obligatorio
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{req.descripcion}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Beneficios del Compliance Hub
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beneficios.map((ben, i) => (
              <Card key={i} className="text-center border-2">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                    <ben.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-black text-orange-600 mb-2">{ben.valor}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{ben.titulo}</h3>
                  <p className="text-sm text-gray-600">{ben.descripcion}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SEMÁFORO */}
      <section className="py-16 px-4 bg-gradient-to-r from-orange-600 to-amber-500">
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Sistema de Semáforo</h2>
          <p className="text-xl mb-8 opacity-90">
            Visualiza el estado de cumplimiento de todas tus subcontratas de un vistazo
          </p>
          
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <p className="font-semibold">Cumple</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <p className="font-semibold">Por caducar</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <p className="font-semibold">Incumple</p>
            </div>
          </div>
          
          <Link href="/ewoorker/registro">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 font-bold">
              Empezar Ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            ¿Listo para automatizar tu compliance?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Únete a más de 2.500 empresas que ya gestionan su cumplimiento con eWoorker
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ewoorker/registro">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold">
                Crear Cuenta Gratis
              </Button>
            </Link>
            <Link href="/landing/contacto">
              <Button size="lg" variant="outline" className="border-2">
                Solicitar Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-gray-400">
            © 2026 eWoorker by INMOVA. Todos los derechos reservados.
          </p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <Link href="/landing/legal/privacidad" className="text-gray-400 hover:text-white">
              Privacidad
            </Link>
            <Link href="/landing/legal/terminos" className="text-gray-400 hover:text-white">
              Términos
            </Link>
            <Link href="/landing/contacto" className="text-gray-400 hover:text-white">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
