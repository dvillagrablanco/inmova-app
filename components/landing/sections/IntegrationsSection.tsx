'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CreditCard, Globe, Hotel, MessageSquare, FileText, Shield, LinkIcon, Bot } from 'lucide-react';

const integrations = [
  {
    icon: Bot,
    title: 'Centro de Ayuda con IA',
    desc: 'Soporte inteligente 24/7 con respuestas contextuales',
    gradient: 'from-teal-500 to-cyan-500',
    items: [
      { name: 'Centro de Ayuda con IA', desc: 'Base de conocimiento con búsqueda semántica' },
      { name: 'Chatbot contextual', desc: 'Asistente que entiende el contexto de tu consulta' },
      { name: 'Respuestas instantáneas', desc: 'Soporte 24/7 sin esperas' },
    ]
  },
  {
    icon: CreditCard,
    title: 'Cobros y Pagos',
    desc: 'Automatiza la gestión financiera de tus alquileres',
    gradient: 'from-green-500 to-emerald-500',
    items: [
      { name: 'Cobros automáticos', desc: 'Cobro automático con tarjeta y SEPA' },
      { name: 'Conciliación', desc: 'Seguimiento de transferencias bancarias' },
      { name: 'Facturación', desc: 'Recibos y facturas generados al instante' },
    ]
  },
  {
    icon: Globe,
    title: 'Portales y Calendario',
    desc: 'Publica propiedades y sincroniza tu agenda',
    gradient: 'from-blue-500 to-indigo-500',
    items: [
      { name: 'Portales inmobiliarios', desc: 'Publicación directa en portales' },
      { name: 'Calendario integrado', desc: 'Visitas y vencimientos sincronizados' },
      { name: 'Herramientas de productividad', desc: 'Integración con correo corporativo' },
    ]
  },
  {
    icon: MessageSquare,
    title: 'Comunicación',
    desc: 'Notificaciones multicanal con inquilinos y propietarios',
    gradient: 'from-violet-500 to-purple-500',
    items: [
      { name: 'Email automático', desc: 'Alertas de pago, vencimientos y avisos' },
      { name: 'SMS', desc: 'Recordatorios urgentes de cobro' },
      { name: 'Chat integrado', desc: 'Comunicación directa sin salir de la app' },
    ]
  },
  {
    icon: FileText,
    title: 'Contratos y Firma Digital',
    desc: 'Genera, firma y almacena contratos con validez legal',
    gradient: 'from-amber-500 to-yellow-500',
    items: [
      { name: 'Plantillas LAU', desc: 'Contratos conformes a normativa vigente' },
      { name: 'Firma digital', desc: 'Firma digital con plena validez jurídica' },
      { name: 'Almacenamiento', desc: 'Documentos organizados en la nube' },
    ]
  },
  {
    icon: Shield,
    title: 'Seguridad y Cumplimiento',
    desc: 'Tus datos protegidos con estándares bancarios',
    gradient: 'from-red-500 to-orange-500',
    items: [
      { name: 'Encriptación AES-256', desc: 'Cifrado de nivel bancario' },
      { name: 'GDPR Compliant', desc: 'Servidores 100% en la Unión Europea' },
      { name: 'Backups diarios', desc: 'Copias de seguridad automáticas' },
    ]
  },
  {
    icon: Hotel,
    title: 'Channel Manager STR',
    desc: 'Sincroniza calendarios y reservas de alquiler vacacional',
    gradient: 'from-pink-500 to-rose-500',
    items: [
      { name: 'Channel manager', desc: 'Sincronización bidireccional' },
      { name: 'Reservas centralizadas', desc: 'Gestión centralizada de reservas' },
      { name: 'Calendario unificado', desc: 'Calendario unificado sin reservas duplicadas' },
    ]
  },
];

export function IntegrationsSection() {
  return (
    <section id="integraciones" className="py-20 px-4 bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-white text-gray-900 border-2 border-purple-400 px-4 py-2 font-bold shadow-sm">
            <LinkIcon className="h-4 w-4 mr-1 inline text-purple-600" />
            Integraciones
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Todo Conectado, Todo Automático
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Integraciones nativas con las plataformas que ya usas. Cobros, portales, firma digital y comunicación en una sola herramienta.
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
