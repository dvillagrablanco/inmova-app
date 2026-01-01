'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CreditCard, Globe, Hotel, MessageSquare, FileText, Shield, LinkIcon } from 'lucide-react';

const integrations = [
  {
    icon: CreditCard,
    title: 'Pagos y Finanzas',
    desc: 'Procesa pagos de forma segura',
    gradient: 'from-green-500 to-emerald-500',
    items: [
      { name: 'Stripe', desc: 'Pagos recurrentes y one-time' },
      { name: 'Open Banking', desc: 'Verificación de ingresos' },
      { name: 'Zucchetti', desc: 'Integración ERP/contabilidad' },
    ]
  },
  {
    icon: Globe,
    title: 'Portales Inmobiliarios',
    desc: 'Publicación automática',
    gradient: 'from-blue-500 to-indigo-500',
    items: [
      { name: 'Portales Inmobiliarios', desc: 'Sincronización automática' },
      { name: 'Redes Sociales', desc: 'Publicación optimizada' },
      { name: 'Habitaclia', desc: 'Multi-publicación' },
    ]
  },
  {
    icon: Hotel,
    title: 'Short-Term Rental',
    desc: 'Channel Manager nativo',
    gradient: 'from-pink-500 to-rose-500',
    items: [
      { name: 'Airbnb', desc: 'Sincronización calendario' },
      { name: 'Booking.com', desc: 'Gestión reservas' },
      { name: 'VRBO', desc: 'Pricing dinámico' },
    ]
  },
  {
    icon: MessageSquare,
    title: 'Comunicación',
    desc: 'Centraliza conversaciones',
    gradient: 'from-violet-500 to-purple-500',
    items: [
      { name: 'WhatsApp', desc: 'Chat integrado' },
      { name: 'Email', desc: 'Notificaciones automáticas' },
      { name: 'SMS', desc: 'Recordatorios y alertas' },
    ]
  },
  {
    icon: FileText,
    title: 'Firma Digital',
    desc: 'Contratos y documentos',
    gradient: 'from-amber-500 to-yellow-500',
    items: [
      { name: 'Signaturit', desc: 'Firma electrónica certificada' },
      { name: 'DocuSign', desc: 'Flujos de firma múltiples' },
      { name: 'Autoridad Certificadora', desc: 'Sello de tiempo' },
    ]
  },
  {
    icon: Shield,
    title: 'Seguridad',
    desc: 'Protección de datos',
    gradient: 'from-red-500 to-orange-500',
    items: [
      { name: 'Biometría', desc: 'Autenticación facial/huella' },
      { name: 'GDPR', desc: 'Cumplimiento normativo' },
      { name: 'SOC2/ISO27001', desc: 'Auditorías de seguridad' },
    ]
  },
];

export function IntegrationsSection() {
  return (
    <section id="integraciones" className="py-20 px-4 bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 px-4 py-2">
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
