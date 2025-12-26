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
    const { propertyId, cadastralReference, province } = body;

    if (!propertyId || !cadastralReference || !province) {
      return NextResponse.json(
        { error: 'propertyId, cadastralReference y province son requeridos' },
        { status: 400 }
      );
    }

    const verification = await NotaryIntegrationService.verifyProperty(
      propertyId,
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
