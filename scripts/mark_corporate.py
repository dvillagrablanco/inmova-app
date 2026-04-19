#!/usr/bin/env python3
"""
Aplica la columna esCorporativo y marca masivamente los apuntes huérfanos
del grupo Vidaro como corporativos basándose en patrones del concepto.

Apuntes corporativos (NO asignables a edificio):
- Inversiones financieras (CACEIS, PICTET, BNP, ISIN, fondos, bonos, cupones)
- Personal y consejeros (nóminas, sueldos, seg social, asignación consejero)
- Profesionales corporativos (Gestefin, Family Partners, MDF, MDEF)
- Servicios intragrupo ARC
- Vehículos corporativos (gasoil, peajes, parking, reparaciones coche)
- Bancario corporativo (comisiones, honorarios admin)
- Software/licencias corporativas (Altai, Idealista Market Navigator)
- Intereses ccc bancarios
"""
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=10)

cmd = """
DBURL=$(grep '^DATABASE_URL=' /opt/inmova-app/.env.production | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")

echo "=== Paso 1: añadir columna esCorporativo ==="
psql "$DBURL" -c "
ALTER TABLE accounting_transactions
  ADD COLUMN IF NOT EXISTS \\"esCorporativo\\" BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS \\"accounting_transactions_esCorporativo_idx\\" 
  ON accounting_transactions(\\"esCorporativo\\");
"

VIDARO="('cef19f55f7b6ce0637d5ffb53','c65159283deeaf6815f8eda95','cmkctneuh0001nokn7nvhuweq')"

echo ""
echo "=== Paso 2: marcar apuntes corporativos por categoría ==="

# Categorías que SIEMPRE son corporativas (no aplican a edificios)
psql "$DBURL" -c "
UPDATE accounting_transactions
SET \\"esCorporativo\\" = TRUE
WHERE \\"companyId\\" IN $VIDARO
  AND categoria IN (
    'ingreso_intereses',
    'ingreso_beneficio_inversiones',
    'ingreso_dividendos',
    'ingreso_servicios_intragrupo',
    'gasto_personal',
    'gasto_consejeros',
    'gasto_perdida_inversiones',
    'gasto_intragrupo',
    'gasto_vehiculos',
    'gasto_bancario',
    'gasto_impuesto_sociedades'
  );
"

echo ""
echo "=== Paso 3: marcar por patrones de concepto (huérfanos sin building) ==="
psql "$DBURL" -c "
UPDATE accounting_transactions
SET \\"esCorporativo\\" = TRUE
WHERE \\"companyId\\" IN $VIDARO
  AND \\"buildingId\\" IS NULL
  AND \\"esCorporativo\\" = FALSE
  AND (
    -- Inversiones financieras
    concepto ILIKE '%pictet%' OR concepto ILIKE '%caceis%' OR concepto ILIKE '%bono%' OR
    concepto ILIKE '%cupon%' OR concepto ILIKE '%isin%' OR concepto ILIKE '%abante%' OR
    concepto ILIKE '%vanguard%' OR concepto ILIKE '%unicredit%' OR concepto ILIKE '%bnp%' OR
    concepto ILIKE '%vontobel%' OR concepto ILIKE '%schroder%' OR concepto ILIKE '%blackrock%' OR
    -- Profesionales corporativos
    concepto ILIKE '%gestefin%' OR concepto ILIKE '%family partner%' OR
    concepto ILIKE '%mdf%' OR concepto ILIKE '%mdef%' OR
    -- Servicios intragrupo
    concepto ILIKE '%arc%' OR concepto ILIKE '%intragrupo%' OR
    -- Software/licencias corporativas
    concepto ILIKE '%altai%' OR concepto ILIKE '%idealista%market navigator%' OR
    -- Bancario corporativo
    concepto ILIKE '%comisi%' OR concepto ILIKE '%honorarios admin%' OR
    concepto ILIKE '%comis%bancari%' OR concepto ILIKE '%liq is%' OR
    concepto ILIKE '%intereses ccc%' OR
    -- Aumentos capital
    concepto ILIKE '%aumento capital%' OR concepto ILIKE '%prima%' OR
    -- Seg Social cargo empresa
    concepto ILIKE '%seg.%social%empresa%' OR concepto ILIKE '%seguridad social%' OR
    -- Notarios (cuando son por temas societarios)
    concepto ILIKE '%notar%capital%' OR concepto ILIKE '%registro mercantil%'
  );
"

echo ""
echo "=== Paso 4: marcar gasto_otro y gasto_amortizacion huérfanos como corporativo ==="
psql "$DBURL" -c "
UPDATE accounting_transactions
SET \\"esCorporativo\\" = TRUE
WHERE \\"companyId\\" IN $VIDARO
  AND \\"buildingId\\" IS NULL
  AND \\"esCorporativo\\" = FALSE
  AND categoria IN ('gasto_otro', 'gasto_amortizacion', 'gasto_profesionales', 'ingreso_otro');
"

echo ""
echo "=== RESULTADO ==="
psql "$DBURL" -c "
SELECT 
  CASE WHEN \\"buildingId\\" IS NULL THEN 'SIN BUILDING' ELSE 'CON BUILDING' END as nivel,
  CASE WHEN \\"esCorporativo\\" THEN 'CORPORATIVO' ELSE 'OPERATIVO' END as tipo,
  COUNT(*) as n,
  SUM(monto)::numeric(12,0) as total
FROM accounting_transactions
WHERE \\"companyId\\" IN $VIDARO AND fecha >= '2026-01-01'
GROUP BY nivel, tipo
ORDER BY nivel, tipo;
"

echo ""
echo "=== Apuntes huérfanos NO corporativos restantes ==="
psql "$DBURL" -c "
SELECT tipo, categoria, COUNT(*), SUM(monto)::numeric(12,0)
FROM accounting_transactions
WHERE \\"companyId\\" IN $VIDARO
  AND fecha >= '2026-01-01'
  AND \\"buildingId\\" IS NULL
  AND \\"esCorporativo\\" = FALSE
GROUP BY tipo, categoria
ORDER BY 4 DESC NULLS LAST;
"
"""
stdin, stdout, _ = c.exec_command(cmd, timeout=120)
print(stdout.read().decode())
c.close()
