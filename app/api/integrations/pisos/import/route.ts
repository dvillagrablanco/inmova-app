import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { RealEstateIntegrations } from '@/lib/services/real-estate-integrations';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { url, createAnalysis = false } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
    }

    const propertyData = await RealEstateIntegrations.importFromPisos(url);

    const property = await RealEstateIntegrations.saveImportedProperty(
      session.user.id,
      propertyData,
      createAnalysis
    );

    return NextResponse.json({
      property,
      propertyData,
      message: 'Propiedad importada exitosamente',
    });
  } catch (error) {
    console.error('Error importando desde Pisos.com:', error);
    return NextResponse.json(
      { error: 'Error importando propiedad' },
      { status: 500 }
    );
  }
}
