#!/usr/bin/env python3
"""
Migra el local 'Local y Sótano' (cmlgk7tnm00bjnoxlabu8zgph) del building
duplicado 'Local Menéndez Pelayo 15' (cmlgk7tni00bhnoxletjd1pfe) al
building principal 'Menendez Pelayo' (cmknwt8ra0009nozl69zruwje).

Ambos comparten dirección 'C/ Menéndez Pelayo 15, Palencia' y la misma RC
catastral 3023207UM7532S, por lo que son el mismo edificio físico.

Tras migrar, el building duplicado se conserva en BD (no se elimina)
para preservar histórico, pero queda vacío.
"""
import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASS = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
SOURCE_BLD = "cmlgk7tni00bhnoxletjd1pfe"  # 'Local Menéndez Pelayo 15'
TARGET_BLD = "cmknwt8ra0009nozl69zruwje"  # 'Menendez Pelayo'
LOCAL_UNIT = "cmlgk7tnm00bjnoxlabu8zgph"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=10)

print("=== Migrando local al building principal ===")
sql = f'''
DBURL=$(grep '^DATABASE_URL=' /opt/inmova-app/.env.production | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")

# 1. Verificar estado actual
psql "$DBURL" -c "
SELECT 'ANTES:' as estado;
SELECT id, numero, tipo, \\"buildingId\\" FROM units WHERE id = '{LOCAL_UNIT}';
"

# 2. Migrar (transacción)
psql "$DBURL" -c "
BEGIN;
UPDATE units SET \\"buildingId\\" = '{TARGET_BLD}' WHERE id = '{LOCAL_UNIT}';
COMMIT;
"

# 3. Verificar después
psql "$DBURL" -c "
SELECT 'DESPUÉS:' as estado;
SELECT u.id, u.numero, u.tipo, u.\\"buildingId\\", b.nombre
FROM units u JOIN buildings b ON b.id = u.\\"buildingId\\"
WHERE u.id = '{LOCAL_UNIT}';

SELECT 'Total unidades en building principal:' as info;
SELECT u.numero, u.tipo, u.estado FROM units u
WHERE u.\\"buildingId\\" = '{TARGET_BLD}'
ORDER BY u.tipo, u.numero;

SELECT 'Building duplicado quedará vacío:' as info;
SELECT b.id, b.nombre, b.direccion,
       (SELECT COUNT(*) FROM units u WHERE u.\\"buildingId\\" = b.id) AS unidades
FROM buildings b WHERE b.id = '{SOURCE_BLD}';
"
'''
stdin, stdout, _ = c.exec_command(sql, timeout=60)
print(stdout.read().decode())
c.close()
