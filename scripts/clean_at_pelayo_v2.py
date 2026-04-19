#!/usr/bin/env python3
"""Segunda pasada: re-asigna apuntes huérfanos (buildingId NULL) a Pelayo 15/17."""
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=10)

cmd = """
DBURL=$(grep '^DATABASE_URL=' /opt/inmova-app/.env.production | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")

PELAYO_15='cmknwt8ra0009nozl69zruwje'
PELAYO_17='cmlgk7tlu00a9noxlkotkiqwe'

echo "=== Pelayo 17 (garajes mdez pelayo 17) → Pelayo 17 ==="
psql "$DBURL" -c "
UPDATE accounting_transactions
SET \\"buildingId\\" = '$PELAYO_17'
WHERE \\"buildingId\\" IS NULL
  AND (concepto ILIKE '%pelayo 17%' OR concepto ILIKE '%mdez pelayo 17%' OR concepto ILIKE '%pelayo, 17%' OR concepto ILIKE '%pelayo,17%' OR concepto ILIKE '%m.dez pelayo 17%');
"

echo "=== Pelayo 15 explícito → Pelayo 15 ==="
psql "$DBURL" -c "
UPDATE accounting_transactions
SET \\"buildingId\\" = '$PELAYO_15'
WHERE \\"buildingId\\" IS NULL
  AND (concepto ILIKE '%pelayo 15%' OR concepto ILIKE '%pelayo, 15%' OR concepto ILIKE '%pelayo,15%' OR concepto ILIKE '%m.pelayo 15%' OR concepto ILIKE '%mdez pelayo 15%' OR concepto ILIKE '%menéndez pelayo 15%' OR concepto ILIKE '%menendez pelayo 15%');
"

echo "=== Apuntes con códigos de subcuenta específicos del Pelayo 15 (752000100x) → Pelayo 15 ==="
psql "$DBURL" -c "
UPDATE accounting_transactions
SET \\"buildingId\\" = '$PELAYO_15'
WHERE \\"buildingId\\" IS NULL
  AND subcuenta IN ('7520001001','7520001002','7520001003','7520001004','7520001005','7520001006','7520004014');
"

echo "=== Apuntes con códigos de subcuenta de garajes Pelayo 17 (752000900x) → Pelayo 17 ==="
psql "$DBURL" -c "
UPDATE accounting_transactions
SET \\"buildingId\\" = '$PELAYO_17'
WHERE \\"buildingId\\" IS NULL
  AND (subcuenta LIKE '7520009%' OR subcuenta LIKE '6811009%')
  AND (concepto ILIKE '%pelayo%' OR concepto ILIKE '%mdez%' OR concepto ILIKE '%menendez%' OR concepto ILIKE '%menéndez%');
"

echo "=== Conceptos que mencionan unidades específicas Pelayo 15 ==="
psql "$DBURL" -c "
UPDATE accounting_transactions
SET \\"buildingId\\" = '$PELAYO_15'
WHERE \\"buildingId\\" IS NULL
  AND (
    concepto ILIKE '%4ºDcha%pelayo%' OR concepto ILIKE '%5ºático%pelayo%' OR
    concepto ILIKE '%5ºatico%pelayo%' OR concepto ILIKE '%1ºDcha%pelayo%' OR
    concepto ILIKE '%4d%pelayo%' OR concepto ILIKE '%local m.pelayo%' OR
    concepto ILIKE '%fibra menendez pelayo%' OR concepto ILIKE '%fibra menéndez pelayo%' OR
    concepto ILIKE '%luz local menendez pelayo%' OR concepto ILIKE '%luz menendez pelayo%'
  );
"

echo ""
echo "=== Estado final ==="
psql "$DBURL" -c "
SELECT b.id, b.nombre, COUNT(at.*) AS apuntes, SUM(at.monto)::numeric(12,2) AS total_eur
FROM buildings b
LEFT JOIN accounting_transactions at ON at.\\"buildingId\\" = b.id AND at.fecha >= '2026-01-01'
WHERE b.nombre ILIKE '%pelayo%' OR b.direccion ILIKE '%pelayo%'
GROUP BY b.id, b.nombre
ORDER BY apuntes DESC;
"

echo ""
echo "=== Pelayo 15 — desglose 2026 ==="
psql "$DBURL" -c "
SELECT tipo, categoria, COUNT(*), SUM(monto)::numeric(12,2) AS total
FROM accounting_transactions
WHERE \\"buildingId\\" = '$PELAYO_15' AND fecha >= '2026-01-01'
GROUP BY tipo, categoria
ORDER BY tipo, total DESC;
"

echo ""
echo "=== Pelayo 17 — desglose 2026 ==="
psql "$DBURL" -c "
SELECT tipo, categoria, COUNT(*), SUM(monto)::numeric(12,2) AS total
FROM accounting_transactions
WHERE \\"buildingId\\" = '$PELAYO_17' AND fecha >= '2026-01-01'
GROUP BY tipo, categoria
ORDER BY tipo, total DESC;
"

echo ""
echo "=== Apuntes Pelayo HUÉRFANOS pendientes ==="
psql "$DBURL" -c "
SELECT COUNT(*), SUM(monto)::numeric(12,2)
FROM accounting_transactions
WHERE \\"buildingId\\" IS NULL
  AND fecha >= '2026-01-01'
  AND (concepto ILIKE '%pelayo%' OR concepto ILIKE '%menendez%' OR concepto ILIKE '%menéndez%');
"
"""
stdin, stdout, _ = c.exec_command(cmd, timeout=120)
print(stdout.read().decode())
c.close()
