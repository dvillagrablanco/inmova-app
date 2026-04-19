#!/usr/bin/env python3
"""
Auto-rellena MASIVAMENTE campos vacíos en Inmova del grupo Vidaro a partir
de los datos de Zucchetti SQL Server ya sincronizados.

Acciones:
1. Building.ibiAnual ← SUM apuntes 631% por building / ejercicio
2. Building.gastosComunidad ← AVG mensual apuntes 627% por building (últimos 12m)
3. Insurance.primaAnual ← SUM apuntes 625% por building (cuando matchea)
4. Insurance.primaMensual ← primaAnual / 12
5. Tenants.iban ← desde ZucchettiTercero matching por NIF
6. Provider.* (rellenar desde ZucchettiTercero proveedor)
7. AccountingTransaction.unitId ← intentar matching por subcuenta 7520xxxxxx
   donde el suffix puede mapear a una unidad concreta
"""
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=10)

cmd = """
DBURL=$(grep '^DATABASE_URL=' /opt/inmova-app/.env.production | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
VIDARO="('cef19f55f7b6ce0637d5ffb53','c65159283deeaf6815f8eda95','cmkctneuh0001nokn7nvhuweq')"

echo "========================================================"
echo "STEP 1: Building.ibiAnual desde apuntes 631% del 2026"
echo "========================================================"
psql "$DBURL" -c "
WITH ibi_acc AS (
  SELECT \\"buildingId\\" AS bid, SUM(monto) AS total
  FROM accounting_transactions
  WHERE \\"esCorporativo\\"=false AND fecha >= '2026-01-01' AND fecha < '2027-01-01'
    AND categoria = 'gasto_impuesto'
    AND \\"buildingId\\" IS NOT NULL
  GROUP BY \\"buildingId\\"
)
UPDATE buildings b
SET \\"ibiAnual\\" = ROUND(ibi_acc.total::numeric, 2)
FROM ibi_acc
WHERE b.id = ibi_acc.bid
  AND b.\\"companyId\\" IN $VIDARO
  AND ibi_acc.total > 0
  AND (b.\\"ibiAnual\\" IS NULL OR b.\\"ibiAnual\\" = 0);
"

echo ""
echo "STEP 2: Building.gastosComunidad ← media mensual 627% últimos 12 meses"
psql "$DBURL" -c "
WITH com_acc AS (
  SELECT \\"buildingId\\" AS bid,
         AVG(monthly_total) AS prom
  FROM (
    SELECT \\"buildingId\\", date_trunc('month', fecha) AS m, SUM(monto) AS monthly_total
    FROM accounting_transactions
    WHERE \\"esCorporativo\\"=false AND fecha >= '2025-01-01'
      AND categoria = 'gasto_comunidad'
      AND \\"buildingId\\" IS NOT NULL
    GROUP BY 1, 2
  ) t
  GROUP BY \\"buildingId\\"
)
UPDATE buildings b
SET \\"gastosComunidad\\" = ROUND(com_acc.prom::numeric, 2)
FROM com_acc
WHERE b.id = com_acc.bid
  AND b.\\"companyId\\" IN $VIDARO
  AND com_acc.prom > 0
  AND (b.\\"gastosComunidad\\" IS NULL OR b.\\"gastosComunidad\\" = 0);
"

echo ""
echo "STEP 3: Insurance.primaAnual ← SUM 625% por building (anual 2026)"
psql "$DBURL" -c "
WITH seg_acc AS (
  SELECT \\"buildingId\\" AS bid, SUM(monto) AS total
  FROM accounting_transactions
  WHERE \\"esCorporativo\\"=false AND fecha >= '2026-01-01' AND fecha < '2027-01-01'
    AND categoria = 'gasto_seguro'
    AND \\"buildingId\\" IS NOT NULL
  GROUP BY \\"buildingId\\"
)
UPDATE insurances i
SET \\"primaAnual\\" = ROUND(seg_acc.total::numeric, 2),
    \\"primaMensual\\" = ROUND((seg_acc.total/12)::numeric, 2)
FROM seg_acc
WHERE i.\\"buildingId\\" = seg_acc.bid
  AND i.\\"companyId\\" IN $VIDARO
  AND seg_acc.total > 0
  AND (i.\\"primaAnual\\" IS NULL OR i.\\"primaAnual\\" = 0);
"

echo ""
echo "STEP 4: Tenants.iban ← desde ZucchettiTercero matching por DNI/NIF"
psql "$DBURL" -c "
UPDATE tenants t
SET iban = zt.iban
FROM zucchetti_terceros zt
WHERE zt.\\"companyId\\" IN $VIDARO
  AND t.\\"companyId\\" IN $VIDARO
  AND zt.iban IS NOT NULL AND zt.iban != ''
  AND zt.nif = t.dni
  AND (t.iban IS NULL OR t.iban = '');
"

echo ""
echo "STEP 5: Tenants.telefono y email ← desde ZucchettiTercero"
psql "$DBURL" -c "
UPDATE tenants t
SET telefono = COALESCE(NULLIF(t.telefono, ''), zt.telefono),
    email = COALESCE(NULLIF(t.email, ''), zt.email)
FROM zucchetti_terceros zt
WHERE zt.\\"companyId\\" IN $VIDARO
  AND t.\\"companyId\\" IN $VIDARO
  AND zt.nif = t.dni
  AND zt.tipo = 'cliente'
  AND ((t.telefono IS NULL AND zt.telefono IS NOT NULL) OR (t.email IS NULL AND zt.email IS NOT NULL));
"

echo ""
echo "STEP 6: ZucchettiTercero ↔ Tenant link (providerId/tenantId)"
psql "$DBURL" -c "
UPDATE zucchetti_terceros zt
SET \\"tenantId\\" = t.id
FROM tenants t
WHERE zt.\\"companyId\\" IN $VIDARO
  AND t.\\"companyId\\" IN $VIDARO
  AND zt.nif = t.dni AND zt.nif IS NOT NULL AND zt.nif != ''
  AND zt.tipo = 'cliente'
  AND zt.\\"tenantId\\" IS NULL;
"

echo "STEP 7: ZucchettiTercero ↔ Provider link"
psql "$DBURL" -c "
UPDATE zucchetti_terceros zt
SET \\"providerId\\" = p.id
FROM providers p
WHERE zt.\\"companyId\\" IN $VIDARO
  AND p.\\"companyId\\" IN $VIDARO
  AND (zt.nombre = p.nombre OR (zt.nif IS NOT NULL AND zt.nif = p.cif))
  AND zt.tipo = 'proveedor'
  AND zt.\\"providerId\\" IS NULL;
"

echo ""
echo "STEP 8: AccountingTransaction.unitId ← matching por subcuenta 7520001xxx + concepto unidad"
echo "(Las subcuentas 7520001NNN suelen ser ingresos por cada unidad de un edificio)"
psql "$DBURL" -c "
WITH unit_match AS (
  SELECT at.id AS at_id, u.id AS uid
  FROM accounting_transactions at
  JOIN units u ON u.\\"buildingId\\" = at.\\"buildingId\\"
  WHERE at.\\"companyId\\" IN $VIDARO
    AND at.\\"esCorporativo\\" = false
    AND at.\\"buildingId\\" IS NOT NULL
    AND at.\\"unitId\\" IS NULL
    AND at.subcuenta LIKE '752%'
    AND (
      -- match por número de unidad en concepto
      (u.numero IS NOT NULL AND at.concepto ILIKE '%' || u.numero || '%')
      -- match por planta + letra
      OR (u.planta IS NOT NULL AND at.concepto ILIKE '%' || u.planta || '%' || COALESCE(u.numero,'') || '%')
    )
)
UPDATE accounting_transactions at
SET \\"unitId\\" = um.uid
FROM unit_match um
WHERE at.id = um.at_id;
"

echo ""
echo "============ RESULTADOS ============"
psql "$DBURL" -c "
SELECT 'Buildings con IBI' AS metrica, COUNT(*) FROM buildings WHERE \\"companyId\\" IN $VIDARO AND \\"ibiAnual\\" > 0
UNION ALL
SELECT 'Buildings con gastos comunidad', COUNT(*) FROM buildings WHERE \\"companyId\\" IN $VIDARO AND \\"gastosComunidad\\" > 0
UNION ALL
SELECT 'Insurances con primaAnual', COUNT(*) FROM insurances WHERE \\"companyId\\" IN $VIDARO AND \\"primaAnual\\" > 0
UNION ALL
SELECT 'Tenants con IBAN', COUNT(*) FROM tenants WHERE \\"companyId\\" IN $VIDARO AND iban IS NOT NULL AND iban != ''
UNION ALL
SELECT 'ZTerceros vinculados a Tenant', COUNT(*) FROM zucchetti_terceros WHERE \\"companyId\\" IN $VIDARO AND \\"tenantId\\" IS NOT NULL
UNION ALL
SELECT 'ZTerceros vinculados a Provider', COUNT(*) FROM zucchetti_terceros WHERE \\"companyId\\" IN $VIDARO AND \\"providerId\\" IS NOT NULL
UNION ALL
SELECT 'AT con unitId asignado', COUNT(*) FROM accounting_transactions WHERE \\"companyId\\" IN $VIDARO AND \\"unitId\\" IS NOT NULL;
"
"""
stdin, stdout, _ = c.exec_command(cmd, timeout=300)
print(stdout.read().decode())
c.close()
