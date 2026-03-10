import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createSchema = z.object({
  propietario: z.string().min(1),
  inmuebles: z.array(z.string()).min(1),
  tipo: z.enum(['integral', 'parcial', 'subarriendo']),
  honorarios: z.number().optional(),
  honorariosPorcentaje: z.number().min(0).max(100).optional(),
  fechaInicio: z.string(),
  fechaFin: z.string(),
  condiciones: z.string().optional(),
});

type ContratoGestion = {
  id: string;
  propietario: string;
  inmuebles: string[];
  tipo: string;
  honorarios?: number;
  honorariosPorcentaje?: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  condiciones?: string;
  createdAt: string;
};

// Mock data inicial
const MOCK_CONTRATOS: ContratoGestion[] = [
  {
    id: 'cg-1',
    propietario: 'Juan García López',
    inmuebles: ['Edificio Centro - Piso 3A'],
    tipo: 'integral',
    honorarios: 150,
    honorariosPorcentaje: undefined,
    fechaInicio: '2024-01-01',
    fechaFin: '2025-12-31',
    estado: 'activo',
    condiciones: 'Gestión completa incluida',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cg-2',
    propietario: 'María Fernández Ruiz',
    inmuebles: ['Residencial Norte - Piso 1B', 'Residencial Norte - Piso 2B'],
    tipo: 'parcial',
    honorarios: undefined,
    honorariosPorcentaje: 8,
    fechaInicio: '2024-03-15',
    fechaFin: '2025-03-14',
    estado: 'activo',
    createdAt: '2024-03-15T00:00:00Z',
  },
  {
    id: 'cg-3',
    propietario: 'Carlos Martínez Sánchez',
    inmuebles: ['Local Comercial Calle Mayor'],
    tipo: 'subarriendo',
    honorarios: 200,
    honorariosPorcentaje: undefined,
    fechaInicio: '2023-06-01',
    fechaFin: '2024-05-31',
    estado: 'expirado',
    createdAt: '2023-06-01T00:00:00Z',
  },
];

let mockContracts = [...MOCK_CONTRATOS];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    return NextResponse.json(mockContracts);
  } catch (error) {
    console.error('[ContratosGestion API] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener contratos de gestión' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const validated = createSchema.parse(body);

    if (!validated.honorarios && !validated.honorariosPorcentaje) {
      return NextResponse.json(
        { error: 'Debe especificar honorarios fijos o porcentaje' },
        { status: 400 }
      );
    }

    const nuevoContrato: ContratoGestion = {
      id: `cg-${Date.now()}`,
      propietario: validated.propietario,
      inmuebles: validated.inmuebles,
      tipo: validated.tipo,
      honorarios: validated.honorarios,
      honorariosPorcentaje: validated.honorariosPorcentaje,
      fechaInicio: validated.fechaInicio,
      fechaFin: validated.fechaFin,
      estado: 'pendiente',
      condiciones: validated.condiciones,
      createdAt: new Date().toISOString(),
    };

    mockContracts.push(nuevoContrato);

    return NextResponse.json(nuevoContrato, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[ContratosGestion API] Error:', error);
    return NextResponse.json(
      { error: 'Error al crear contrato de gestión' },
      { status: 500 }
    );
  }
}
