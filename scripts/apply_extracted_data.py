#!/usr/bin/env python3
"""
Aplica datos ya extraídos en Document.descripcion a entidades Inmova.

Lee los Documents Vidaro con JSON extraído y trata de matchear:
- Contrato alquiler con NIF arrendatario → Tenant (por DNI/email/nombre)
  → Si match: actualizar Tenant.iban, Tenant.telefono, Tenant.email
  → Si tiene contractId asociado a la unit: actualizar Contract.rentaMensual,
    deposito, fianza, fechaInicio, fechaFin, iban
- SEPA con titular NIF → Tenant.iban
- Fianza con importe → si ya hay contract activo en building, sugerir update
"""
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=15)

script = '''#!/usr/bin/env python3
import json
import re
import os
import psycopg2

# Cargar env
with open("/opt/inmova-app/.env.production") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line: continue
        k, _, v = line.partition("=")
        if not re.match(r"^[A-Z][A-Z0-9_]+$", k): continue
        os.environ.setdefault(k, v.strip().strip(\'"\').strip("\'"))

conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur = conn.cursor()

# Leer documents Vidaro con extracción
cur.execute("""
SELECT d.id, d.\\"buildingId\\", d.\\"unitId\\", d.\\"contractId\\", d.\\"tenantId\\", d.descripcion
FROM documents d
LEFT JOIN buildings b ON b.id = d.\\"buildingId\\"
LEFT JOIN units u ON u.id = d.\\"unitId\\"
LEFT JOIN tenants t ON t.id = d.\\"tenantId\\"
WHERE d.descripcion LIKE \\'%EXTRACTED_DATA_JSON%\\'
  AND (b.\\"companyId\\" IN (\\'cef19f55f7b6ce0637d5ffb53\\',\\'c65159283deeaf6815f8eda95\\',\\'cmkctneuh0001nokn7nvhuweq\\')
       OR u.\\"buildingId\\" IN (SELECT id FROM buildings WHERE \\"companyId\\" IN (\\'cef19f55f7b6ce0637d5ffb53\\',\\'c65159283deeaf6815f8eda95\\',\\'cmkctneuh0001nokn7nvhuweq\\'))
       OR t.\\"companyId\\" IN (\\'cef19f55f7b6ce0637d5ffb53\\',\\'c65159283deeaf6815f8eda95\\',\\'cmkctneuh0001nokn7nvhuweq\\'))
""")

docs = cur.fetchall()
print(f"Total documents con extracción: {len(docs)}")

tenants_iban_updated = 0
tenants_email_updated = 0
tenants_tel_updated = 0
contracts_updated = 0
matched_tenants_by_nif = 0

for doc_id, bid, uid, cid, tid, desc in docs:
    # Extraer JSON
    m = re.search(r"<!--EXTRACTED_DATA_JSON-->\\s*(\\{.*?\\})\\s*<!--/EXTRACTED_DATA_JSON-->", desc or "", re.DOTALL)
    if not m:
        # Intentar formato más laxo
        m = re.search(r"<!--EXTRACTED_DATA_JSON-->\\s*(\\{[\\s\\S]+?\\})\\s*$", desc or "", re.DOTALL)
        if not m:
            continue
    
    try:
        data = json.loads(m.group(1))
    except Exception:
        continue
    
    tipo = data.get("tipo")
    
    # ============ Contrato alquiler ============
    if tipo == "contrato_alquiler" or tipo == "anexo_contrato_alquiler":
        # Match tenant por NIF arrendatario
        nif = data.get("arrendatarioNif")
        if nif and not tid:
            cur2 = conn.cursor()
            nif_clean = re.sub(r"[^A-Z0-9]", "", nif.upper())
            cur2.execute("""
                SELECT id FROM tenants 
                WHERE UPPER(REGEXP_REPLACE(dni, \\'[^A-Z0-9]\\', \\'\\', \\'g\\')) = %s
                  AND \\"companyId\\" IN (\\'cef19f55f7b6ce0637d5ffb53\\',\\'c65159283deeaf6815f8eda95\\',\\'cmkctneuh0001nokn7nvhuweq\\')
                LIMIT 1
            """, (nif_clean,))
            row = cur2.fetchone()
            if row:
                tid = row[0]
                # Vincular doc a tenant
                cur2.execute("UPDATE documents SET \\"tenantId\\"=%s WHERE id=%s", (tid, doc_id))
                conn.commit()
                matched_tenants_by_nif += 1
            cur2.close()
        
        # Si tenemos tenantId: actualizar IBAN/email/tel
        if tid:
            cur2 = conn.cursor()
            iban = data.get("iban")
            email = data.get("arrendatarioEmail")
            tel = data.get("arrendatarioTelefono")
            
            updates = []
            params = []
            
            if iban:
                iban_clean = re.sub(r"\\s", "", iban)
                cur2.execute("SELECT iban FROM tenants WHERE id=%s", (tid,))
                cur_iban = cur2.fetchone()
                if cur_iban and (not cur_iban[0] or cur_iban[0] == ""):
                    updates.append("iban = %s")
                    params.append(iban_clean)
                    tenants_iban_updated += 1
            
            if email:
                cur2.execute("SELECT email FROM tenants WHERE id=%s", (tid,))
                cur_em = cur2.fetchone()
                if cur_em and (not cur_em[0] or cur_em[0] == ""):
                    updates.append("email = %s")
                    params.append(email)
                    tenants_email_updated += 1
            
            if tel:
                cur2.execute("SELECT telefono FROM tenants WHERE id=%s", (tid,))
                cur_t = cur2.fetchone()
                if cur_t and (not cur_t[0] or cur_t[0] == ""):
                    updates.append("telefono = %s")
                    params.append(tel)
                    tenants_tel_updated += 1
            
            if updates:
                params.append(tid)
                try:
                    cur2.execute(f"UPDATE tenants SET {\\', \\'.join(updates)}, \\"updatedAt\\"=NOW() WHERE id=%s", params)
                    conn.commit()
                except Exception as e:
                    conn.rollback()
            cur2.close()
        
        # Si tenemos contractId: actualizar Contract
        if cid:
            cur2 = conn.cursor()
            updates = []
            params = []
            
            if data.get("rentaMensual"):
                try:
                    rm = float(data["rentaMensual"])
                    if rm > 0:
                        cur2.execute("SELECT \\"rentaMensual\\" FROM contracts WHERE id=%s", (cid,))
                        cur_rm = cur2.fetchone()
                        if cur_rm and (not cur_rm[0] or cur_rm[0] == 0):
                            updates.append("\\"rentaMensual\\" = %s")
                            params.append(rm)
                except Exception: pass
            
            if data.get("fianza"):
                try:
                    fz = float(data["fianza"])
                    if fz > 0:
                        cur2.execute("SELECT deposito FROM contracts WHERE id=%s", (cid,))
                        cur_dp = cur2.fetchone()
                        if cur_dp and (not cur_dp[0] or cur_dp[0] == 0):
                            updates.append("deposito = %s")
                            params.append(fz)
                except Exception: pass
            
            if data.get("iban"):
                ib = re.sub(r"\\s", "", data["iban"])
                cur2.execute("SELECT iban FROM contracts WHERE id=%s", (cid,))
                cur_ib = cur2.fetchone()
                if cur_ib and (not cur_ib[0] or cur_ib[0] == ""):
                    updates.append("iban = %s")
                    params.append(ib)
            
            if updates:
                params.append(cid)
                try:
                    cur2.execute(f"UPDATE contracts SET {\\', \\'.join(updates)}, \\"updatedAt\\"=NOW() WHERE id=%s", params)
                    conn.commit()
                    contracts_updated += 1
                except Exception as e:
                    conn.rollback()
            cur2.close()
    
    # ============ SEPA ============
    elif tipo == "sepa":
        nif = data.get("titularNif")
        iban = data.get("iban")
        if iban and nif:
            cur2 = conn.cursor()
            iban_clean = re.sub(r"\\s", "", iban)
            nif_clean = re.sub(r"[^A-Z0-9]", "", nif.upper())
            try:
                cur2.execute("""
                UPDATE tenants SET iban = %s, \\"updatedAt\\" = NOW()
                WHERE (iban IS NULL OR iban = \\'\\')
                  AND UPPER(REGEXP_REPLACE(dni, \\'[^A-Z0-9]\\', \\'\\', \\'g\\')) = %s
                  AND \\"companyId\\" IN (\\'cef19f55f7b6ce0637d5ffb53\\',\\'c65159283deeaf6815f8eda95\\',\\'cmkctneuh0001nokn7nvhuweq\\')
                """, (iban_clean, nif_clean))
                if cur2.rowcount > 0:
                    tenants_iban_updated += cur2.rowcount
                conn.commit()
            except Exception as e:
                conn.rollback()
            cur2.close()

print(f"\\n=== RESULTADO ===")
print(f"Documents con extracción: {len(docs)}")
print(f"Tenants matched por NIF: {matched_tenants_by_nif}")
print(f"Tenants IBAN actualizados: {tenants_iban_updated}")
print(f"Tenants email actualizados: {tenants_email_updated}")
print(f"Tenants tel actualizados: {tenants_tel_updated}")
print(f"Contracts actualizados: {contracts_updated}")

cur.close()
conn.close()
'''

sftp = c.open_sftp()
with sftp.open('/tmp/apply_extracted.py', 'w') as f:
    f.write(script)
sftp.close()

cmd = "python3 /tmp/apply_extracted.py 2>&1 | tail -30"
stdin, stdout, _ = c.exec_command(cmd, timeout=120)
print(stdout.read().decode())
c.close()
