'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Key, 
  CreditCard, 
  MessageCircle, 
  FileText, 
  Wrench,
  Bell,
  CheckCircle2,
  ArrowRight,
  Smartphone,
} from 'lucide-react';

const beneficios = [
  {
    icon: CreditCard,
    titulo: 'Pago Fácil',
    descripcion: 'Paga tu alquiler con un clic. Domiciliación, tarjeta o transferencia.',
  },
  {
    icon: MessageCircle,
    titulo: 'Chat Directo',
    descripcion: 'Comunícate con tu propietario o gestor de forma rápida y documentada.',
  },
  {
    icon: Wrench,
    titulo: 'Incidencias',
    descripcion: 'Reporta averías y sigue el estado de la reparación en tiempo real.',
  },
  {
    icon: FileText,
    titulo: 'Documentos',
    descripcion: 'Accede a tu contrato, recibos y todos tus documentos cuando lo necesites.',
  },
  {
    icon: Bell,
    titulo: 'Recordatorios',
    descripcion: 'Nunca olvides un pago con notificaciones antes del vencimiento.',
  },
  {
    icon: Smartphone,
    titulo: 'App Móvil',
    descripcion: 'Gestiona todo desde tu móvil, estés donde estés.',
  },
];

export default function InquilinosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-2 mb-4">
              <Key className="w-8 h-8" />
              <span className="text-green-200 font-medium">Para Inquilinos</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Tu alquiler, bajo control
            </h1>
            <p className="text-xl text-green-100 mb-8">
              Paga fácilmente, comunícate con tu propietario y reporta incidencias desde una sola app.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="text-green-600">
                  Registrarse Gratis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 -mt-10">
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center p-6">
            <p className="text-3xl font-bold text-green-600">100%</p>
            <p className="text-gray-600 text-sm">Gratis</p>
          </Card>
          <Card className="text-center p-6">
            <p className="text-3xl font-bold text-green-600">24h</p>
            <p className="text-gray-600 text-sm">Respuesta media</p>
          </Card>
          <Card className="text-center p-6">
            <p className="text-3xl font-bold text-green-600">App</p>
            <p className="text-gray-600 text-sm">iOS y Android</p>
          </Card>
        </div>
      </div>

      {/* Beneficios */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Todo lo que necesitas como inquilino
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {beneficios.map((b, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <b.icon className="w-10 h-10 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{b.titulo}</h3>
                <p className="text-gray-600">{b.descripcion}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-green-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Simplifica tu vida como inquilino
          </h2>
          <p className="text-green-100 mb-8">
            Registro gratuito. Sin compromisos.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Crear Cuenta Gratis
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
