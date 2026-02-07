import { PrismaClient, Prisma } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

function getModelsWithCompanyId() {
  return Prisma.dmmf.datamodel.models.filter((model) =>
    model.fields.some((field) => field.name === 'companyId')
  );
}

async function countByCompany(tableName: string, companyId: string) {
  const result = await prisma.$queryRaw<{ count: number }[]>(
    Prisma.sql`SELECT COUNT(*)::int as count FROM ${Prisma.raw(`"${tableName}"`)} WHERE "companyId" = ${companyId}`
  );
  return result[0]?.count ?? 0;
}

async function updateByCompany(tableName: string, sourceId: string, targetId: string) {
  await prisma.$executeRaw(
    Prisma.sql`UPDATE ${Prisma.raw(`"${tableName}"`)} SET "companyId" = ${targetId} WHERE "companyId" = ${sourceId}`
  );
}

async function main() {
  const sourceId = process.env.SOURCE_COMPANY_ID || process.argv[2] || 'viroda-gestion';
  const targetId = process.env.TARGET_COMPANY_ID || process.argv[3] || 'viroda-inversiones';
  const apply = process.argv.includes('--apply');

  if (sourceId === targetId) {
    console.error('SOURCE_COMPANY_ID y TARGET_COMPANY_ID no pueden ser iguales.');
    process.exit(1);
  }

  const [sourceCompany, targetCompany] = await Promise.all([
    prisma.company.findUnique({ where: { id: sourceId }, select: { id: true, nombre: true } }),
    prisma.company.findUnique({ where: { id: targetId }, select: { id: true, nombre: true } }),
  ]);

  if (!sourceCompany) {
    console.error(`No se encontró la empresa origen: ${sourceId}`);
    process.exit(1);
  }

  if (!targetCompany) {
    console.error(`No se encontró la empresa destino: ${targetId}`);
    process.exit(1);
  }

  console.log('Migración de companyId');
  console.log(`Origen: ${sourceCompany.nombre} (${sourceCompany.id})`);
  console.log(`Destino: ${targetCompany.nombre} (${targetCompany.id})`);
  console.log(`Modo: ${apply ? 'APLICAR' : 'DRY-RUN'}`);
  console.log('='.repeat(70));

  const models = getModelsWithCompanyId();
  const summary: Array<{ table: string; count: number }> = [];

  for (const model of models) {
    const tableName = model.dbName || model.name;
    const count = await countByCompany(tableName, sourceId);
    summary.push({ table: tableName, count });
  }

  summary
    .filter((row) => row.count > 0)
    .forEach((row) => {
      console.log(`${row.table}: ${row.count}`);
    });

  const totalRecords = summary.reduce((acc, row) => acc + row.count, 0);
  console.log('='.repeat(70));
  console.log(`Total registros a migrar: ${totalRecords}`);

  if (!apply) {
    console.log('Dry-run completado. Ejecuta con --apply para aplicar cambios.');
    return;
  }

  for (const row of summary) {
    if (row.count === 0) continue;
    await updateByCompany(row.table, sourceId, targetId);
  }

  console.log('Migración aplicada correctamente.');
}

main()
  .catch((error) => {
    console.error('Error en migración:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
