import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import Papa from 'papaparse';

// GET /api/import/template?type=buildings|units|tenants
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ error: 'Tipo no especificado' }, { status: 400 });
    }

    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'buildings':
        data = [
          {
            nombre: 'Edificio Ejemplo',
            direccion: 'Calle Mayor 123, Madrid',
            tipo: 'residencial',
            anoConstructor: '2020',
            numeroUnidades: '10',
            estadoConservacion: 'Bueno',
            certificadoEnergetico: 'B',
            ascensor: 'Sí',
            garaje: 'Sí',
            trastero: 'No',
            piscina: 'No',
            jardin: 'Sí',
            gastosComunidad: '150',
            ibiAnual: '800',
          },
        ];
        filename = 'plantilla_edificios.csv';
        break;

      case 'units':
        data = [
          {
            edificio: 'Edificio Ejemplo',
            numero: '1A',
            tipo: 'vivienda',
            estado: 'disponible',
            superficie: '80',
            habitaciones: '2',
            banos: '1',
            planta: '1',
            orientacion: 'Norte',
            rentaMensual: '900',
            amueblado: 'No',
            aireAcondicionado: 'Sí',
            calefaccion: 'Sí',
          },
        ];
        filename = 'plantilla_unidades.csv';
        break;

      case 'tenants':
        data = [
          {
            nombreCompleto: 'Juan Pérez Gómez',
            dni: '12345678A',
            email: 'juan@example.com',
            telefono: '+34600123456',
            fechaNacimiento: '1985-05-15',
            nacionalidad: 'Española',
            estadoCivil: 'soltero',
            numeroOcupantes: '2',
            situacionLaboral: 'empleado',
            empresa: 'Empresa SA',
            ingresosMensuales: '2500',
            scoring: '75',
            nivelRiesgo: 'bajo',
          },
        ];
        filename = 'plantilla_inquilinos.csv';
        break;

      default:
        return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 });
    }

    // Convertir a CSV
    const csv = Papa.unparse(data);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error al generar plantilla:', error);
    return NextResponse.json(
      { error: 'Error al generar plantilla' },
      { status: 500 }
    );
  }
}
