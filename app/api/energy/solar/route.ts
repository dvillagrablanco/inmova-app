import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory storage for demo (replace with Prisma when model is available)
let solarInstallations: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const installations = solarInstallations.filter((i) => i.companyId === companyId);

    return NextResponse.json(installations);
  } catch (error) {
    console.error('[Solar API] Error fetching installations:', error);
    return NextResponse.json({ error: 'Error al obtener instalaciones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const body = await request.json();

    // Validate required fields
    if (!body.nombre || !body.ubicacion || !body.potenciaPico || !body.numeroPaneles) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    // Calculate estimated production and savings
    const potenciaPico = parseFloat(body.potenciaPico);
    const horasSolDia = 4.5; // Average sun hours per day in Spain
    const diasMes = 30;
    const rendimiento = 0.85; // System efficiency
    const precioKwh = 0.15; // €/kWh average

    const produccionMensual = potenciaPico * horasSolDia * diasMes * rendimiento;
    const ahorroMensual = produccionMensual * precioKwh;
    const co2Evitado = produccionMensual * 0.4; // kg CO2 per kWh avoided

    const newInstallation = {
      id: `solar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      companyId,
      nombre: body.nombre,
      ubicacion: body.ubicacion,
      potenciaPico: potenciaPico,
      potenciaInversor: parseFloat(body.potenciaInversor) || potenciaPico * 0.9,
      numeroPaneles: parseInt(body.numeroPaneles),
      marcaPaneles: body.marcaPaneles || 'Sin especificar',
      fechaInstalacion: body.fechaInstalacion || new Date().toISOString(),
      estado: body.estado || 'ACTIVO',
      buildingId: body.buildingId || null,
      buildingName: null, // Would be fetched from building relation
      notas: body.notas || '',
      produccionMensual: Math.round(produccionMensual),
      ahorroMensual: Math.round(ahorroMensual * 100) / 100,
      excedenteMensual: Math.round(produccionMensual * 0.3), // Assume 30% excess
      co2Evitado: Math.round(co2Evitado),
      roiEstimado: 6, // Years
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    solarInstallations.push(newInstallation);

    return NextResponse.json(newInstallation, { status: 201 });
  } catch (error) {
    console.error('[Solar API] Error creating installation:', error);
    return NextResponse.json({ error: 'Error al crear instalación' }, { status: 500 });
  }
}
