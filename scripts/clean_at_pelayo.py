#!/usr/bin/env python3
"""
Limpia los AccountingTransaction mal asignados a buildings huérfanos
o erróneos en el grupo Vidaro:

1. Apuntes con concepto que contiene "Pelayo 15" deben ir al building
   principal Menendez Pelayo (cmknwt8ra0009nozl69zruwje), no al duplicado
   vacío (cmlgk7tni00bhnoxletjd1pfe) ni a "Naves Avda Cuba" (cmlgk7tnq00bl...).

2. Apuntes con concepto "Pelayo 17" deben ir al building "Garajes Menéndez
   Pelayo 17" (cmlgk7tlu00a9noxlkotkiqwe), no a "Pelayo 15".

3. Limpiar buildingId NULL en apuntes que claramente identifican un edificio.
"""
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=10)

cmd = """
DBURL=$(grep '^DATABASE_URL=' /opt/inmova-app/.env.production | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")

# Building principal "Menendez Pelayo" (Calle Pelayo 15, Viroda)
PELAYO_15='cmknwt8ra0009nozl69zruwje'
# Building duplicado vacío (Local Pelayo 15, Rovida)
PELAYO_15_DUP='cmlgk7tni00bhnoxletjd1pfe'
# Building "Garajes Menéndez Pelayo 17" (Pelayo 17, Rovida)
PELAYO_17='cmlgk7tlu00a9noxlkotkiqwe'
# Building erróneamente recipiendo apuntes Pelayo (Naves Cuba)
NAVES_CUBA='cmlgk7tnq00blnoxl95m2vd1h'

echo "=== Estado actual antes de limpieza ==="
psql "$DBURL" -c "
SELECT b.id, b.nombre, COUNT(at.*) AS apuntes
FROM buildings b
LEFT JOIN accounting_transactions at ON at.\\"buildingId\\" = b.id
WHERE b.id IN ('$PELAYO_15','$PELAYO_15_DUP','$PELAYO_17','$NAVES_CUBA')
GROUP BY b.id, b.nombre
ORDER BY apuntes DESC;
"

echo ""
echo "=== Re-asignar apuntes ERRÓNEAMENTE en NAVES CUBA con texto Pelayo ==="
psql "$DBURL" -c "
SELECT COUNT(*) AS apuntes_erroneos
FROM accounting_transactions
WHERE \\"buildingId\\" = '$NAVES_CUBA'
  AND (concepto ILIKE '%pelayo%' OR concepto ILIKE '%menendez%' OR concepto ILIKE '%menéndez%');
"

# 1. Pelayo 17 explícito → Garajes Pelayo 17
psql "$DBURL" -c "
UPDATE accounting_transactions
SET \\"buildingId\\" = '$PELAYO_17'
WHERE \\"buildingId\\" IN ('$NAVES_CUBA', '$PELAYO_15_DUP', '$PELAYO_15')
  AND (concepto ILIKE '%pelayo, 17%' OR concepto ILIKE '%pelayo,17%' OR concepto ILIKE '%pelayo 17%' OR concepto ILIKE '%pelayo nº 17%');
"

# 2. Pelayo 15 explícito (con número) → Pelayo 15 principal
psql "$DBURL" -c "
UPDATE accounting_transactions
SET \\"buildingId\\" = '$PELAYO_15'
WHERE \\"buildingId\\" IN ('$NAVES_CUBA', '$PELAYO_15_DUP')
  AND (concepto ILIKE '%pelayo, 15%' OR concepto ILIKE '%pelayo,15%' OR concepto ILIKE '%pelayo 15%' OR concepto ILIKE '%pelayo nº 15%' OR concepto ILIKE '%pelayo, 15, bajo%' OR concepto ILIKE '%m.pelayo 15%' OR concepto ILIKE '%m. pelayo 15%');
"

# 3. Apuntes con MP/M.P./M.PELAYO sin número claro → asignar al PRINCIPAL Pelayo 15
#    (es la regla de negocio: cuando solo dice "M.PELAYO" o "MENENDEZ PELAYO" sin
#    número, se asume Pelayo 15 que es el edificio matriz)
psql "$DBURL" -c "
UPDATE accounting_transactions
SET \\"buildingId\\" = '$PELAYO_15'
WHERE \\"buildingId\\" = '$NAVES_CUBA'
  AND (concepto ILIKE '%m.pelayo%' OR concepto ILIKE '%m. pelayo%' OR concepto ILIKE '%menendez pelayo%' OR concepto ILIKE '%menéndez pelayo%');
"

# 4. Re-asignar apuntes específicos de unidades del Pelayo 15 (5ºático, 4D, 1ºDcha, Local y Sótano)
psql "$DBURL" -c "
UPDATE accounting_transactions
SET \\"buildingId\\" = '$PELAYO_15'
WHERE \\"buildingId\\" IN ('$NAVES_CUBA', '$PELAYO_15_DUP')
  AND (concepto ILIKE '%5ºático C/Menendez%' OR concepto ILIKE '%4ºDcha%Menendez%' OR concepto ILIKE '%4ºDcha%Pelayo%' OR concepto ILIKE '%1ºDcha%Pelayo%' OR concepto ILIKE '%5ºatico%pelayo%' OR concepto ILIKE '%5ºático%pelayo%');
"

# 5. Apuntes del building duplicado vacío → mover al principal
psql "$DBURL" -c "
UPDATE accounting_transactions
SET \\"buildingId\\" = '$PELAYO_15'
WHERE \\"buildingId\\" = '$PELAYO_15_DUP';
"

echo ""
echo "=== Estado DESPUÉS de limpieza ==="
psql "$DBURL" -c "
SELECT b.id, b.nombre, COUNT(at.*) AS apuntes, SUM(at.monto)::numeric(12,2) AS total
FROM buildings b
LEFT JOIN accounting_transactions at ON at.\\"buildingId\\" = b.id AND at.fecha >= '2026-01-01'
WHERE b.id IN ('$PELAYO_15','$PELAYO_15_DUP','$PELAYO_17','$NAVES_CUBA')
GROUP BY b.id, b.nombre
ORDER BY apuntes DESC;
"

echo ""
echo "=== Detalles Pelayo 15 (principal) ==="
psql "$DBURL" -c "
SELECT tipo, categoria, COUNT(*), SUM(monto)::numeric(12,2) AS total
FROM accounting_transactions
WHERE \\"buildingId\\" = '$PELAYO_15' AND fecha >= '2026-01-01'
GROUP BY tipo, categoria
ORDER BY tipo, total DESC;
"
"""
stdin, stdout, _ = c.exec_command(cmd, timeout=120)
print(stdout.read().decode())
c.close()
