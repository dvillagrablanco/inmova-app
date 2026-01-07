'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CreditCard, Globe, Hotel, MessageSquare, FileText, Shield, LinkIcon } from 'lucide-react';

const integrations = [
  {
    icon: CreditCard,
    title: 'Pagos',
    desc: 'Cobros automáticos y seguros',
    gradient: 'from-green-500 to-emerald-500',
    items: [
      { name: 'Stripe', desc: 'Pagos con tarjeta' },
      { name: 'Transferencias', desc: 'Seguimiento automático' },
      { name: 'Recibos', desc: 'Generación automática' },
    ]
  },
  {
    icon: Globe,
    title: 'Publicación',
    desc: 'Publica en múltiples portales',
    gradient: 'from-blue-500 to-indigo-500',
    items: [
      { name: 'Portales', desc: 'Idealista, Fotocasa...' },
      { name: 'Web propia', desc: 'Exportación de datos' },
      { name: 'Calendario', desc: 'Google Calendar, Outlook' },
    ]
  },
  {
    icon: MessageSquare,
    title: 'Comunicación',
    desc: 'Mantén el contacto',
    gradient: 'from-violet-500 to-purple-500',
    items: [
      { name: 'Email', desc: 'Notificaciones automáticas' },
      { name: 'SMS', desc: 'Recordatorios de pago' },
      { name: 'Chat', desc: 'Comunicación con inquilinos' },
    ]
  },
  {
    icon: FileText,
    title: 'Documentos',
    desc: 'Gestión documental',
    gradient: 'from-amber-500 to-yellow-500',
    items: [
      { name: 'Contratos', desc: 'Plantillas legales LAU' },
      { name: 'Firma digital', desc: 'Signaturit integrado' },
      { name: 'Almacenamiento', desc: 'Documentos en la nube' },
    ]
  },
  {
    icon: Shield,
    title: 'Seguridad',
    desc: 'Tus datos protegidos',
    gradient: 'from-red-500 to-orange-500',
    items: [
      { name: 'Encriptación', desc: 'Datos cifrados' },
      { name: 'GDPR', desc: 'Cumplimiento europeo' },
      { name: 'Backups', desc: 'Copias automáticas' },
    ]
  },
  {
    icon: Hotel,
    title: 'Vacacional',
    desc: 'Para alquiler turístico',
    gradient: 'from-pink-500 to-rose-500',
    items: [
      { name: 'Airbnb', desc: 'Sincronización' },
      { name: 'Booking', desc: 'Gestión reservas' },
      { name: 'iCal', desc: 'Calendario unificado' },
    ]
  },
];

export function IntegrationsSection() {
  return (
    <section id="integraciones" className="py-20 px-4 bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-900 border-purple-300 px-4 py-2 font-bold">
            <LinkIcon className="h-4 w-4 mr-1 inline" />
            Integraciones
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Conecta con tus Herramientas Favoritas
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            INMOVA se integra perfectamente con las principales plataformas del sector inmobiliario y financiero
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {integrations.map((integration, i) => (
            <Card key={i} className="group hover:shadow-2xl transition-all border-2">
              <CardHeader>
                <div className={`p-3 bg-gradient-to-br ${integration.gradient} rounded-xl w-fit mb-3`}>
                  <integration.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{integration.title}</CardTitle>
                <CardDescription>{integration.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {integration.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <strong>{item.name}:</strong> {item.desc}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
