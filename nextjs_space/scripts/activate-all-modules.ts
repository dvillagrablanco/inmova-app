import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function activateModules() {
  try {
    // Buscar la empresa INMOVA
    const company = await prisma.company.findFirst({
      where: { nombre: 'INMOVA' },
    });

    if (!company) {
      console.log('⚠️  Empresa INMOVA no encontrada');
      return;
    }

    // Módulos a activar (todos los módulos no-core que queremos habilitar)
    const modulesToActivate = [
      'usuarios',
      'configuracion',
      'documentos',
      'proveedores',
      'gastos',
      'reportes',
      'analytics',
      'bi',
      'notificaciones',
      'incidencias',
      'ocr',
      'crm',
      'legal',
      'marketplace',
      'anuncios',
      'votaciones',
      'reuniones',
      'reservas',
      'valoraciones',
      'publicaciones',
      'screening',
      'galerias',
      'certificaciones',
      'seguros',
      'inspecciones',
      'visitas',
      'ordenes_trabajo',
      'firma_digital',
      'open_banking',
      'sms',
      'room_rental',
      'tareas',
      'candidatos',
      // Módulos multi-vertical STR
      'str_listings',
      'str_bookings',
      'str_channels',
      'flipping_projects',
      'construction_projects',
      'professional_projects',
    ];

    console.log(`Activando ${modulesToActivate.length} módulos para ${company.nombre}...`);

    for (const moduloCodigo of modulesToActivate) {
      await prisma.companyModule.upsert({
        where: {
          companyId_moduloCodigo: {
            companyId: company.id,
            moduloCodigo,
          },
        },
        update: {
          activo: true,
          updatedAt: new Date(),
        },
        create: {
          companyId: company.id,
          moduloCodigo,
          activo: true,
          activadoPor: 'system',
        },
      });
    }

    console.log('✅ Módulos activados exitosamente');
  } catch (error) {
    console.error('Error activando módulos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

activateModules();
