#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('157.180.119.236', username='root', password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=', timeout=15)

def run_sql(label, sql):
    # Write SQL to temp file, then execute with psql -f
    write_cmd = f"cat > /tmp/_q.sql << 'ENDSQL'\n{sql}\nENDSQL"
    client.exec_command(write_cmd, timeout=10)
    import time; time.sleep(0.3)
    exec_cmd = 'PGPASSWORD=InmovaSecure2026 psql -h 127.0.0.1 -U inmova_user -d inmova_production -t -A -f /tmp/_q.sql'
    _, stdout, stderr = client.exec_command(exec_cmd, timeout=30)
    stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    print(f"\n=== {label} ===")
    if out: print(out)
    elif err: print(f"ERR: {err[:300]}")
    else: print("(vacío)")
    return out

run_sql("Empresas grupo", '''SELECT id, nombre, "parentCompanyId" FROM company WHERE nombre ILIKE '%rovida%' OR nombre ILIKE '%vidaro%' OR nombre ILIKE '%viroda%';''')

run_sql("Docs Rovida", '''SELECT d.nombre, d.tipo, LEFT(d."cloudStoragePath",80) as path FROM documents d JOIN document_folders df ON d."folderId"=df.id WHERE df."companyId" IN (SELECT id FROM company WHERE nombre ILIKE '%rovida%');''')

run_sql("Carpetas Rovida", '''SELECT nombre, color FROM document_folders WHERE "companyId" IN (SELECT id FROM company WHERE nombre ILIKE '%rovida%');''')

run_sql("Accesos dvillagra", '''SELECT c.nombre, uca."roleInCompany", uca.activo FROM user_company_access uca JOIN company c ON uca."companyId"=c.id WHERE uca."userId"=(SELECT id FROM users WHERE email='dvillagra@vidaroinversiones.com');''')

run_sql("Usuario dvillagra", '''SELECT email, role, "companyId" FROM users WHERE email='dvillagra@vidaroinversiones.com';''')

run_sql("Tags Rovida", '''SELECT nombre, color FROM document_tags WHERE "companyId" IN (SELECT id FROM company WHERE nombre ILIKE '%rovida%');''')

client.close()
