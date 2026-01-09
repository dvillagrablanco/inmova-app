import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  companyId: z.string().min(1),
});

// Datos de ejemplo para generar
const DEMO_BUILDINGS = [
  {
    nombre: 'Edificio Residencial Sol',
    direccion: 'Calle Principal 123',
    ciudad: 'Madrid',
    codigoPostal: '28001',
    tipoPropiedad: 'residencial',
  },
  {
    nombre: 'Torre Empresarial Luna',
    direccion: 'Avenida del Comercio 456',
    ciudad: 'Madrid',
    codigoPostal: '28002',
    tipoPropiedad: 'comercial',
  },
  {
    nombre: 'Complejo Habitacional Estrella',
    direccion: 'Plaza Mayor 789',
    ciudad: 'Barcelona',
    codigoPostal: '08001',
    tipoPropiedad: 'residencial',
  },
];

const DEMO_TENANTS = [
  { nombre: 'María García López', email: 'maria.garcia@demo.inmova.app', telefono: '+34 600 111 222', dni: '12345678A' },
  { nombre: 'Carlos Rodríguez Pérez', email: 'carlos.rodriguez@demo.inmova.app', telefono: '+34 600 333 444', dni: '23456789B' },
  { nombre: 'Ana Martínez Sánchez', email: 'ana.martinez@demo.inmova.app', telefono: '+34 600 555 666', dni: '34567890C' },
  { nombre: 'Pedro López Fernández', email: 'pedro.lopez@demo.inmova.app', telefono: '+34 600 777 888', dni: '45678901D' },
  { nombre: 'Laura González Díaz', email: 'laura.gonzalez@demo.inmova.app', telefono: '+34 600 999 000', dni: '56789012E' },
];

const UNIT_TYPES = ['piso', 'apartamento', 'estudio', 'local', 'oficina'];

/**
 * POST /api/admin/companies/generate-demo-data
 * Genera datos de ejemplo para una empresa de demo
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol super_admin' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { companyId } = requestSchema.parse(body);

    // Verificar que la empresa existe y es de demo
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, nombre: true, esEmpresaPrueba: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    if (!company.esEmpresaPrueba) {
      return NextResponse.json(
        { error: 'Solo se pueden generar datos de ejemplo para empresas de demo' },
        { status: 400 }
      );
    }

    // Verificar si ya tiene datos
    const existingBuildings = await prisma.building.count({ where: { companyId } });
    if (existingBuildings > 0) {
      return NextResponse.json(
        { error: 'Esta empresa ya tiene datos. Elimine los datos existentes primero.' },
        { status: 400 }
      );
    }

    logger.info(`Generando datos de demo para empresa: ${company.nombre}`, { companyId });

    // Crear edificios
    const createdBuildings = await Promise.all(
      DEMO_BUILDINGS.map(async (buildingData) => {
        return prisma.building.create({
          data: {
            companyId,
            nombre: buildingData.nombre,
            direccion: buildingData.direccion,
            ciudad: buildingData.ciudad,
            codigoPostal: buildingData.codigoPostal,
            tipoPropiedad: buildingData.tipoPropiedad,
            activo: true,
          },
        });
      })
    );

    // Crear unidades para cada edificio
    const createdUnits: any[] = [];
    for (const building of createdBuildings) {
      const numUnits = Math.floor(Math.random() * 5) + 3; // 3-7 unidades por edificio
      
      for (let i = 1; i <= numUnits; i++) {
        const unitType = UNIT_TYPES[Math.floor(Math.random() * UNIT_TYPES.length)];
        const floor = Math.ceil(i / 2);
        const letter = i % 2 === 0 ? 'B' : 'A';
        
        const unit = await prisma.unit.create({
          data: {
            buildingId: building.id,
            numero: `${floor}${letter}`,
            tipo: unitType,
            planta: floor,
            superficie: Math.floor(Math.random() * 80) + 40, // 40-120 m²
            habitaciones: Math.floor(Math.random() * 3) + 1, // 1-3 habitaciones
            banos: Math.floor(Math.random() * 2) + 1, // 1-2 baños
            precioAlquiler: Math.floor(Math.random() * 800) + 600, // 600-1400 €
            estado: 'disponible',
            activo: true,
          },
        });
        createdUnits.push(unit);
      }
    }

    // Crear inquilinos
    const createdTenants = await Promise.all(
      DEMO_TENANTS.map(async (tenantData) => {
        return prisma.tenant.create({
          data: {
            companyId,
            nombre: tenantData.nombre,
            email: tenantData.email,
            telefono: tenantData.telefono,
            dni: tenantData.dni,
            activo: true,
          },
        });
      })
    );

    // Crear algunos contratos (para algunas unidades con inquilinos)
    const numContracts = Math.min(createdTenants.length, Math.floor(createdUnits.length * 0.6));
    const contractsCreated: any[] = [];

    for (let i = 0; i < numContracts; i++) {
      const unit = createdUnits[i];
      const tenant = createdTenants[i];
      
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12)); // 0-12 meses atrás
      
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1); // Contrato de 1 año

      const contract = await prisma.contract.create({
        data: {
          companyId,
          unitId: unit.id,
          tenantId: tenant.id,
          fechaInicio: startDate,
          fechaFin: endDate,
          rentaMensual: unit.precioAlquiler || 800,
          deposito: (unit.precioAlquiler || 800) * 2,
          estado: endDate > new Date() ? 'activo' : 'finalizado',
          tipo: 'alquiler',
        },
      });
      contractsCreated.push(contract);

      // Actualizar estado de la unidad
      await prisma.unit.update({
        where: { id: unit.id },
        data: { estado: 'ocupada' },
      });
    }

    // Crear algunos pagos de ejemplo
    for (const contract of contractsCreated) {
      // Crear 3 pagos históricos por contrato
      for (let month = 1; month <= 3; month++) {
        const paymentDate = new Date();
        paymentDate.setMonth(paymentDate.getMonth() - month);
        
        await prisma.payment.create({
          data: {
            contractId: contract.id,
            monto: contract.rentaMensual,
            fechaVencimiento: paymentDate,
            fechaPago: paymentDate,
            estado: 'pagado',
            concepto: `Alquiler mes ${paymentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
          },
        });
      }
    }

    const summary = {
      buildings: createdBuildings.length,
      units: createdUnits.length,
      tenants: createdTenants.length,
      contracts: contractsCreated.length,
      payments: contractsCreated.length * 3,
    };

    logger.info(`Datos de demo generados exitosamente para empresa: ${company.nombre}`, {
      companyId,
      summary,
    });

    return NextResponse.json({
      success: true,
      message: 'Datos de ejemplo generados correctamente',
      summary,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error generating demo data:', error);
    return NextResponse.json(
      { error: 'Error al generar datos de ejemplo' },
      { status: 500 }
    );
  }
}
