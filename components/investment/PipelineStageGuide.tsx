'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search, FileSearch, Handshake, Send, KeyRound, XCircle,
  Calculator, ClipboardCheck, FileText, Building2, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface StageAction {
  text: string;
  tool?: string;
  href?: string;
  icon: React.ReactNode;
}

interface StageGuide {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  actions: StageAction[];
  documents: string[];
  tips: string[];
}

const STAGE_GUIDES: Record<string, StageGuide> = {
  descubierta: {
    name: 'Descubierta',
    icon: <Search className="h-5 w-5" />,
    color: 'text-blue-600',
    description: 'Primera fase: has identificado una oportunidad potencial.',
    actions: [
      { text: 'Análisis rápido de rentabilidad', tool: 'Calculadoras', href: '/dashboard/herramientas/calculadoras', icon: <Calculator className="h-4 w-4" /> },
      { text: 'Scoring IA de la oportunidad', tool: 'Scoring', icon: <ArrowRight className="h-4 w-4" /> },
      { text: 'Verificar precio €/m² de la zona', icon: <ArrowRight className="h-4 w-4" /> },
      { text: 'Comprobar histórico de precios en la zona', icon: <ArrowRight className="h-4 w-4" /> },
    ],
    documents: [],
    tips: [
      'No te enamores de la operación. Analiza con números fríos.',
      'Compara siempre con 2-3 operaciones similares.',
    ],
  },
  analizada: {
    name: 'Analizada',
    icon: <FileSearch className="h-5 w-5" />,
    color: 'text-indigo-600',
    description: 'Due diligence completa: documentación y visita física.',
    actions: [
      { text: 'Due diligence completa', tool: 'Checklist', icon: <ClipboardCheck className="h-4 w-4" /> },
      { text: 'Visita física del inmueble', tool: 'Checklist visita', icon: <Building2 className="h-4 w-4" /> },
      { text: 'Solicitar y analizar nota simple', tool: 'Parser IA', icon: <FileText className="h-4 w-4" /> },
      { text: 'Calculadora detallada por modalidad', tool: 'Calculadoras', href: '/dashboard/herramientas/calculadoras', icon: <Calculator className="h-4 w-4" /> },
      { text: 'Análisis fiscal de la operación', tool: 'Fiscal IRPF', icon: <Calculator className="h-4 w-4" /> },
    ],
    documents: [
      'Nota simple del Registro de la Propiedad',
      'Referencia catastral (Catastro)',
      'Último recibo IBI',
      'Certificado energético (CEE)',
      'Últimas actas de comunidad',
      'Certificado deuda cero comunidad',
    ],
    tips: [
      'Pide siempre las últimas 3 actas de comunidad para detectar derramas.',
      'Compara superficie registral vs catastral vs real medida.',
      'Verifica si el edificio tiene ITE pendiente (>50 años).',
    ],
  },
  negociacion: {
    name: 'Negociación',
    icon: <Handshake className="h-5 w-5" />,
    color: 'text-yellow-600',
    description: 'Negociación del precio y condiciones con el vendedor.',
    actions: [
      { text: 'Preparar documento de oferta formal', icon: <FileText className="h-4 w-4" /> },
      { text: 'Comparar con otras operaciones en análisis', icon: <ArrowRight className="h-4 w-4" /> },
      { text: 'Calcular precio máximo aceptable', tool: 'Calculadoras', href: '/dashboard/herramientas/calculadoras', icon: <Calculator className="h-4 w-4" /> },
    ],
    documents: [
      'Documento de oferta formal',
    ],
    tips: [
      'No des tu mejor precio desde el principio. Deja margen para negociar.',
      'Pregunta siempre el motivo de venta (urgencia = más descuento).',
      'Cada concesión debe tener contraprestación. Nunca dar nada gratis.',
      'No negocies con intermediarios sin poder de decisión.',
      'Ten siempre alternativas: no depender de una sola operación.',
      'Justifica tu oferta con datos de mercado, no con opiniones.',
    ],
  },
  ofertada: {
    name: 'Ofertada',
    icon: <Send className="h-5 w-5" />,
    color: 'text-orange-600',
    description: 'Oferta aceptada. Formalizar arras y solicitar financiación.',
    actions: [
      { text: 'Firmar contrato de arras', icon: <FileText className="h-4 w-4" /> },
      { text: 'Solicitar hipoteca / financiación', icon: <ArrowRight className="h-4 w-4" /> },
      { text: 'Generar dossier financiero para el banco', icon: <FileText className="h-4 w-4" /> },
      { text: 'Solicitar tasación del inmueble', icon: <ArrowRight className="h-4 w-4" /> },
    ],
    documents: [
      'Contrato de arras (confirmatorias/penitenciales)',
      'Dossier financiero para el banco',
      'Solicitud de hipoteca',
      'Tasación',
    ],
    tips: [
      'Arras penitenciales: si te echas atrás pierdes el depósito, si el vendedor se echa atrás te devuelve el doble.',
      'Incluye condición suspensiva de financiación si necesitas hipoteca.',
      'Pide pre-aprobación bancaria ANTES de firmar arras.',
      'No tases la vivienda antes de tener la reforma clara si es para alquiler.',
    ],
  },
  adquirida: {
    name: 'Adquirida',
    icon: <KeyRound className="h-5 w-5" />,
    color: 'text-green-600',
    description: 'Propiedad comprada. Escriturar, registrar y poner en marcha.',
    actions: [
      { text: 'Escritura ante notario', icon: <FileText className="h-4 w-4" /> },
      { text: 'Inscripción en Registro de la Propiedad', icon: <ArrowRight className="h-4 w-4" /> },
      { text: 'Alta suministros (luz, agua, gas)', icon: <ArrowRight className="h-4 w-4" /> },
      { text: 'Planificar reforma (si aplica)', tool: 'Estimador reforma', icon: <ArrowRight className="h-4 w-4" /> },
      { text: 'Crear propiedad en Inmova', tool: 'Propiedades', icon: <Building2 className="h-4 w-4" /> },
      { text: 'Preparar contrato de alquiler', tool: 'Generador contratos', href: '/contratos/nuevo', icon: <FileText className="h-4 w-4" /> },
    ],
    documents: [
      'Escritura de compraventa',
      'Inscripción registral',
      'Liquidación ITP / IVA+AJD',
      'Alta suministros',
      'Seguro hogar',
    ],
    tips: [
      'Liquida ITP en los 30 días siguientes a la escritura.',
      'Presenta la escritura en el Registro lo antes posible.',
      'Contrata seguro del hogar desde el día de la escritura.',
    ],
  },
  descartada: {
    name: 'Descartada',
    icon: <XCircle className="h-5 w-5" />,
    color: 'text-gray-500',
    description: 'Operación descartada. Documenta el motivo para aprender.',
    actions: [
      { text: 'Documentar motivo de descarte', icon: <FileText className="h-4 w-4" /> },
    ],
    documents: [],
    tips: [
      'Registra siempre por qué descartaste: precio, zona, estado, cargas, etc.',
      'Descartar operaciones es tan importante como cerrarlas.',
    ],
  },
};

export function PipelineStageGuide({ stage }: { stage: string }) {
  const guide = STAGE_GUIDES[stage.toLowerCase()];
  if (!guide) return null;

  return (
    <Card className="border-l-4" style={{ borderLeftColor: 'currentColor' }}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className={guide.color}>{guide.icon}</span>
          <CardTitle className="text-base">{guide.name}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{guide.description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Acciones</h4>
          <div className="space-y-1">
            {guide.actions.map((action, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {action.icon}
                <span className="flex-1">{action.text}</span>
                {action.href && (
                  <Link href={action.href}>
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2">Ir</Button>
                  </Link>
                )}
                {action.tool && !action.href && (
                  <Badge variant="outline" className="text-[10px]">{action.tool}</Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {guide.documents.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Documentos necesarios</h4>
            <ul className="space-y-0.5">
              {guide.documents.map((doc, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" /> {doc}
                </li>
              ))}
            </ul>
          </div>
        )}

        {guide.tips.length > 0 && (
          <div className="bg-amber-50 rounded-lg p-2">
            <h4 className="text-xs font-semibold text-amber-800 mb-1">Consejos</h4>
            <ul className="space-y-0.5">
              {guide.tips.map((tip, i) => (
                <li key={i} className="text-xs text-amber-700">• {tip}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
