#!/usr/bin/env python3
"""
Mergea todos los buildings duplicados (mismo RC catastral 14 chars) en el
portfolio Vidaro. Mantiene el que más unidades tiene.

Casos detectados (Vidaro abril 2026):
- 0749012VK4704H: Reina (16 viviendas) ← Locales Reina 15 (5 locales)
- 4977209VK4747F: Hernandez de Tejada (15 vivs) ← Garajes Hdez Tejada 6 (10 garajes)
- 3023207UM7532S: Menendez Pelayo (3 vivs) + Local M.P. 15 (1 local) ← YA MIGRADO
- 1397301YH5619N: Apartamentos Gemelos II (X) ← Apartamentos Gemelos 20 (Y)
"""
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=10)

# Para cada grupo: ver, decidir keep, migrar
sql = '''
DBURL=$(grep '^DATABASE_URL=' /opt/inmova-app/.env.production | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")

# Lista los grupos con sus contadores
psql "$DBURL" -t -c "
SELECT b.\\"referenciaCatastral\\" as rc, b.id, b.nombre,
       (SELECT COUNT(*) FROM units u WHERE u.\\"buildingId\\" = b.id) AS unidades
FROM buildings b
WHERE b.\\"companyId\\" IN ('cmkctneuh0001nokn7nvhuweq', 'c65159283deeaf6815f8eda95', 'cef19f55f7b6ce0637d5ffb53')
  AND b.\\"referenciaCatastral\\" IS NOT NULL
  AND b.\\"referenciaCatastral\\" IN (
    SELECT \\"referenciaCatastral\\" FROM buildings
    WHERE \\"companyId\\" IN ('cmkctneuh0001nokn7nvhuweq', 'c65159283deeaf6815f8eda95', 'cef19f55f7b6ce0637d5ffb53')
      AND \\"referenciaCatastral\\" IS NOT NULL
    GROUP BY \\"referenciaCatastral\\" HAVING COUNT(*) > 1
  )
ORDER BY rc, unidades DESC;
"
'''
stdin, stdout, _ = c.exec_command(sql, timeout=30)
output = stdout.read().decode()
print("=== Grupos detectados ===")
print(output)

# Parsear filas
groups = {}
for line in output.split('\n'):
    line = line.strip()
    if not line or '|' not in line:
        continue
    parts = [p.strip() for p in line.split('|')]
    if len(parts) < 4:
        continue
    rc = parts[0]
    bid = parts[1]
    nombre = parts[2]
    try:
        units = int(parts[3])
    except ValueError:
        continue
    groups.setdefault(rc, []).append((units, bid, nombre))

print("\n=== Plan de migración ===")
for rc, lst in groups.items():
    if len(lst) < 2:
        continue
    # Ordenar por unidades DESC (ya viene ordenado pero garantizamos)
    lst.sort(reverse=True)
    keep = lst[0]
    sources = lst[1:]
    print(f"\nRC {rc}:")
    print(f"  KEEP: {keep[1]} '{keep[2]}' ({keep[0]} unidades)")
    for s in sources:
        print(f"  MERGE: {s[1]} '{s[2]}' ({s[0]} unidades) → migrar")

# Ejecutar
print("\n=== Ejecutando merges ===")
for rc, lst in groups.items():
    if len(lst) < 2:
        continue
    lst.sort(reverse=True)
    keep_id = lst[1][1] if False else lst[0][1]
    for src_units, src_id, src_nombre in lst[1:]:
        print(f"\n→ Migrando '{src_nombre}' ({src_id}) → keep ({keep_id})")
        sql_migrate = f'''
DBURL=$(grep '^DATABASE_URL=' /opt/inmova-app/.env.production | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
psql "$DBURL" -c "
BEGIN;
UPDATE units SET \\"buildingId\\" = '{keep_id}' WHERE \\"buildingId\\" = '{src_id}';
UPDATE expenses SET \\"buildingId\\" = '{keep_id}' WHERE \\"buildingId\\" = '{src_id}';
UPDATE documents SET \\"buildingId\\" = '{keep_id}' WHERE \\"buildingId\\" = '{src_id}';
UPDATE insurances SET \\"buildingId\\" = '{keep_id}' WHERE \\"buildingId\\" = '{src_id}';
COMMIT;

SELECT 'Resultado:' as info;
SELECT b.id, b.nombre, (SELECT COUNT(*) FROM units u WHERE u.\\"buildingId\\" = b.id) AS unidades
FROM buildings b WHERE b.id IN ('{keep_id}', '{src_id}');
"
'''
        stdin, stdout, _ = c.exec_command(sql_migrate, timeout=30)
        print(stdout.read().decode())

c.close()
print("\n✅ DONE")
