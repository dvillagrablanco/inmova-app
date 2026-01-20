'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Calculator, 
  FileText, 
  PenTool, 
  Camera,
  QrCode,
  BarChart3,
  FileSpreadsheet,
  Printer,
  Download,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

const tools = [
  {
    id: 'calculadora-rentabilidad',
    name: 'Calculadora de Rentabilidad',
    description: 'Calcula el ROI y rentabilidad de tus inversiones inmobiliarias',
    icon: Calculator,
    href: '/landing/calculadora-roi',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'generador-contratos',
    name: 'Generador de Contratos',
    description: 'Crea contratos de alquiler personalizados automáticamente',
    icon: FileText,
    href: '/contratos/nuevo',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'firma-digital',
    name: 'Firma Digital',
    description: 'Firma documentos electrónicamente de forma segura',
    icon: PenTool,
    href: '/firma-digital/configuracion',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'escaner-documentos',
    name: 'Escáner de Documentos',
    description: 'Digitaliza y extrae información de documentos con IA',
    icon: Camera,
    href: '/documentos/subir',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'generador-qr',
    name: 'Generador de QR',
    description: 'Crea códigos QR para tus propiedades y anuncios',
    icon: QrCode,
    href: '#',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    disabled: true,
  },
  {
    id: 'reportes',
    name: 'Generador de Reportes',
    description: 'Crea informes personalizados de tu cartera',
    icon: BarChart3,
    href: '/dashboard/analytics',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    id: 'exportar-datos',
    name: 'Exportar Datos',
    description: 'Exporta tus datos a Excel, CSV o PDF',
    icon: FileSpreadsheet,
    href: '#',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    action: 'export',
  },
  {
    id: 'imprimir',
    name: 'Centro de Impresión',
    description: 'Imprime contratos, recibos y documentos',
    icon: Printer,
    href: '#',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    action: 'print',
  },
];

const externalTools = [
  {
    name: 'Idealista',
    description: 'Publica tus propiedades en Idealista',
    href: 'https://www.idealista.com',
  },
  {
    name: 'Fotocasa',
    description: 'Sincroniza con Fotocasa',
    href: 'https://www.fotocasa.es',
  },
  {
    name: 'Catastro',
    description: 'Consulta el catastro virtual',
    href: 'https://www.sedecatastro.gob.es',
  },
  {
    name: 'Registro de la Propiedad',
    description: 'Accede al registro de la propiedad online',
    href: 'https://www.registradores.org',
  },
];

export default function HerramientasPage() {
  const handleExport = () => {
    // TODO: Implement export functionality
    toast.info('Funcionalidad de exportación próximamente disponible');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Herramientas</h1>
        <p className="text-gray-600 mt-1">
          Utilidades para gestionar tu negocio inmobiliario
        </p>
      </div>

      {/* Main Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isDisabled = tool.disabled;
          
          const content = (
            <Card className={`h-full hover:shadow-lg transition-shadow ${isDisabled ? 'opacity-60' : 'cursor-pointer'}`}>
              <CardContent className="pt-6">
                <div className={`w-12 h-12 ${tool.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <h3 className="font-semibold mb-2">{tool.name}</h3>
                <p className="text-sm text-gray-600">{tool.description}</p>
                {isDisabled && (
                  <span className="text-xs text-gray-400 mt-2 block">Próximamente</span>
                )}
              </CardContent>
            </Card>
          );

          if (isDisabled) {
            return <div key={tool.id}>{content}</div>;
          }

          if (tool.action === 'export') {
            return (
              <div key={tool.id} onClick={handleExport}>
                {content}
              </div>
            );
          }

          if (tool.action === 'print') {
            return (
              <div key={tool.id} onClick={handlePrint}>
                {content}
              </div>
            );
          }

          return (
            <Link key={tool.id} href={tool.href}>
              {content}
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accesos directos a las funciones más usadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/edificios/nuevo">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Nuevo Edificio
              </Button>
            </Link>
            <Link href="/contratos/nuevo">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Nuevo Contrato
              </Button>
            </Link>
            <Link href="/inquilinos/nuevo">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Nuevo Inquilino
              </Button>
            </Link>
            <Link href="/pagos/nuevo">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Registrar Pago
              </Button>
            </Link>
            <Link href="/documentos/subir">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Subir Documento
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* External Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Herramientas Externas</CardTitle>
          <CardDescription>Enlaces útiles a servicios externos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {externalTools.map((tool) => (
              <a
                key={tool.name}
                href={tool.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-sm text-gray-600">{tool.description}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
