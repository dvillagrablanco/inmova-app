/**
 * Script: Configurar Documentos de Rovida en Inmova
 * 
 * Crea carpetas documentales y registra los documentos de Google Drive
 * para la empresa Rovida, accesible por dvillagra@vidaroinversiones.com
 * 
 * Apartados:
 * 1. Contabilidad (Google Spreadsheet)
 * 2. Seguros (Google Drive folder)
 * 3. Contratos (Google Drive folder)
 * 
 * Uso: npx tsx scripts/setup-rovida-documents.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ============================================================================
// CONFIGURACIÓN DE DOCUMENTOS ROVIDA
// ============================================================================

const ROVIDA_DOCUMENTS = {
  contabilidad: {
    folderName: 'Contabilidad Rovida',
    folderDescription: 'Documentación contable de Rovida S.L. - Libros contables, balances y asientos',
    folderColor: '#2563eb',
    folderIcon: 'Calculator',
    documents: [
      {
        nombre: 'Contabilidad Rovida - Libro de Asientos 2025',
        tipo: 'contabilidad' as const,
        descripcion: 'Hoja de cálculo con la contabilidad completa de Rovida S.L. Incluye asientos contables, balance de sumas y saldos, diario. Periodo contable 2025.',
        cloudStoragePath: 'https://docs.google.com/spreadsheets/d/1uRerjVupuKFKpkATavimTElFbI9DG_b8/edit?usp=drive_link&ouid=108061909101070644079&rtpof=true&sd=true',
        tags: ['contabilidad', 'rovida', 'asientos', '2025', 'google-drive'],
      },
    ],
  },
  seguros: {
    folderName: 'Seguros Rovida',
    folderDescription: 'Pólizas de seguros activas y documentación de siniestros de Rovida S.L.',
    folderColor: '#dc2626',
    folderIcon: 'Shield',
    documents: [
      {
        nombre: 'Seguros Rovida - Carpeta Completa',
        tipo: 'seguro' as const,
        descripcion: 'Carpeta de Google Drive con todas las pólizas de seguros de Rovida S.L. Incluye seguros de hogar, responsabilidad civil, comunidades y otros.',
        cloudStoragePath: 'https://drive.google.com/drive/folders/1tdvsqZ2d5lJZTx8bsMIY4Sk1BL0JGC8D?usp=drive_link',
        tags: ['seguros', 'rovida', 'polizas', 'google-drive'],
      },
    ],
  },
  contratos: {
    folderName: 'Contratos Rovida',
    folderDescription: 'Contratos de arrendamiento, compraventa y servicios de Rovida S.L.',
    folderColor: '#16a34a',
    folderIcon: 'FileText',
    documents: [
      {
        nombre: 'Contratos Rovida - Carpeta Completa',
        tipo: 'contrato' as const,
        descripcion: 'Carpeta de Google Drive con todos los contratos de Rovida S.L. Incluye contratos de alquiler, arrendamiento, servicios profesionales y otros acuerdos legales.',
        cloudStoragePath: 'https://drive.google.com/drive/folders/1V-_dgQVRQNBoY_jsf8VjR9TCeP-DksWf?usp=drive_link',
        tags: ['contratos', 'rovida', 'arrendamiento', 'google-drive'],
      },
    ],
  },
};

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

async function findOrCreateRovidaCompany(): Promise<string> {
  console.log('\n📋 Buscando empresa Rovida...');

  // Buscar por distintos posibles nombres/IDs
  let rovida = await prisma.company.findFirst({
    where: {
      OR: [
        { id: 'rovida-sl' },
        { id: 'rovida-gestion' },
        { nombre: { contains: 'Rovida', mode: 'insensitive' } },
      ],
    },
  });

  if (rovida) {
    console.log(`   ✅ Rovida encontrada: ${rovida.nombre} (ID: ${rovida.id})`);
    return rovida.id;
  }

  // Si no existe, crearla
  console.log('   ⚠️  Rovida no encontrada, creando...');
  rovida = await prisma.company.create({
    data: {
      id: 'rovida-sl',
      nombre: 'Rovida S.L.',
      cif: 'B-PENDIENTE',
      direccion: 'Madrid, España',
      ciudad: 'Madrid',
      pais: 'España',
      email: 'info@rovida.es',
      activo: true,
      estadoCliente: 'activo',
      notasAdmin: 'Sociedad filial de Vidaro Inversiones. Documentación importada desde Google Drive.',
    },
  });

  console.log(`   ✅ Rovida creada: ${rovida.nombre} (ID: ${rovida.id})`);
  return rovida.id;
}

async function ensureUserAccess(companyId: string): Promise<string> {
  console.log('\n👤 Verificando usuario dvillagra@vidaroinversiones.com...');

  let user = await prisma.user.findUnique({
    where: { email: 'dvillagra@vidaroinversiones.com' },
  });

  if (!user) {
    console.log('   ⚠️  Usuario no encontrado, creando...');
    const hashedPassword = await bcrypt.hash('Vidaro2025!', 10);

    user = await prisma.user.create({
      data: {
        email: 'dvillagra@vidaroinversiones.com',
        name: 'D. Villagra',
        password: hashedPassword,
        role: 'administrador',
        companyId: companyId,
        activo: true,
      },
    });
    console.log(`   ✅ Usuario creado: ${user.email} (ID: ${user.id})`);
  } else {
    console.log(`   ✅ Usuario encontrado: ${user.email} (ID: ${user.id})`);
    console.log(`   Empresa actual: ${user.companyId}`);
  }

  // Verificar/crear acceso a la empresa Rovida
  const existingAccess = await prisma.userCompanyAccess.findFirst({
    where: { userId: user.id, companyId },
  });

  if (!existingAccess) {
    await prisma.userCompanyAccess.create({
      data: {
        userId: user.id,
        companyId: companyId,
        roleInCompany: 'administrador',
        activo: true,
        lastAccess: new Date(),
      },
    });
    console.log(`   ✅ Acceso a Rovida creado para ${user.email}`);
  } else {
    // Asegurar que está activo
    await prisma.userCompanyAccess.update({
      where: { id: existingAccess.id },
      data: { activo: true, lastAccess: new Date() },
    });
    console.log(`   ✅ Acceso a Rovida ya existe y está activo`);
  }

  return user.id;
}

async function createDocumentFolders(companyId: string): Promise<Record<string, string>> {
  console.log('\n📁 Creando carpetas documentales para Rovida...');

  const folderIds: Record<string, string> = {};

  // Crear carpeta raíz "Documentos Rovida"
  let rootFolder = await prisma.documentFolder.findFirst({
    where: { companyId, nombre: 'Documentos Rovida', parentFolderId: null },
  });

  if (!rootFolder) {
    rootFolder = await prisma.documentFolder.create({
      data: {
        companyId,
        nombre: 'Documentos Rovida',
        descripcion: 'Documentación centralizada de Rovida S.L. importada desde Google Drive',
        color: '#1a365d',
        icono: 'Building2',
      },
    });
    console.log(`   ✅ Carpeta raíz creada: ${rootFolder.nombre} (ID: ${rootFolder.id})`);
  } else {
    console.log(`   ✅ Carpeta raíz ya existe: ${rootFolder.nombre} (ID: ${rootFolder.id})`);
  }

  folderIds['root'] = rootFolder.id;

  // Crear subcarpetas por apartado
  for (const [key, config] of Object.entries(ROVIDA_DOCUMENTS)) {
    let folder = await prisma.documentFolder.findFirst({
      where: {
        companyId,
        nombre: config.folderName,
        parentFolderId: rootFolder.id,
      },
    });

    if (!folder) {
      folder = await prisma.documentFolder.create({
        data: {
          companyId,
          nombre: config.folderName,
          descripcion: config.folderDescription,
          color: config.folderColor,
          icono: config.folderIcon,
          parentFolderId: rootFolder.id,
        },
      });
      console.log(`   ✅ Subcarpeta creada: ${folder.nombre} (ID: ${folder.id})`);
    } else {
      console.log(`   ✅ Subcarpeta ya existe: ${folder.nombre} (ID: ${folder.id})`);
    }

    folderIds[key] = folder.id;
  }

  return folderIds;
}

async function registerDocuments(
  companyId: string,
  userId: string,
  folderIds: Record<string, string>
): Promise<void> {
  console.log('\n📄 Registrando documentos de Google Drive...');

  let totalCreated = 0;
  let totalExisting = 0;

  for (const [key, config] of Object.entries(ROVIDA_DOCUMENTS)) {
    const folderId = folderIds[key];

    for (const doc of config.documents) {
      // Verificar si ya existe (por nombre y carpeta)
      const existing = await prisma.document.findFirst({
        where: {
          nombre: doc.nombre,
          folderId: folderId,
        },
      });

      if (existing) {
        // Actualizar URL si cambió
        if (existing.cloudStoragePath !== doc.cloudStoragePath) {
          await prisma.document.update({
            where: { id: existing.id },
            data: {
              cloudStoragePath: doc.cloudStoragePath,
              descripcion: doc.descripcion,
              tags: doc.tags,
            },
          });
          console.log(`   🔄 Actualizado: ${doc.nombre}`);
        } else {
          console.log(`   ✅ Ya existe: ${doc.nombre}`);
        }
        totalExisting++;
        continue;
      }

      // Crear documento
      const document = await prisma.document.create({
        data: {
          nombre: doc.nombre,
          tipo: doc.tipo,
          cloudStoragePath: doc.cloudStoragePath,
          descripcion: doc.descripcion,
          tags: doc.tags,
          folderId: folderId,
        },
      });

      // Crear versión inicial
      await prisma.documentVersion.create({
        data: {
          documentId: document.id,
          versionNumero: 1,
          cloud_storage_path: doc.cloudStoragePath,
          tamano: 0, // Tamaño desconocido para enlaces externos
          uploadedBy: userId,
          comentario: 'Enlace a Google Drive importado automáticamente',
        },
      });

      console.log(`   📄 Registrado: ${doc.nombre}`);
      totalCreated++;
    }
  }

  console.log(`\n   📊 Resumen: ${totalCreated} creados, ${totalExisting} ya existían`);
}

async function createDocumentTags(companyId: string): Promise<void> {
  console.log('\n🏷️  Creando etiquetas documentales...');

  const tags = [
    { nombre: 'Google Drive', color: '#4285f4' },
    { nombre: 'Rovida', color: '#16a34a' },
    { nombre: 'Contabilidad', color: '#2563eb' },
    { nombre: 'Seguros', color: '#dc2626' },
    { nombre: 'Contratos', color: '#f59e0b' },
    { nombre: 'Importado', color: '#8b5cf6' },
  ];

  for (const tag of tags) {
    const existing = await prisma.documentTag.findFirst({
      where: { companyId, nombre: tag.nombre },
    });

    if (!existing) {
      await prisma.documentTag.create({
        data: {
          companyId,
          nombre: tag.nombre,
          color: tag.color,
        },
      });
      console.log(`   ✅ Tag creado: ${tag.nombre}`);
    } else {
      console.log(`   ✅ Tag ya existe: ${tag.nombre}`);
    }
  }
}

// ============================================================================
// EJECUCIÓN PRINCIPAL
// ============================================================================

async function main() {
  console.log('====================================================================');
  console.log('  CONFIGURACIÓN DE DOCUMENTOS ROVIDA - INMOVA APP');
  console.log('====================================================================');
  console.log('');
  console.log('  Fuentes documentales:');
  console.log('  📊 Contabilidad: Google Spreadsheet');
  console.log('  🛡️  Seguros: Google Drive Folder');
  console.log('  📝 Contratos: Google Drive Folder');
  console.log('');
  console.log('  Usuario: dvillagra@vidaroinversiones.com');
  console.log('====================================================================');

  try {
    // 1. Encontrar o crear la empresa Rovida
    const companyId = await findOrCreateRovidaCompany();

    // 2. Asegurar que el usuario tiene acceso
    const userId = await ensureUserAccess(companyId);

    // 3. Crear estructura de carpetas
    const folderIds = await createDocumentFolders(companyId);

    // 4. Registrar documentos de Google Drive
    await registerDocuments(companyId, userId, folderIds);

    // 5. Crear etiquetas
    await createDocumentTags(companyId);

    console.log('\n====================================================================');
    console.log('  ✅ CONFIGURACIÓN COMPLETADA');
    console.log('====================================================================');
    console.log('');
    console.log('  Acceso a documentos:');
    console.log('  🔗 /documentos (Gestor documental principal)');
    console.log('  🔗 /seguros (Módulo de seguros)');
    console.log('  🔗 /contratos (Módulo de contratos)');
    console.log('  🔗 /contabilidad (Módulo contable)');
    console.log('');
    console.log('  El usuario dvillagra@vidaroinversiones.com puede acceder');
    console.log('  seleccionando la empresa Rovida en el selector de empresa.');
    console.log('====================================================================');

  } catch (error) {
    console.error('\n❌ Error durante la configuración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
