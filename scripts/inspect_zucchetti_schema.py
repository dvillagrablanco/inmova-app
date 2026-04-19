#!/usr/bin/env python3
"""Inspecciona el schema real de Zucchetti SQL para descubrir tablas y campos."""
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=10)

cmd = """
cd /opt/inmova-app

cat > scripts/_inspect_zuc.ts << 'SCRIPT'
import { getZucchettiPool, getZucchettiDatabase } from '@/lib/zucchetti-sqlserver';

(async () => {
  const key: any = 'VIR'; // Viroda (DAT_VIR) — más datos
  const db = getZucchettiDatabase(key);
  const pool = await getZucchettiPool(key, db);

  // 1. Listar todas las tablas
  console.log('=== Tablas en', db, '===');
  const tables = await pool.request().query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE='BASE TABLE'
    ORDER BY TABLE_NAME
  `);
  for (const t of tables.recordset) {
    console.log(' - ' + t.TABLE_NAME);
  }

  // 2. Schema de Registro_IVA_IGIC
  console.log('\\n=== Columnas Registro_IVA_IGIC ===');
  const cols1 = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME='Registro_IVA_IGIC'
    ORDER BY ORDINAL_POSITION
  `);
  for (const c of cols1.recordset) {
    console.log(`  ${c.COLUMN_NAME} (${c.DATA_TYPE})`);
  }

  // 3. Sample row Registro_IVA
  console.log('\\n=== Sample Registro_IVA_IGIC ===');
  const sample = await pool.request().query(`
    SELECT TOP 3 * FROM Registro_IVA_IGIC ORDER BY factura_fecha DESC
  `);
  for (const r of sample.recordset) {
    console.log(JSON.stringify(r).substring(0, 400));
  }

  // 4. Buscar tabla Terceros (puede ser TercerosFiscales, ApunteTerceros, etc)
  console.log('\\n=== Tablas que contengan terc ===');
  const terc = await pool.request().query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME LIKE '%erc%' AND TABLE_TYPE='BASE TABLE'
  `);
  for (const t of terc.recordset) console.log(' - ' + t.TABLE_NAME);

  // 5. Schema de Subcuentas (donde puede estar info de terceros)
  console.log('\\n=== Tabla Subcuentas (3 sample) ===');
  const subs = await pool.request().query(`
    SELECT TOP 3 * FROM Subcuentas WHERE Codigo LIKE '430%'
  `);
  for (const r of subs.recordset) {
    console.log(JSON.stringify(r).substring(0, 400));
  }

  process.exit(0);
})();
SCRIPT

while IFS='=' read -r key value; do
  if [[ "$key" =~ ^[A-Z][A-Z0-9_]+$ ]] && [[ ! "$value" =~ "BEGIN" ]] && [[ ! "$value" =~ "END" ]]; then
    export "$key"="$value"
  fi
done < /opt/inmova-app/.env.production

cd /opt/inmova-app && timeout 60 npx tsx scripts/_inspect_zuc.ts 2>&1 | tail -150
rm -f scripts/_inspect_zuc.ts
"""
stdin, stdout, stderr = c.exec_command(cmd, timeout=180)
print(stdout.read().decode())
err = stderr.read().decode()
if err.strip() and 'BEGIN' not in err:
    print("STDERR:", err[-500:])
c.close()
