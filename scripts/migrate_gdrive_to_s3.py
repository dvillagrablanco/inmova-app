#!/usr/bin/env python3
"""
Migra todos los documentos de carpetas públicas Google Drive a S3.

Para cada Document con cloudStoragePath = enlace Google Drive:
1. Extrae folder_id de la URL
2. Lista archivos via embeddedfolderview (público, sin auth)
3. Para cada file_id:
   a. Descarga con gdown / curl
   b. Sube a S3 en gdrive-vidaro/<doc_tipo>/<filename>
   c. Crea Document nuevo en BD vinculado a misma entity (building/unit/contract/tenant)
   d. Marca el Document folder antiguo como "migrado" (descripcion += MIGRATED)

Resultado: carpetas Drive convertidas en N PDFs reales en S3 + Documents en BD.
"""
import paramiko
import sys

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=15)

# Crear script bash que se ejecutará en el servidor
script = """#!/bin/bash
set +e

# Cargar env vars S3
while IFS='=' read -r key value; do
  if [[ "$key" =~ ^(AWS_|DATABASE_) ]]; then
    export "$key"="${value//\\\"/}"
  fi
done < /opt/inmova-app/.env.production

LOG=/tmp/gdrive_migrate.log
echo "=== INICIO $(date) ===" > $LOG

# Crear tabla temporal en BD para tracking
psql "$DATABASE_URL" -c "
CREATE TABLE IF NOT EXISTS gdrive_migration_log (
  id SERIAL PRIMARY KEY,
  parent_doc_id TEXT,
  folder_url TEXT,
  file_id TEXT UNIQUE,
  filename TEXT,
  s3_key TEXT,
  new_doc_id TEXT,
  status TEXT,
  ts TIMESTAMP DEFAULT NOW()
);
" 2>&1 | head -2 >> $LOG

# Obtener todas las carpetas Drive
psql "$DATABASE_URL" -t -c "
SELECT d.id || '|' || d.\\"cloudStoragePath\\" || '|' || COALESCE(d.\\"buildingId\\",'') || '|' || COALESCE(d.\\"unitId\\",'') || '|' || COALESCE(d.\\"contractId\\",'') || '|' || COALESCE(d.\\"tenantId\\",'') || '|' || d.tipo || '|' || COALESCE(d.nombre,'')
FROM documents d
LEFT JOIN buildings b ON b.id = d.\\"buildingId\\"
LEFT JOIN units u ON u.id = d.\\"unitId\\"
LEFT JOIN tenants t ON t.id = d.\\"tenantId\\"
WHERE d.\\"cloudStoragePath\\" LIKE '%drive.google.com/drive/folders/%'
  AND (b.\\"companyId\\" IN ('cef19f55f7b6ce0637d5ffb53','c65159283deeaf6815f8eda95','cmkctneuh0001nokn7nvhuweq')
       OR u.\\"buildingId\\" IN (SELECT id FROM buildings WHERE \\"companyId\\" IN ('cef19f55f7b6ce0637d5ffb53','c65159283deeaf6815f8eda95','cmkctneuh0001nokn7nvhuweq'))
       OR t.\\"companyId\\" IN ('cef19f55f7b6ce0637d5ffb53','c65159283deeaf6815f8eda95','cmkctneuh0001nokn7nvhuweq'))
" > /tmp/gdrive_folders.txt

TOTAL=$(wc -l < /tmp/gdrive_folders.txt)
echo "Total carpetas a procesar: $TOTAL" >> $LOG

mkdir -p /tmp/gdrive_dl
cd /tmp/gdrive_dl

while IFS='|' read -r doc_id folder_url bid uid cid tid tipo nombre; do
  doc_id=$(echo $doc_id | xargs)
  folder_url=$(echo $folder_url | xargs)
  if [ -z "$folder_url" ]; then continue; fi
  
  # Extraer FOLDER_ID del URL
  FOLDER_ID=$(echo "$folder_url" | grep -oE 'folders/[^/?]+' | sed 's|folders/||')
  if [ -z "$FOLDER_ID" ]; then continue; fi
  
  echo "" >> $LOG
  echo "=== Folder $FOLDER_ID ($nombre) ===" >> $LOG
  
  # Descargar listado
  curl -s "https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}#list" -o /tmp/gdrive_dl/folder_${FOLDER_ID}.html 2>&1
  
  # Extraer file IDs del HTML (formato: file/d/FILE_ID/view)
  grep -oE 'file/d/[a-zA-Z0-9_-]+' /tmp/gdrive_dl/folder_${FOLDER_ID}.html | sort -u | sed 's|file/d/||' > /tmp/gdrive_dl/files_${FOLDER_ID}.txt
  
  FILE_COUNT=$(wc -l < /tmp/gdrive_dl/files_${FOLDER_ID}.txt)
  echo "  Archivos detectados: $FILE_COUNT" >> $LOG
  
  if [ $FILE_COUNT -eq 0 ]; then
    echo "  SKIP - sin archivos detectables" >> $LOG
    continue
  fi
  
  while IFS= read -r FILE_ID; do
    if [ -z "$FILE_ID" ]; then continue; fi
    
    # Skip si ya migrado
    EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT 1 FROM gdrive_migration_log WHERE file_id='$FILE_ID' AND status='ok' LIMIT 1;" 2>/dev/null | xargs)
    if [ "$EXISTS" = "1" ]; then continue; fi
    
    # Obtener metadata (filename) intentando un GET HEAD
    META=$(curl -s -L -o /tmp/gdrive_dl/test.dat -w '%{filename_effective}|%{content_type}|%{size_download}' "https://drive.google.com/uc?export=download&id=${FILE_ID}" 2>/dev/null)
    
    # Para detectar el filename real, mejor usar el parámetro Content-Disposition
    HEADERS=$(curl -sIL "https://drive.google.com/uc?export=download&id=${FILE_ID}" 2>/dev/null)
    FILENAME=$(echo "$HEADERS" | grep -i 'content-disposition' | tail -1 | grep -oE 'filename="[^"]+"' | tr -d '"' | sed 's/filename=//')
    
    # Si no hay filename en headers, generar uno
    if [ -z "$FILENAME" ]; then
      FILENAME="gdrive_${FILE_ID}.pdf"
    fi
    
    SAFE_FILENAME=$(echo "$FILENAME" | tr ' /' '__' | tr -dc 'A-Za-z0-9._-')
    LOCAL_FILE="/tmp/gdrive_dl/${FILE_ID}_${SAFE_FILENAME}"
    
    # Descargar archivo (con manejo de archivos grandes que requieren confirm)
    SIZE=$(curl -sL "https://drive.google.com/uc?export=download&id=${FILE_ID}" -o "$LOCAL_FILE" -w '%{size_download}' --max-time 120)
    
    if [ "$SIZE" -lt 100 ]; then
      # Probablemente HTML de confirmación; reintentar con confirm
      CONFIRM=$(grep -oE 'confirm=[^&]+' "$LOCAL_FILE" | head -1 | cut -d= -f2)
      if [ -n "$CONFIRM" ]; then
        SIZE=$(curl -sL "https://drive.google.com/uc?export=download&confirm=${CONFIRM}&id=${FILE_ID}" -o "$LOCAL_FILE" -w '%{size_download}' --max-time 120)
      fi
    fi
    
    if [ "$SIZE" -lt 1000 ]; then
      echo "    SKIP $FILE_ID: descarga fallida (${SIZE}b)" >> $LOG
      psql "$DATABASE_URL" -c "INSERT INTO gdrive_migration_log (parent_doc_id, folder_url, file_id, filename, status) VALUES ('$doc_id', '$folder_url', '$FILE_ID', '$SAFE_FILENAME', 'fail_download') ON CONFLICT (file_id) DO NOTHING;" > /dev/null 2>&1
      continue
    fi
    
    # Subir a S3
    TS=$(date +%s%N | head -c 13)
    S3_KEY="documents/gdrive-vidaro/${tipo:-otro}/${TS}-${SAFE_FILENAME}"
    
    aws s3 cp "$LOCAL_FILE" "s3://${AWS_BUCKET}/${S3_KEY}" --quiet 2>>$LOG
    if [ $? -ne 0 ]; then
      echo "    FAIL S3 upload $FILE_ID" >> $LOG
      continue
    fi
    
    # Crear Document nuevo en BD
    DOC_NAME="${SAFE_FILENAME}"
    NEW_DOC_ID=$(psql "$DATABASE_URL" -t -c "
INSERT INTO documents (id, nombre, tipo, \\"cloudStoragePath\\", \\"buildingId\\", \\"unitId\\", \\"contractId\\", \\"tenantId\\", \\"versionActual\\", descripcion)
VALUES (
  'cmm' || substr(md5(random()::text || clock_timestamp()::text), 1, 22),
  '$DOC_NAME',
  '$tipo'::\\"DocumentType\\",
  '$S3_KEY',
  $(if [ -n "$bid" ]; then echo "'$bid'"; else echo "NULL"; fi),
  $(if [ -n "$uid" ]; then echo "'$uid'"; else echo "NULL"; fi),
  $(if [ -n "$cid" ]; then echo "'$cid'"; else echo "NULL"; fi),
  $(if [ -n "$tid" ]; then echo "'$tid'"; else echo "NULL"; fi),
  1,
  'Migrado desde Google Drive (folder ${FOLDER_ID})'
)
ON CONFLICT (id) DO NOTHING
RETURNING id;
" 2>&1 | xargs)
    
    psql "$DATABASE_URL" -c "INSERT INTO gdrive_migration_log (parent_doc_id, folder_url, file_id, filename, s3_key, new_doc_id, status) VALUES ('$doc_id', '$folder_url', '$FILE_ID', '$SAFE_FILENAME', '$S3_KEY', '$NEW_DOC_ID', 'ok') ON CONFLICT (file_id) DO NOTHING;" > /dev/null 2>&1
    
    echo "    OK $FILE_ID -> ${SAFE_FILENAME} (${SIZE}b) -> $S3_KEY" >> $LOG
    rm -f "$LOCAL_FILE"
  done < /tmp/gdrive_dl/files_${FOLDER_ID}.txt
done < /tmp/gdrive_folders.txt

echo "" >> $LOG
echo "=== FIN $(date) ===" >> $LOG
echo "" >> $LOG
echo "=== RESUMEN ===" >> $LOG
psql "$DATABASE_URL" -c "
SELECT status, COUNT(*) FROM gdrive_migration_log GROUP BY status ORDER BY 2 DESC;
" >> $LOG 2>&1
"""

# Subir y ejecutar
sftp = c.open_sftp()
with sftp.open('/tmp/migrate_gdrive.sh', 'w') as f:
    f.write(script)
sftp.close()

cmd = """
chmod +x /tmp/migrate_gdrive.sh
nohup /tmp/migrate_gdrive.sh > /tmp/migrate_gdrive_run.log 2>&1 &
echo "PID: $!"
sleep 3
echo "=== Inicio del log ==="
tail -10 /tmp/gdrive_migrate.log 2>&1
"""
stdin, stdout, _ = c.exec_command(cmd, timeout=30)
print(stdout.read().decode())
c.close()
