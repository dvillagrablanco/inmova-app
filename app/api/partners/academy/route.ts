import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/partners/academy
 * Training courses and certification modules for partners
 */

const COURSES = [
  {
    id: 'intro-inmova',
    titulo: 'Introducción a INMOVA',
    descripcion: 'Conoce la plataforma y sus funcionalidades principales',
    duracion: '45 min',
    nivel: 'basico',
    modulos: [
      { id: 'm1', titulo: 'Dashboard y navegación', duracion: '10 min' },
      { id: 'm2', titulo: 'Gestión de propiedades', duracion: '15 min' },
      { id: 'm3', titulo: 'Contratos e inquilinos', duracion: '10 min' },
      { id: 'm4', titulo: 'Pagos y conciliación', duracion: '10 min' },
    ],
    requisitoCertificacion: 'silver',
  },
  {
    id: 'gestion-avanzada',
    titulo: 'Gestión Inmobiliaria Avanzada',
    descripcion: 'Domina las herramientas avanzadas de la plataforma',
    duracion: '2h',
    nivel: 'intermedio',
    modulos: [
      { id: 'm1', titulo: 'Análisis de inversiones y P&L', duracion: '20 min' },
      { id: 'm2', titulo: 'Conciliación bancaria con IA', duracion: '15 min' },
      { id: 'm3', titulo: 'Valoración de propiedades', duracion: '20 min' },
      { id: 'm4', titulo: 'Firma digital y DocuSign', duracion: '15 min' },
      { id: 'm5', titulo: 'Automatizaciones', duracion: '20 min' },
      { id: 'm6', titulo: 'Reportes y dashboards', duracion: '15 min' },
    ],
    requisitoCertificacion: 'gold',
  },
  {
    id: 'cumplimiento-legal',
    titulo: 'Cumplimiento Normativo Inmobiliario',
    descripcion: 'LAU, GDPR, fiscalidad, seguros obligatorios',
    duracion: '1h 30min',
    nivel: 'intermedio',
    modulos: [
      { id: 'm1', titulo: 'Ley de Arrendamientos Urbanos (LAU)', duracion: '25 min' },
      { id: 'm2', titulo: 'GDPR y protección de datos', duracion: '20 min' },
      { id: 'm3', titulo: 'Fiscalidad inmobiliaria (IS, IVA, IRPF)', duracion: '25 min' },
      { id: 'm4', titulo: 'Seguros obligatorios y CEE', duracion: '20 min' },
    ],
    requisitoCertificacion: 'gold',
  },
  {
    id: 'partner-ventas',
    titulo: 'Estrategia Comercial para Partners',
    descripcion: 'Cómo vender INMOVA y maximizar comisiones',
    duracion: '1h',
    nivel: 'avanzado',
    modulos: [
      { id: 'm1', titulo: 'Propuesta de valor y pitch', duracion: '15 min' },
      { id: 'm2', titulo: 'Demos efectivas', duracion: '15 min' },
      { id: 'm3', titulo: 'Objeciones comunes y respuestas', duracion: '15 min' },
      { id: 'm4', titulo: 'Maximizar referidos y comisiones', duracion: '15 min' },
    ],
    requisitoCertificacion: 'platinum',
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    courses: COURSES,
    stats: {
      totalCursos: COURSES.length,
      totalModulos: COURSES.reduce((s, c) => s + c.modulos.length, 0),
      duracionTotal: '5h 15min',
    },
  });
}
