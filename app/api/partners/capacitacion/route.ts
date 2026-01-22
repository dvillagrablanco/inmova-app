import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Cursos de capacitación disponibles
const CURSOS_CAPACITACION = [
  {
    id: 'cert-1',
    nombre: 'Certificación Partner Básico',
    descripcion: 'Aprende los fundamentos de la plataforma Inmova',
    duracion: '2 horas',
    modulos: 5,
    nivel: 'basico',
    obligatorio: true,
    puntos: 100,
  },
  {
    id: 'cert-2',
    nombre: 'Ventas y Captación',
    descripcion: 'Técnicas de venta y captación de clientes',
    duracion: '3 horas',
    modulos: 8,
    nivel: 'intermedio',
    obligatorio: false,
    puntos: 150,
  },
  {
    id: 'cert-3',
    nombre: 'Gestión Avanzada de Propiedades',
    descripcion: 'Funcionalidades avanzadas de la plataforma',
    duracion: '4 horas',
    modulos: 10,
    nivel: 'avanzado',
    obligatorio: false,
    puntos: 200,
  },
  {
    id: 'cert-4',
    nombre: 'Integración con APIs',
    descripcion: 'Cómo integrar sistemas externos con Inmova',
    duracion: '5 horas',
    modulos: 12,
    nivel: 'experto',
    obligatorio: false,
    puntos: 300,
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const nivel = searchParams.get('nivel');

    let cursos = CURSOS_CAPACITACION;
    if (nivel && nivel !== 'all') {
      cursos = cursos.filter(c => c.nivel === nivel);
    }

    // Intentar obtener progreso del usuario
    try {
      const progreso = await prisma.partnerCertification.findMany({
        where: { partnerId: session.user.id },
      });

      const cursosConProgreso = cursos.map(curso => {
        const prog = progreso.find((p: any) => p.certificationType === curso.id);
        return {
          ...curso,
          completado: prog?.status === 'completed',
          progreso: prog?.progress || 0,
          fechaCertificacion: prog?.completedAt,
        };
      });

      return NextResponse.json({
        cursos: cursosConProgreso,
        totalPuntos: progreso.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => {
          const curso = cursos.find(c => c.id === p.certificationType);
          return sum + (curso?.puntos || 0);
        }, 0),
      });
    } catch {
      // Si no hay tabla, retornar cursos sin progreso
      return NextResponse.json({
        cursos: cursos.map(c => ({ ...c, completado: false, progreso: 0 })),
        totalPuntos: 0,
      });
    }
  } catch (error: any) {
    console.error('[API Capacitacion] Error:', error);
    return NextResponse.json({ error: 'Error al obtener cursos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { cursoId, progreso } = body;

    if (!cursoId) {
      return NextResponse.json({ error: 'Curso ID requerido' }, { status: 400 });
    }

    try {
      const certification = await prisma.partnerCertification.upsert({
        where: {
          partnerId_certificationType: {
            partnerId: session.user.id,
            certificationType: cursoId,
          },
        },
        update: {
          progress: progreso,
          status: progreso >= 100 ? 'completed' : 'in_progress',
          completedAt: progreso >= 100 ? new Date() : null,
        },
        create: {
          partnerId: session.user.id,
          certificationType: cursoId,
          progress: progreso,
          status: progreso >= 100 ? 'completed' : 'in_progress',
          completedAt: progreso >= 100 ? new Date() : null,
        },
      });

      return NextResponse.json(certification);
    } catch {
      return NextResponse.json({ error: 'Funcionalidad no disponible' }, { status: 503 });
    }
  } catch (error: any) {
    console.error('[API Capacitacion] Error:', error);
    return NextResponse.json({ error: 'Error al actualizar progreso' }, { status: 500 });
  }
}
