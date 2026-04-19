#!/usr/bin/env python3
"""
Aplica el schema SQL de los nuevos modelos Zucchetti en producción.
Idempotente: usa CREATE TABLE IF NOT EXISTS y CREATE INDEX IF NOT EXISTS.
"""
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=10)

ddl = """
DBURL=$(grep '^DATABASE_URL=' /opt/inmova-app/.env.production | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")

psql "$DBURL" <<'EOF'

-- AccountingTransaction: nuevos campos enriquecidos
ALTER TABLE accounting_transactions ADD COLUMN IF NOT EXISTS subcuenta TEXT;
ALTER TABLE accounting_transactions ADD COLUMN IF NOT EXISTS contrapartida TEXT;
ALTER TABLE accounting_transactions ADD COLUMN IF NOT EXISTS "centroCoste" TEXT;
ALTER TABLE accounting_transactions ADD COLUMN IF NOT EXISTS "fechaValor" TIMESTAMP;
ALTER TABLE accounting_transactions ADD COLUMN IF NOT EXISTS vencimiento TIMESTAMP;
ALTER TABLE accounting_transactions ADD COLUMN IF NOT EXISTS factura TEXT;
ALTER TABLE accounting_transactions ADD COLUMN IF NOT EXISTS documento TEXT;
ALTER TABLE accounting_transactions ADD COLUMN IF NOT EXISTS asiento TEXT;
ALTER TABLE accounting_transactions ADD COLUMN IF NOT EXISTS ejercicio INTEGER;
ALTER TABLE accounting_transactions ADD COLUMN IF NOT EXISTS apunte TEXT;
ALTER TABLE accounting_transactions ADD COLUMN IF NOT EXISTS "terceroNif" TEXT;
ALTER TABLE accounting_transactions ADD COLUMN IF NOT EXISTS "terceroNombre" TEXT;

CREATE INDEX IF NOT EXISTS "accounting_transactions_subcuenta_idx" ON accounting_transactions(subcuenta);
CREATE INDEX IF NOT EXISTS "accounting_transactions_centroCoste_idx" ON accounting_transactions("centroCoste");
CREATE INDEX IF NOT EXISTS "accounting_transactions_terceroNif_idx" ON accounting_transactions("terceroNif");

-- ZucchettiTercero
CREATE TABLE IF NOT EXISTS zucchetti_terceros (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "companyId" TEXT NOT NULL,
  "zucchettiCodigo" TEXT NOT NULL,
  nif TEXT,
  nombre TEXT NOT NULL,
  tipo TEXT,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  iban TEXT,
  "providerId" TEXT,
  "tenantId" TEXT,
  "ultimaSync" TIMESTAMP NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "zucchetti_terceros_company_codigo_key"
  ON zucchetti_terceros ("companyId", "zucchettiCodigo");
CREATE INDEX IF NOT EXISTS "zucchetti_terceros_company_idx" ON zucchetti_terceros ("companyId");
CREATE INDEX IF NOT EXISTS "zucchetti_terceros_nif_idx" ON zucchetti_terceros (nif);
CREATE INDEX IF NOT EXISTS "zucchetti_terceros_tipo_idx" ON zucchetti_terceros (tipo);

-- ZucchettiIvaRecord
CREATE TABLE IF NOT EXISTS zucchetti_iva_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "companyId" TEXT NOT NULL,
  "zucchettiCodEjercicio" INTEGER NOT NULL,
  "comprasVentas" TEXT NOT NULL,
  "facturaNumero" TEXT NOT NULL,
  "facturaFecha" TIMESTAMP NOT NULL,
  "terceroNif" TEXT,
  "terceroNombre" TEXT,
  base DOUBLE PRECISION NOT NULL,
  cuota DOUBLE PRECISION NOT NULL,
  total DOUBLE PRECISION NOT NULL,
  "impuestoPorcentaje" DOUBLE PRECISION,
  "retencionPorcentaje" DOUBLE PRECISION,
  "retencionImporte" DOUBLE PRECISION,
  "tipoOperacion" TEXT,
  "criterioCaja" BOOLEAN DEFAULT false,
  "providerId" TEXT,
  "tenantId" TEXT,
  "buildingId" TEXT,
  "unitId" TEXT,
  "ultimaSync" TIMESTAMP NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "zucchetti_iva_unique_key"
  ON zucchetti_iva_records ("companyId", "zucchettiCodEjercicio", "facturaNumero", "comprasVentas");
CREATE INDEX IF NOT EXISTS "zucchetti_iva_company_idx" ON zucchetti_iva_records ("companyId");
CREATE INDEX IF NOT EXISTS "zucchetti_iva_fecha_idx" ON zucchetti_iva_records ("facturaFecha");
CREATE INDEX IF NOT EXISTS "zucchetti_iva_nif_idx" ON zucchetti_iva_records ("terceroNif");
CREATE INDEX IF NOT EXISTS "zucchetti_iva_cv_idx" ON zucchetti_iva_records ("comprasVentas");

-- ZucchettiBalance
CREATE TABLE IF NOT EXISTS zucchetti_balances (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "companyId" TEXT NOT NULL,
  subcuenta TEXT NOT NULL,
  titulo TEXT,
  ejercicio INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  "totalDebe" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalHaber" DOUBLE PRECISION NOT NULL DEFAULT 0,
  saldo DOUBLE PRECISION NOT NULL DEFAULT 0,
  "numApuntes" INTEGER NOT NULL DEFAULT 0,
  "ultimaSync" TIMESTAMP NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "zucchetti_balances_unique_key"
  ON zucchetti_balances ("companyId", subcuenta, ejercicio, mes);
CREATE INDEX IF NOT EXISTS "zucchetti_balances_company_idx" ON zucchetti_balances ("companyId");
CREATE INDEX IF NOT EXISTS "zucchetti_balances_sub_idx" ON zucchetti_balances (subcuenta);
CREATE INDEX IF NOT EXISTS "zucchetti_balances_ejmes_idx" ON zucchetti_balances (ejercicio, mes);

-- ZucchettiTreasuryEntry
CREATE TABLE IF NOT EXISTS zucchetti_treasury_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "companyId" TEXT NOT NULL,
  subcuenta TEXT NOT NULL,
  fecha TIMESTAMP NOT NULL,
  "fechaValor" TIMESTAMP,
  concepto TEXT NOT NULL,
  importe DOUBLE PRECISION NOT NULL,
  contrapartida TEXT,
  documento TEXT,
  factura TEXT,
  asiento TEXT,
  ejercicio INTEGER,
  apunte TEXT,
  "bankTransactionId" TEXT,
  "ultimaSync" TIMESTAMP NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "zucchetti_treasury_unique_key"
  ON zucchetti_treasury_entries ("companyId", ejercicio, asiento, apunte);
CREATE INDEX IF NOT EXISTS "zucchetti_treasury_company_idx" ON zucchetti_treasury_entries ("companyId");
CREATE INDEX IF NOT EXISTS "zucchetti_treasury_sub_idx" ON zucchetti_treasury_entries (subcuenta);
CREATE INDEX IF NOT EXISTS "zucchetti_treasury_fecha_idx" ON zucchetti_treasury_entries (fecha);
CREATE INDEX IF NOT EXISTS "zucchetti_treasury_bank_idx" ON zucchetti_treasury_entries ("bankTransactionId");

-- ZucchettiSyncSnapshot
CREATE TABLE IF NOT EXISTS zucchetti_sync_snapshots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "companyId" TEXT NOT NULL UNIQUE,
  "ultimaSync" TIMESTAMP NOT NULL,
  "apuntesUltimoCount" INTEGER NOT NULL DEFAULT 0,
  "ivaUltimoCount" INTEGER NOT NULL DEFAULT 0,
  "tercerosCount" INTEGER NOT NULL DEFAULT 0,
  "balancesCount" INTEGER NOT NULL DEFAULT 0,
  "treasuryCount" INTEGER NOT NULL DEFAULT 0,
  "fromDate" TIMESTAMP,
  "toDate" TIMESTAMP,
  "durationMs" INTEGER,
  errores INTEGER NOT NULL DEFAULT 0,
  "ultimoError" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "zucchetti_sync_company_idx" ON zucchetti_sync_snapshots ("companyId");

SELECT 'OK: Schemas applied' AS status;

\\d zucchetti_terceros;
\\d zucchetti_iva_records;
\\d zucchetti_balances;
\\d zucchetti_treasury_entries;
\\d zucchetti_sync_snapshots;

EOF
"""
stdin, stdout, stderr = c.exec_command(ddl, timeout=120)
print(stdout.read().decode())
err = stderr.read().decode()
if err:
    print("STDERR:", err)
c.close()
