#!/usr/bin/env python3
"""
Aplica la columna Unit.ownerCompanyId en producción y hace backfill correcto:

1. Añade columna `ownerCompanyId TEXT NULL` a la tabla `units`
2. Añade FK opcional a `company.id`
3. Añade índice
4. BACKFILL inicial: heredar Building.companyId
5. CORRECCIÓN GRUPO VIDARO: las unidades migradas el día anterior por el merge
   de duplicados deben tener el ownerCompanyId de su building ORIGINAL,
   no del building destino.

Casos cross-company a corregir:
- Reina (keep Viroda):
    - 2 locales 2026-02-10 → ownerCompanyId = Rovida
- Menendez Pelayo (keep Viroda):
    - Local y Sótano (2026-02-10) → ownerCompanyId = Rovida
- Hernandez de Tejada (keep Rovida):
    - 12 viviendas 2026-01-22 → ownerCompanyId = Viroda
"""
import paramiko

VIDARO = "c65159283deeaf6815f8eda95"
VIRODA = "cmkctneuh0001nokn7nvhuweq"
ROVIDA = "cef19f55f7b6ce0637d5ffb53"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=10)

print("=== Paso 1: añadir columna ===")
sql = '''
DBURL=$(grep '^DATABASE_URL=' /opt/inmova-app/.env.production | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
psql "$DBURL" -c "
ALTER TABLE units ADD COLUMN IF NOT EXISTS \\"ownerCompanyId\\" TEXT;
DO \\$\\$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'units_ownerCompanyId_fkey') THEN
    ALTER TABLE units ADD CONSTRAINT \\"units_ownerCompanyId_fkey\\"
      FOREIGN KEY (\\"ownerCompanyId\\") REFERENCES company(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END \\$\\$;
CREATE INDEX IF NOT EXISTS \\"units_ownerCompanyId_idx\\" ON units(\\"ownerCompanyId\\");
"
'''
stdin, stdout, _ = c.exec_command(sql, timeout=30)
print(stdout.read().decode())

print("=== Paso 2: BACKFILL inicial (heredar Building.companyId) ===")
sql = '''
DBURL=$(grep '^DATABASE_URL=' /opt/inmova-app/.env.production | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
psql "$DBURL" -c "
UPDATE units u
SET \\"ownerCompanyId\\" = b.\\"companyId\\"
FROM buildings b
WHERE b.id = u.\\"buildingId\\" AND u.\\"ownerCompanyId\\" IS NULL;

SELECT COUNT(*) AS units_con_owner FROM units WHERE \\"ownerCompanyId\\" IS NOT NULL;
SELECT COUNT(*) AS units_sin_owner FROM units WHERE \\"ownerCompanyId\\" IS NULL;
"
'''
stdin, stdout, _ = c.exec_command(sql, timeout=60)
print(stdout.read().decode())

print(f"=== Paso 3: corrección cross-company en grupo Vidaro ===")

# Reina: 2 locales (2026-02-10) que estaban en Locales Reina 15 (Rovida)
print("\n--- Reina: 2 locales → Rovida ---")
sql = f'''
DBURL=$(grep '^DATABASE_URL=' /opt/inmova-app/.env.production | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
psql "$DBURL" -c "
UPDATE units SET \\"ownerCompanyId\\" = '{ROVIDA}'
WHERE id IN ('cmlgk7tl7009xnoxlo8pop3af', 'cmlgk7tla009znoxl7lxflf6y');

SELECT u.id, u.numero, u.tipo, u.\\"ownerCompanyId\\", c.nombre
FROM units u JOIN company c ON c.id = u.\\"ownerCompanyId\\"
WHERE u.id IN ('cmlgk7tl7009xnoxlo8pop3af', 'cmlgk7tla009znoxl7lxflf6y');
"
'''
stdin, stdout, _ = c.exec_command(sql, timeout=20)
print(stdout.read().decode())

# Menendez Pelayo: Local y Sótano que era de Rovida
print("\n--- Menéndez Pelayo: Local y Sótano → Rovida ---")
sql = f'''
DBURL=$(grep '^DATABASE_URL=' /opt/inmova-app/.env.production | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
psql "$DBURL" -c "
UPDATE units SET \\"ownerCompanyId\\" = '{ROVIDA}'
WHERE id = 'cmlgk7tnm00bjnoxlabu8zgph';

SELECT u.id, u.numero, u.tipo, u.\\"ownerCompanyId\\", c.nombre
FROM units u JOIN company c ON c.id = u.\\"ownerCompanyId\\"
WHERE u.id = 'cmlgk7tnm00bjnoxlabu8zgph';
"
'''
stdin, stdout, _ = c.exec_command(sql, timeout=20)
print(stdout.read().decode())

# Hdez de Tejada: 12 viviendas de la primera carga (2026-01-22) eran de Viroda
print("\n--- Hernández de Tejada: 12 viviendas → Viroda ---")
sql = f'''
DBURL=$(grep '^DATABASE_URL=' /opt/inmova-app/.env.production | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
psql "$DBURL" -c "
UPDATE units SET \\"ownerCompanyId\\" = '{VIRODA}'
WHERE \\"buildingId\\" = 'cmlgk7tgr006hnoxlisolxcfc' AND tipo = 'vivienda';

SELECT u.id, u.numero, u.tipo, u.\\"ownerCompanyId\\", c.nombre
FROM units u JOIN company c ON c.id = u.\\"ownerCompanyId\\"
WHERE u.\\"buildingId\\" = 'cmlgk7tgr006hnoxlisolxcfc' AND u.tipo = 'vivienda'
ORDER BY u.numero;
"
'''
stdin, stdout, _ = c.exec_command(sql, timeout=20)
print(stdout.read().decode())

print("\n=== Paso 4: resumen final por edificio consolidado ===")
sql = '''
DBURL=$(grep '^DATABASE_URL=' /opt/inmova-app/.env.production | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
psql "$DBURL" -c "
SELECT b.nombre AS edificio,
       c.nombre AS gestor,
       u.tipo,
       co.nombre AS propietaria,
       COUNT(*) AS unidades
FROM units u
JOIN buildings b ON b.id = u.\\"buildingId\\"
JOIN company c ON c.id = b.\\"companyId\\"
LEFT JOIN company co ON co.id = u.\\"ownerCompanyId\\"
WHERE b.id IN ('cmknwt8ra0009nozl69zruwje', 'cmknwqivw0005nozlxspif750', 'cmlgk7tgr006hnoxlisolxcfc', 'cmlgk7tp000cbnoxlev57v2da')
GROUP BY b.nombre, c.nombre, u.tipo, co.nombre
ORDER BY b.nombre, u.tipo, co.nombre;
"
'''
stdin, stdout, _ = c.exec_command(sql, timeout=30)
print(stdout.read().decode())

c.close()
print("\n✅ DONE")
