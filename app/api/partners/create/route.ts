/**
 * API: Crear nuevo partner
 * POST /api/partners/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PartnerService, CreatePartnerData } from '@/lib/services/partner-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data: CreatePartnerData = {
      nombre: body.nombre,
      razonSocial: body.razonSocial,
      cif: body.cif,
      email: body.email,
      password: body.password,
      codigo: body.codigo,
      tipo: body.tipo,
      contactoNombre: body.contactoNombre,
      contactoEmail: body.contactoEmail,
      contactoTelefono: body.contactoTelefono,
      sitioWeb: body.sitioWeb,
    };

    const partner = await PartnerService.createPartner(data);

    return NextResponse.json({ partner }, { status: 201 });
  } catch (error) {
    console.error('Error al crear partner:', error);
    return NextResponse.json(
      { error: 'Error al crear partner' },
      { status: 500 }
    );
  }
}
