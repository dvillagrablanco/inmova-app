import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { RealEstateDeveloperService } from '@/lib/services/real-estate-developer-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createProjectSchema = z.object({
  nombre: z.string().min(1),
  ubicacion: z.string().optional(),
  tipoProyecto: z.enum(['residencial', 'comercial', 'mixto']),
  fechaInicio: z.string().optional(),
  fechaEntregaEstimada: z.string().optional(),
  presupuesto: z.number().optional(),
  descripcion: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const filters = {
      estado: searchParams.get('estado') || undefined,
      tipoProyecto: searchParams.get('tipoProyecto') || undefined
    };
    const projects = await RealEstateDeveloperService.getProjects(session.user.companyId, filters);
    return NextResponse.json({ success: true, data: projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await request.json();
    const validated = createProjectSchema.parse(body);
    const project = await RealEstateDeveloperService.createProject({
      ...validated,
      companyId: session.user.companyId
    });
    return NextResponse.json({ success: true, data: project, message: 'Proyecto creado' }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
