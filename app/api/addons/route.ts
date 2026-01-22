import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Catálogo de Add-ons disponibles
export const ADDONS_CATALOG = [
  {
    id: 'addon-firma-digital',
    nombre: 'Firma Digital Avanzada',
    descripcion: 'Firma de contratos con validez legal mediante DocuSign o Signaturit',
    categoria: 'documentos',
    precioMensual: 29,
    precioAnual: 290,
    caracteristicas: [
      'Firma digital con validez legal',
      'Integración DocuSign/Signaturit',
      'Firma múltiple',
      'Certificados de firma',
      'Almacenamiento seguro',
    ],
    stripeProductId: 'prod_firma_digital',
    stripePriceIdMensual: 'price_firma_digital_mensual',
    stripePriceIdAnual: 'price_firma_digital_anual',
    popular: true,
  },
  {
    id: 'addon-ia-valoracion',
    nombre: 'Valoración IA de Propiedades',
    descripcion: 'Valoración automática de propiedades con inteligencia artificial',
    categoria: 'ia',
    precioMensual: 49,
    precioAnual: 490,
    caracteristicas: [
      'Valoración instantánea',
      'Análisis de mercado',
      'Comparables automáticos',
      'Informes PDF',
      'API de valoración',
    ],
    stripeProductId: 'prod_ia_valoracion',
    stripePriceIdMensual: 'price_ia_valoracion_mensual',
    stripePriceIdAnual: 'price_ia_valoracion_anual',
    popular: false,
  },
  {
    id: 'addon-tours-virtuales',
    nombre: 'Tours Virtuales 360°',
    descripcion: 'Tours virtuales interactivos para tus propiedades',
    categoria: 'marketing',
    precioMensual: 39,
    precioAnual: 390,
    caracteristicas: [
      'Tours 360° ilimitados',
      'Integración Matterport',
      'Embed en portales',
      'Estadísticas de visitas',
      'Hotspots interactivos',
    ],
    stripeProductId: 'prod_tours_virtuales',
    stripePriceIdMensual: 'price_tours_virtuales_mensual',
    stripePriceIdAnual: 'price_tours_virtuales_anual',
    popular: true,
  },
  {
    id: 'addon-sms-masivo',
    nombre: 'SMS y WhatsApp Masivo',
    descripcion: 'Envío masivo de SMS y WhatsApp a inquilinos',
    categoria: 'comunicacion',
    precioMensual: 19,
    precioAnual: 190,
    caracteristicas: [
      '500 SMS/mes incluidos',
      'WhatsApp Business API',
      'Plantillas personalizadas',
      'Programación de envíos',
      'Reportes de entrega',
    ],
    stripeProductId: 'prod_sms_masivo',
    stripePriceIdMensual: 'price_sms_masivo_mensual',
    stripePriceIdAnual: 'price_sms_masivo_anual',
    popular: false,
  },
  {
    id: 'addon-contabilidad',
    nombre: 'Contabilidad Integrada',
    descripcion: 'Integración con sistemas contables y facturación automática',
    categoria: 'finanzas',
    precioMensual: 59,
    precioAnual: 590,
    caracteristicas: [
      'Integración Contasimple',
      'Facturación automática',
      'Conciliación bancaria',
      'Informes fiscales',
      'Exportación a gestorías',
    ],
    stripeProductId: 'prod_contabilidad',
    stripePriceIdMensual: 'price_contabilidad_mensual',
    stripePriceIdAnual: 'price_contabilidad_anual',
    popular: false,
  },
  {
    id: 'addon-matching-inquilinos',
    nombre: 'Matching de Inquilinos',
    descripcion: 'Sistema de matching inteligente para encontrar inquilinos ideales',
    categoria: 'ia',
    precioMensual: 35,
    precioAnual: 350,
    caracteristicas: [
      'Matching por compatibilidad',
      'Verificación de solvencia',
      'Scoring automático',
      'Alertas de candidatos',
      'Integración con portales',
    ],
    stripeProductId: 'prod_matching',
    stripePriceIdMensual: 'price_matching_mensual',
    stripePriceIdAnual: 'price_matching_anual',
    popular: true,
  },
  {
    id: 'addon-api-access',
    nombre: 'Acceso API Completo',
    descripcion: 'Acceso completo a la API REST para integraciones personalizadas',
    categoria: 'desarrollo',
    precioMensual: 99,
    precioAnual: 990,
    caracteristicas: [
      'API REST completa',
      'Webhooks personalizados',
      '10,000 requests/día',
      'Documentación técnica',
      'Soporte prioritario',
    ],
    stripeProductId: 'prod_api_access',
    stripePriceIdMensual: 'price_api_access_mensual',
    stripePriceIdAnual: 'price_api_access_anual',
    popular: false,
  },
  {
    id: 'addon-white-label',
    nombre: 'White Label',
    descripcion: 'Personalización completa con tu marca',
    categoria: 'branding',
    precioMensual: 149,
    precioAnual: 1490,
    caracteristicas: [
      'Logo y colores personalizados',
      'Dominio propio',
      'Emails con tu marca',
      'Portal de inquilinos branded',
      'Sin menciones a Inmova',
    ],
    stripeProductId: 'prod_white_label',
    stripePriceIdMensual: 'price_white_label_mensual',
    stripePriceIdAnual: 'price_white_label_anual',
    popular: false,
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');

    let addons = ADDONS_CATALOG;
    if (categoria && categoria !== 'all') {
      addons = addons.filter(a => a.categoria === categoria);
    }

    // Obtener add-ons activos de la empresa
    let addonsActivos: string[] = [];
    try {
      const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: { addonsActivos: true, planId: true },
      });
      addonsActivos = (company?.addonsActivos as string[]) || [];
    } catch {
      // Si no hay campo, usar array vacío
    }

    const addonsConEstado = addons.map(addon => ({
      ...addon,
      activo: addonsActivos.includes(addon.id),
    }));

    return NextResponse.json({
      addons: addonsConEstado,
      categorias: [
        { id: 'documentos', nombre: 'Documentos', icono: 'file-text' },
        { id: 'ia', nombre: 'Inteligencia Artificial', icono: 'brain' },
        { id: 'marketing', nombre: 'Marketing', icono: 'megaphone' },
        { id: 'comunicacion', nombre: 'Comunicación', icono: 'message-circle' },
        { id: 'finanzas', nombre: 'Finanzas', icono: 'euro' },
        { id: 'desarrollo', nombre: 'Desarrollo', icono: 'code' },
        { id: 'branding', nombre: 'Branding', icono: 'palette' },
      ],
      resumen: {
        total: addons.length,
        activos: addonsActivos.length,
        gastoMensual: addonsConEstado
          .filter(a => a.activo)
          .reduce((sum, a) => sum + a.precioMensual, 0),
      },
    });
  } catch (error: any) {
    console.error('[API Addons] Error:', error);
    return NextResponse.json({ error: 'Error al obtener add-ons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que es admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { addonId, accion } = body;

    if (!addonId || !accion) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const addon = ADDONS_CATALOG.find(a => a.id === addonId);
    if (!addon) {
      return NextResponse.json({ error: 'Add-on no encontrado' }, { status: 404 });
    }

    try {
      const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: { addonsActivos: true },
      });

      let addonsActivos = (company?.addonsActivos as string[]) || [];

      if (accion === 'activar') {
        if (!addonsActivos.includes(addonId)) {
          addonsActivos.push(addonId);
        }
      } else if (accion === 'desactivar') {
        addonsActivos = addonsActivos.filter(id => id !== addonId);
      }

      await prisma.company.update({
        where: { id: session.user.companyId },
        data: { addonsActivos },
      });

      return NextResponse.json({
        success: true,
        addon: { ...addon, activo: accion === 'activar' },
        mensaje: accion === 'activar' 
          ? `Add-on "${addon.nombre}" activado correctamente`
          : `Add-on "${addon.nombre}" desactivado`,
      });
    } catch (dbError) {
      console.warn('[API Addons] Error de BD:', dbError);
      return NextResponse.json({ error: 'Error al actualizar add-ons' }, { status: 503 });
    }
  } catch (error: any) {
    console.error('[API Addons] Error:', error);
    return NextResponse.json({ error: 'Error al procesar solicitud' }, { status: 500 });
  }
}
