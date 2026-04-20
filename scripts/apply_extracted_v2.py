#!/usr/bin/env python3
"""Lanza script Python en servidor (sin f-string complejos)."""
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=15)

# Escribir el script en disco directamente con SFTP (sin escape problems)
script_content = """#!/usr/bin/env python3
import json
import re
import os
import psycopg2

with open("/opt/inmova-app/.env.production") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        if not re.match(r"^[A-Z][A-Z0-9_]+$", k):
            continue
        os.environ.setdefault(k, v.strip().strip('"').strip("'"))

VIDARO = ('cef19f55f7b6ce0637d5ffb53', 'c65159283deeaf6815f8eda95', 'cmkctneuh0001nokn7nvhuweq')

conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur = conn.cursor()

# Leer documents Vidaro con extracción
cur.execute(\"\"\"
SELECT d.id, d.\\"buildingId\\", d.\\"unitId\\", d.\\"contractId\\", d.\\"tenantId\\", d.descripcion
FROM documents d
LEFT JOIN buildings b ON b.id = d.\\"buildingId\\"
LEFT JOIN units u ON u.id = d.\\"unitId\\"
LEFT JOIN tenants t ON t.id = d.\\"tenantId\\"
WHERE d.descripcion LIKE %s
  AND (b.\\"companyId\\" = ANY(%s) OR u.\\"buildingId\\" IN (SELECT id FROM buildings WHERE \\"companyId\\" = ANY(%s)) OR t.\\"companyId\\" = ANY(%s))
\"\"\", ('%EXTRACTED_DATA_JSON%', list(VIDARO), list(VIDARO), list(VIDARO)))

docs = cur.fetchall()
print(f"Total documents con extracción: {len(docs)}")

stats = {
    'iban_updated': 0,
    'email_updated': 0,
    'tel_updated': 0,
    'contracts_updated': 0,
    'matched_tenants': 0,
}

for doc_id, bid, uid, cid, tid, desc in docs:
    m = re.search(r"<!--EXTRACTED_DATA_JSON-->\\s*(\\{.*?\\})\\s*<!--/EXTRACTED_DATA_JSON-->", desc or "", re.DOTALL)
    if not m:
        m = re.search(r"<!--EXTRACTED_DATA_JSON-->\\s*(\\{[\\s\\S]+?\\})\\s*$", desc or "", re.DOTALL)
        if not m:
            continue
    try:
        data = json.loads(m.group(1))
    except Exception:
        continue

    tipo = data.get("tipo", "")

    # ============ Contrato alquiler ============
    if "contrato" in tipo:
        nif = data.get("arrendatarioNif", "") or ""
        # Match tenant por NIF
        if nif and not tid:
            nif_clean = re.sub(r"[^A-Z0-9]", "", nif.upper())
            cur2 = conn.cursor()
            cur2.execute("SELECT id FROM tenants WHERE UPPER(REGEXP_REPLACE(dni, '[^A-Z0-9]', '', 'g')) = %s AND \\"companyId\\" = ANY(%s) LIMIT 1", (nif_clean, list(VIDARO)))
            row = cur2.fetchone()
            if row:
                tid = row[0]
                cur2.execute("UPDATE documents SET \\"tenantId\\"=%s WHERE id=%s", (tid, doc_id))
                conn.commit()
                stats['matched_tenants'] += 1
            cur2.close()

        # Update tenant fields
        if tid:
            cur2 = conn.cursor()
            iban = (data.get("iban") or "").strip()
            email = (data.get("arrendatarioEmail") or "").strip()
            tel = (data.get("arrendatarioTelefono") or "").strip()

            if iban:
                iban_clean = re.sub(r"\\s", "", iban)
                cur2.execute("UPDATE tenants SET iban=%s, \\"updatedAt\\"=NOW() WHERE id=%s AND (iban IS NULL OR iban='')", (iban_clean, tid))
                stats['iban_updated'] += cur2.rowcount
            if email:
                cur2.execute("UPDATE tenants SET email=%s, \\"updatedAt\\"=NOW() WHERE id=%s AND (email IS NULL OR email='')", (email, tid))
                stats['email_updated'] += cur2.rowcount
            if tel:
                cur2.execute("UPDATE tenants SET telefono=%s, \\"updatedAt\\"=NOW() WHERE id=%s AND (telefono IS NULL OR telefono='')", (tel, tid))
                stats['tel_updated'] += cur2.rowcount
            conn.commit()
            cur2.close()

        # Update contract
        if cid:
            cur2 = conn.cursor()
            sets = []
            params = []
            try:
                if data.get("rentaMensual"):
                    rm = float(data["rentaMensual"])
                    if rm > 0:
                        sets.append('"rentaMensual" = %s')
                        params.append(rm)
            except Exception: pass
            try:
                if data.get("fianza"):
                    fz = float(data["fianza"])
                    if fz > 0:
                        sets.append('deposito = %s')
                        params.append(fz)
            except Exception: pass
            if data.get("iban"):
                ib = re.sub(r"\\s", "", data["iban"])
                sets.append('iban = %s')
                params.append(ib)
            if sets:
                params.append(cid)
                set_str = ', '.join(sets)
                try:
                    cur2.execute('UPDATE contracts SET ' + set_str + ', "updatedAt"=NOW() WHERE id=%s', params)
                    if cur2.rowcount > 0:
                        stats['contracts_updated'] += cur2.rowcount
                    conn.commit()
                except Exception as e:
                    conn.rollback()
            cur2.close()

    # ============ SEPA ============
    elif tipo == "sepa":
        nif = (data.get("titularNif") or "")
        iban = (data.get("iban") or "")
        if iban and nif:
            cur2 = conn.cursor()
            iban_clean = re.sub(r"\\s", "", iban)
            nif_clean = re.sub(r"[^A-Z0-9]", "", nif.upper())
            try:
                cur2.execute(\"\"\"
                UPDATE tenants SET iban = %s, \\"updatedAt\\" = NOW()
                WHERE (iban IS NULL OR iban = '')
                  AND UPPER(REGEXP_REPLACE(dni, '[^A-Z0-9]', '', 'g')) = %s
                  AND \\"companyId\\" = ANY(%s)
                \"\"\", (iban_clean, nif_clean, list(VIDARO)))
                if cur2.rowcount > 0:
                    stats['iban_updated'] += cur2.rowcount
                conn.commit()
            except Exception:
                conn.rollback()
            cur2.close()

print("RESULTADO:")
for k, v in stats.items():
    print(f"  {k}: {v}")

cur.close()
conn.close()
"""

sftp = c.open_sftp()
with sftp.open('/tmp/apply_v2.py', 'w') as f:
    f.write(script_content)
sftp.close()

cmd = "python3 /tmp/apply_v2.py 2>&1 | tail -25"
stdin, stdout, _ = c.exec_command(cmd, timeout=180)
print(stdout.read().decode())
c.close()
