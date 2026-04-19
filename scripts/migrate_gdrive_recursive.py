#!/usr/bin/env python3
"""
Migración Drive → S3 RECURSIVA y atribuyendo archivos a building correcto.

Estrategia:
1. Las 2 carpetas raíz (CONTRATOS ROVIDA / CONTRATOS VIDARO) contienen subcarpetas
   con nombre del edificio (ej: "OFICINAS MADRID/DISFASA")
2. Hacer BFS recursivo descargando embeddedfolderview de cada nivel
3. Por cada archivo, intentar hacer matching con building en BD por nombre
4. Subir a S3 + crear Document vinculado
"""
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=15)

# Script que se ejecuta en el servidor con todo el código Python
script = '''#!/usr/bin/env python3
"""Recursive Drive → S3 migration."""
import os
import re
import json
import time
import urllib.request
import urllib.error
import subprocess
import psycopg2
from datetime import datetime
import unicodedata

# Cargar env
with open("/opt/inmova-app/.env.production") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        if not re.match(r"^[A-Z][A-Z0-9_]+$", k):
            continue
        v = v.strip().strip('"').strip("'")
        os.environ.setdefault(k, v)

DB_URL = os.environ["DATABASE_URL"]
AWS_BUCKET = os.environ.get("AWS_BUCKET", "inmova")

# Roots
ROOTS = [
    "1V-_dgQVRQNBoY_jsf8VjR9TCeP-DksWf",  # CONTRATOS ROVIDA
    "1W1ioURCrDBSrbfjwxJ6IvZoXCpzI5ghs",  # CONTRATOS VIDARO/VIRODA
]

VIDARO_GROUP = ("cef19f55f7b6ce0637d5ffb53", "c65159283deeaf6815f8eda95", "cmkctneuh0001nokn7nvhuweq")

LOG_PATH = "/tmp/gdrive_recursive.log"

def log(msg):
    with open(LOG_PATH, "a") as f:
        f.write(f"{datetime.now().isoformat()} - {msg}\\n")
    print(msg, flush=True)

def normalize(s):
    if not s:
        return ""
    s = s.lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    return s

# Cargar buildings del grupo
conn = psycopg2.connect(DB_URL)
cur = conn.cursor()
cur.execute(f"""
SELECT id, nombre, direccion FROM buildings
WHERE "companyId" IN {VIDARO_GROUP}
   OR EXISTS (SELECT 1 FROM units u WHERE u."buildingId"=buildings.id AND u."ownerCompanyId" IN {VIDARO_GROUP})
""")
BUILDINGS = cur.fetchall()  # [(id, nombre, direccion), ...]
log(f"Buildings disponibles: {len(BUILDINGS)}")

# Tabla tracking
cur.execute("""
CREATE TABLE IF NOT EXISTS gdrive_migration_log (
  id SERIAL PRIMARY KEY,
  file_id TEXT UNIQUE,
  filename TEXT,
  s3_key TEXT,
  building_id TEXT,
  doc_type TEXT,
  size BIGINT,
  status TEXT,
  ts TIMESTAMP DEFAULT NOW(),
  parent_path TEXT
);
""")
conn.commit()

def fetch_folder_contents(folder_id):
    """Devuelve dict con archivos y subfolders de una carpeta pública.
    
    Usamos primero embeddedfolderview, si falla intentamos con file ID alternativo.
    """
    url = f"https://drive.google.com/embeddedfolderview?id={folder_id}#list"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        log(f"  ERROR fetch {folder_id}: {e}")
        return {"files": [], "folders": []}
    
    # Extraer titular
    title_match = re.search(r"<title>([^<]+)</title>", html)
    folder_name = title_match.group(1).strip() if title_match else ""
    
    # Archivos: entries con file/d/
    file_ids = list(set(re.findall(r"file/d/([a-zA-Z0-9_-]+)", html)))
    # Subfolders: entries con folders/
    subfolder_ids = list(set(re.findall(r"folders/([a-zA-Z0-9_-]+)", html)))
    
    # Extract names: data-id="ID" data-tooltip="NAME"  (ALTERNATIVO)
    names = {}
    for m in re.finditer(r'data-id="([^"]+)"[^>]*>(?:[^<]*<[^>]*>)*([^<]+)<', html):
        names[m.group(1)] = m.group(2).strip()
    
    return {
        "name": folder_name,
        "files": [{"id": f, "name": names.get(f, "")} for f in file_ids],
        "folders": [{"id": f, "name": names.get(f, "")} for f in subfolder_ids],
    }

def find_building_id(folder_path, filename=""):
    """Match folder_path o filename contra nombres de buildings."""
    text = normalize(folder_path + " " + filename)
    if not text:
        return None
    
    best_id = None
    best_score = 0
    for bid, nombre, direccion in BUILDINGS:
        score = 0
        for source in [nombre, direccion]:
            if not source:
                continue
            n_src = normalize(source)
            tokens = [t for t in re.split(r"[\\s,.\\-/]+", n_src) if len(t) >= 4 and t not in ("calle","avda","plaza","paseo","palencia","madrid","valladolid","contratos","local","garaje","garajes","apartamentos","oficinas","casa","edificio","inmueble","naves","nave","terreno")]
            for tok in tokens:
                if tok in text:
                    score += len(tok)
            # Números (importante)
            for num in re.findall(r"\\d+", n_src):
                if re.search(rf"(?:\\D|^){num}(?:\\D|$)", text):
                    score += 5
        if score > best_score:
            best_score = score
            best_id = bid
    
    return best_id if best_score >= 8 else None

def detect_doc_type(filename):
    n = filename.lower()
    if "sepa" in n or "mandato" in n: return "contrato"  # tipo enum
    if "fianza" in n or "depos" in n or "modelo_25" in n or "justificante" in n: return "contrato"
    if "poliza" in n or "seguro" in n: return "seguro"
    if "escritura" in n or "notario" in n: return "otro"
    if "ibi" in n: return "otro"
    if "contrato" in n or "arrendamiento" in n or "alquiler" in n or "adenda" in n or "anexo" in n: return "contrato"
    if "dni" in n or "nie" in n or "pasaporte" in n: return "dni"
    return "otro"

def download_file(file_id, target_path):
    """Descarga archivo Drive público a target_path."""
    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    try:
        # Intento 1
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = resp.read()
        if len(data) > 100:
            with open(target_path, "wb") as f:
                f.write(data)
            return len(data)
    except Exception as e:
        log(f"  download error {file_id}: {e}")
    return 0

def upload_to_s3(local_path, s3_key):
    try:
        result = subprocess.run(
            ["aws", "s3", "cp", local_path, f"s3://{AWS_BUCKET}/{s3_key}", "--quiet"],
            capture_output=True, text=True, timeout=120
        )
        return result.returncode == 0
    except Exception as e:
        log(f"  S3 upload error: {e}")
        return False

# ============ BFS recursivo ============
visited = set()
queue = []  # (folder_id, path_str)
for root in ROOTS:
    queue.append((root, ""))

total_files = 0
total_uploaded = 0
total_failed = 0
total_skipped = 0

os.makedirs("/tmp/gdrive_recursive", exist_ok=True)

cur.close()

while queue:
    folder_id, parent_path = queue.pop(0)
    if folder_id in visited:
        continue
    visited.add(folder_id)
    
    log(f"FOLDER {folder_id} ({parent_path})")
    contents = fetch_folder_contents(folder_id)
    folder_name = contents.get("name", "")
    full_path = f"{parent_path}/{folder_name}" if folder_name else parent_path
    
    log(f"  Name: {folder_name}, Files: {len(contents['files'])}, SubFolders: {len(contents['folders'])}")
    
    # Add subfolders to queue
    for sub in contents["folders"]:
        if sub["id"] not in visited and sub["id"] not in [q[0] for q in queue]:
            queue.append((sub["id"], full_path))
    
    # Process files
    for f in contents["files"]:
        file_id = f["id"]
        total_files += 1
        
        # Verificar si ya migrado
        cur2 = conn.cursor()
        cur2.execute("SELECT 1 FROM gdrive_migration_log WHERE file_id=%s AND status='ok'", (file_id,))
        if cur2.fetchone():
            cur2.close()
            total_skipped += 1
            continue
        cur2.close()
        
        local_file = f"/tmp/gdrive_recursive/{file_id}.bin"
        size = download_file(file_id, local_file)
        if size < 1000:
            total_failed += 1
            continue
        
        # Detectar nombre por content-disposition
        try:
            head = subprocess.run(
                ["curl", "-sIL", f"https://drive.google.com/uc?export=download&id={file_id}"],
                capture_output=True, text=True, timeout=30
            )
            cd = re.search(r'filename="([^"]+)"', head.stdout)
            filename = cd.group(1) if cd else f.get("name") or f"gdrive_{file_id}.bin"
        except:
            filename = f.get("name") or f"gdrive_{file_id}.bin"
        
        safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", filename)[:100]
        if not safe_name.lower().endswith((".pdf", ".docx", ".xlsx", ".jpg", ".png", ".doc")):
            # Detectar PDF mágico
            with open(local_file, "rb") as fh:
                magic = fh.read(4)
            if magic.startswith(b"%PDF"):
                safe_name += ".pdf"
            else:
                safe_name += ".bin"
        
        # Match building
        bid = find_building_id(full_path, filename)
        doc_type = detect_doc_type(filename)
        
        # S3 key
        ts = int(time.time() * 1000)
        # Sanitize folder path for S3
        s3_folder = re.sub(r"[^a-zA-Z0-9_-]", "_", normalize(full_path))[:50]
        s3_key = f"documents/gdrive-vidaro/{s3_folder}/{ts}-{safe_name}"
        
        if upload_to_s3(local_file, s3_key):
            # Crear Document
            cur3 = conn.cursor()
            try:
                doc_id = "cmm" + os.urandom(11).hex()[:22]
                cur3.execute("""
                INSERT INTO documents (id, nombre, tipo, "cloudStoragePath", "buildingId", "versionActual", descripcion, "updatedAt")
                VALUES (%s, %s, %s::"DocumentType", %s, %s, 1, %s, NOW())
                ON CONFLICT (id) DO NOTHING
                """, (doc_id, safe_name, doc_type, s3_key, bid, f"Migrado desde Google Drive (path: {full_path})"))
                conn.commit()
                
                cur3.execute("""
                INSERT INTO gdrive_migration_log (file_id, filename, s3_key, building_id, doc_type, size, status, parent_path)
                VALUES (%s, %s, %s, %s, %s, %s, 'ok', %s)
                ON CONFLICT (file_id) DO UPDATE SET status='ok'
                """, (file_id, safe_name, s3_key, bid, doc_type, size, full_path))
                conn.commit()
                total_uploaded += 1
                log(f"    OK {safe_name[:50]} -> {s3_key} (building={bid})")
            except Exception as e:
                conn.rollback()
                log(f"    DB error: {e}")
            finally:
                cur3.close()
        else:
            total_failed += 1
        
        try:
            os.remove(local_file)
        except:
            pass
        
        # Cap: por seguridad parar si llevamos 500 archivos
        if total_uploaded >= 500:
            log("Cap 500 alcanzado.")
            queue = []
            break

log(f"\\n=== TOTAL ===")
log(f"  Files vistos: {total_files}")
log(f"  Subidos OK: {total_uploaded}")
log(f"  Fallidos: {total_failed}")
log(f"  Skipped (ya migrados): {total_skipped}")

conn.close()
'''

# Subir y ejecutar
sftp = c.open_sftp()
with sftp.open('/tmp/migrate_recursive.py', 'w') as f:
    f.write(script)
sftp.close()

cmd = """
chmod +x /tmp/migrate_recursive.py
# Asegurar psycopg2
pip install psycopg2-binary 2>&1 | tail -1
nohup python3 /tmp/migrate_recursive.py > /tmp/gdrive_recursive_run.log 2>&1 &
echo "PID: $!"
sleep 5
echo "=== Inicio ==="
tail -15 /tmp/gdrive_recursive.log 2>&1
"""
stdin, stdout, _ = c.exec_command(cmd, timeout=120)
print(stdout.read().decode())
c.close()
