import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Materiales de marketing disponibles
const MATERIALES_MARKETING = [
  {
    id: 'mat-1',
    nombre: 'Plantilla Email Bienvenida',
    tipo: 'email',
    categoria: 'onboarding',
    formato: 'html',
    descargable: true,
    personalizable: true,
  },
  {
    id: 'mat-2',
    nombre: 'Flyer Servicios Partner',
    tipo: 'documento',
    categoria: 'ventas',
    formato: 'pdf',
    descargable: true,
    personalizable: false,
  },
  {
    id: 'mat-3',
    nombre: 'Presentación Comercial',
    tipo: 'presentacion',
    categoria: 'ventas',
    formato: 'pptx',
    descargable: true,
    personalizable: true,
  },
  {
    id: 'mat-4',
    nombre: 'Banner Web Partner',
    tipo: 'imagen',
    categoria: 'digital',
    formato: 'png',
    descargable: true,
    personalizable: false,
  },
  {
    id: 'mat-5',
    nombre: 'Vídeo Demo Plataforma',
    tipo: 'video',
    categoria: 'demo',
    formato: 'mp4',
    descargable: false,
    personalizable: false,
    url: '/videos/demo.mp4',
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
    const tipo = searchParams.get('tipo');

    let materiales = MATERIALES_MARKETING;
    if (categoria && categoria !== 'all') {
      materiales = materiales.filter(m => m.categoria === categoria);
    }
    if (tipo && tipo !== 'all') {
      materiales = materiales.filter(m => m.tipo === tipo);
    }

    return NextResponse.json({
      materiales,
      categorias: ['onboarding', 'ventas', 'digital', 'demo'],
      tipos: ['email', 'documento', 'presentacion', 'imagen', 'video'],
    });
  } catch (error: any) {
    console.error('[API Marketing] Error:', error);
    return NextResponse.json({ error: 'Error al obtener materiales' }, { status: 500 });
  }
}
