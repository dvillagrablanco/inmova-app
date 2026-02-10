import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ViviendaSocialService } from '@/lib/services/vivienda-social-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createApplicationSchema = z.object({
  solicitanteNombre: z.string().min(1),
  solicitanteEmail: z.string().email(),
  solicitanteTelefono: z.string().optional(),
  tipoVivienda: z.enum(['VPO', 'VPT', 'alquiler_social', 'emergencia']),
  ingresosFamiliares: z.number().optional(),
  miembrosFamilia: z.number().optional(),
  notas: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;
    const { searchParams } = new URL(request.url);
    const filters = {
      estado: searchParams.get('estado') || undefined,
      tipoVivienda: searchParams.get('tipoVivienda') || undefined
    };
    const applications = await ViviendaSocialService.getApplications(session.user.companyId, filters);
    return NextResponse.json({ success: true, data: applications });
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
    const validated = createApplicationSchema.parse(body);
    const application = await ViviendaSocialService.createApplication({
      ...validated,
      companyId: session.user.companyId
    });
    return NextResponse.json({ success: true, data: application, message: 'Solicitud creada' }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { id, estado } = await request.json();
    await ViviendaSocialService.updateApplicationStatus(id, estado);
    return NextResponse.json({ success: true, message: 'Estado actualizado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
