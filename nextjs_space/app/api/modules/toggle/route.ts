import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { 
  activateModuleForCompany, 
  deactivateModuleForCompany 
} from '@/lib/modules-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'administrador') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden modificar módulos' },
        { status: 403 }
      );
    }

    const { moduloCodigo, activo } = await req.json();
    const companyId = (session.user as any).companyId;
    const userId = session.user.id;

    if (!moduloCodigo) {
      return NextResponse.json(
        { error: 'Código de módulo requerido' },
        { status: 400 }
      );
    }

    if (activo) {
      await activateModuleForCompany(companyId, moduloCodigo, userId);
    } else {
      await deactivateModuleForCompany(companyId, moduloCodigo);
    }

    return NextResponse.json({
      success: true,
      message: activo ? 'Módulo activado' : 'Módulo desactivado'
    });
  } catch (error: any) {
    console.error('Error al modificar módulo:', error);
    return NextResponse.json(
      { error: error.message || 'Error al modificar módulo' },
      { status: 500 }
    );
  }
}
