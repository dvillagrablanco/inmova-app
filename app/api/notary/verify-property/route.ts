import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { NotaryIntegrationService } from '@/lib/services/notary-integration-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { unitId, cadastralReference, province } = body;

    if (!unitId || !cadastralReference || !province) {
      return NextResponse.json(
        { error: 'unitId, cadastralReference y province son requeridos' },
        { status: 400 }
      );
    }

    const verification = await NotaryIntegrationService.verifyProperty(
      unitId,
      cadastralReference,
      province
    );

    return NextResponse.json(verification);
  } catch (error) {
    console.error('Error verificando propiedad:', error);
    return NextResponse.json(
      { error: 'Error verificando propiedad' },
      { status: 500 }
    );
  }
}
