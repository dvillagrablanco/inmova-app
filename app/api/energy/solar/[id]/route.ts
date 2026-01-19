import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Reference to the same in-memory storage (for demo purposes)
// In production, this would use Prisma
let solarInstallations: any[] = [];

// Helper to get the shared storage
function getInstallations() {
  // In a real app, this would query the database
  return solarInstallations;
}

function setInstallations(installations: any[]) {
  solarInstallations = installations;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const { id } = params;

    const installation = getInstallations().find(
      (i) => i.id === id && i.companyId === companyId
    );

    if (!installation) {
      return NextResponse.json({ error: 'Instalación no encontrada' }, { status: 404 });
    }

    return NextResponse.json(installation);
  } catch (error) {
    console.error('[Solar API] Error fetching installation:', error);
    return NextResponse.json({ error: 'Error al obtener instalación' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const { id } = params;
    const body = await request.json();

    const installations = getInstallations();
    const index = installations.findIndex(
      (i) => i.id === id && i.companyId === companyId
    );

    if (index === -1) {
      return NextResponse.json({ error: 'Instalación no encontrada' }, { status: 404 });
    }

    // Recalculate production and savings if power changed
    const potenciaPico = parseFloat(body.potenciaPico) || installations[index].potenciaPico;
    const horasSolDia = 4.5;
    const diasMes = 30;
    const rendimiento = 0.85;
    const precioKwh = 0.15;

    const produccionMensual = potenciaPico * horasSolDia * diasMes * rendimiento;
    const ahorroMensual = produccionMensual * precioKwh;
    const co2Evitado = produccionMensual * 0.4;

    const updatedInstallation = {
      ...installations[index],
      nombre: body.nombre || installations[index].nombre,
      ubicacion: body.ubicacion || installations[index].ubicacion,
      potenciaPico: potenciaPico,
      potenciaInversor: parseFloat(body.potenciaInversor) || installations[index].potenciaInversor,
      numeroPaneles: parseInt(body.numeroPaneles) || installations[index].numeroPaneles,
      marcaPaneles: body.marcaPaneles || installations[index].marcaPaneles,
      fechaInstalacion: body.fechaInstalacion || installations[index].fechaInstalacion,
      estado: body.estado || installations[index].estado,
      buildingId: body.buildingId !== undefined ? body.buildingId : installations[index].buildingId,
      notas: body.notas !== undefined ? body.notas : installations[index].notas,
      produccionMensual: Math.round(produccionMensual),
      ahorroMensual: Math.round(ahorroMensual * 100) / 100,
      excedenteMensual: Math.round(produccionMensual * 0.3),
      co2Evitado: Math.round(co2Evitado),
      updatedAt: new Date().toISOString(),
    };

    installations[index] = updatedInstallation;
    setInstallations(installations);

    return NextResponse.json(updatedInstallation);
  } catch (error) {
    console.error('[Solar API] Error updating installation:', error);
    return NextResponse.json({ error: 'Error al actualizar instalación' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const { id } = params;

    const installations = getInstallations();
    const index = installations.findIndex(
      (i) => i.id === id && i.companyId === companyId
    );

    if (index === -1) {
      return NextResponse.json({ error: 'Instalación no encontrada' }, { status: 404 });
    }

    installations.splice(index, 1);
    setInstallations(installations);

    return NextResponse.json({ success: true, message: 'Instalación eliminada' });
  } catch (error) {
    console.error('[Solar API] Error deleting installation:', error);
    return NextResponse.json({ error: 'Error al eliminar instalación' }, { status: 500 });
  }
}
