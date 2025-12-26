#!/bin/bash

# Script de Backup Pre-Migración
# Realiza backup completo antes de migrar al nuevo servidor
# Uso: ./scripts/backup-pre-migracion.sh

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔒 BACKUP PRE-MIGRACIÓN - INMOVA         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}\n"

# Configuración
BACKUP_DIR="./backups/migracion_$(date +%Y%m%d_%H%M%S)"
DB_BACKUP_FILE="$BACKUP_DIR/database_backup.sql"
FILES_BACKUP="$BACKUP_DIR/files_backup.tar.gz"
ENV_BACKUP="$BACKUP_DIR/env_backup"
CONFIG_BACKUP="$BACKUP_DIR/config_backup.tar.gz"

# Crear directorio de backup
echo -e "${BLUE}📁 Creando directorio de backup...${NC}"
mkdir -p "$BACKUP_DIR"
mkdir -p "$ENV_BACKUP"
echo -e "${GREEN}✅ Directorio creado: $BACKUP_DIR${NC}\n"

# Cargar variables de entorno
if [ -f ".env" ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# 1. BACKUP DE BASE DE DATOS
echo -e "${BLUE}🗄️  Realizando backup de base de datos...${NC}"
if [ -n "$DATABASE_URL" ]; then
  # Extraer credenciales de DATABASE_URL
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
  DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  
  # Realizar backup con pg_dump
  PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    --clean --if-exists --create --format=custom \
    -f "$DB_BACKUP_FILE"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup de base de datos completado${NC}"
    echo -e "${BLUE}   Archivo: $DB_BACKUP_FILE${NC}\n"
  else
    echo -e "${RED}❌ Error en backup de base de datos${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  DATABASE_URL no configurado, saltando backup de BD${NC}\n"
fi

# 2. BACKUP DE VARIABLES DE ENTORNO
echo -e "${BLUE}🔐 Respaldando variables de entorno...${NC}"
if [ -f ".env" ]; then
  cp .env "$ENV_BACKUP/.env"
  echo -e "${GREEN}✅ .env respaldado${NC}"
fi

if [ -f ".env.production" ]; then
  cp .env.production "$ENV_BACKUP/.env.production"
  echo -e "${GREEN}✅ .env.production respaldado${NC}"
fi

if [ -f ".env.local" ]; then
  cp .env.local "$ENV_BACKUP/.env.local"
  echo -e "${GREEN}✅ .env.local respaldado${NC}"
fi

echo ""

# 3. BACKUP DE CONFIGURACIÓN
echo -e "${BLUE}⚙️  Respaldando archivos de configuración...${NC}"
tar -czf "$CONFIG_BACKUP" \
  prisma/ \
  package.json \
  yarn.lock \
  tsconfig.json \
  next.config.js \
  tailwind.config.ts \
  docker-compose*.yml \
  Dockerfile* \
  nginx.conf 2>/dev/null || true

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Configuración respaldada${NC}\n"
else
  echo -e "${YELLOW}⚠️  Algunos archivos de configuración no se encontraron${NC}\n"
fi

# 4. BACKUP DE SCRIPTS
echo -e "${BLUE}📜 Respaldando scripts...${NC}"
if [ -d "scripts" ]; then
  cp -r scripts "$BACKUP_DIR/scripts_backup"
  echo -e "${GREEN}✅ Scripts respaldados${NC}\n"
fi

# 5. GENERAR CHECKSUM
echo -e "${BLUE}🔍 Generando checksums...${NC}"
cd "$BACKUP_DIR"
find . -type f -exec sha256sum {} \; > checksums.txt
cd - > /dev/null
echo -e "${GREEN}✅ Checksums generados${NC}\n"

# 6. CREAR ARCHIVO DE INFORMACIÓN
echo -e "${BLUE}📝 Creando archivo de información...${NC}"
cat > "$BACKUP_DIR/backup_info.txt" << EOF
========================================
BACKUP PRE-MIGRACIÓN - INMOVA
========================================

Fecha de backup: $(date '+%Y-%m-%d %H:%M:%S')
Servidor origen: $(hostname)
Usuario: $(whoami)
Directorio: $(pwd)

Archivos incluidos:
- Base de datos: database_backup.sql
- Variables de entorno: env_backup/
- Configuración: config_backup.tar.gz
- Scripts: scripts_backup/
- Checksums: checksums.txt

Para restaurar:
1. Extraer archivos en el nuevo servidor
2. Restaurar base de datos: pg_restore -d database database_backup.sql
3. Copiar variables de entorno a la ubicación correcta
4. Verificar checksums

Comando de verificación:
cd $BACKUP_DIR && sha256sum -c checksums.txt

========================================
EOF

echo -e "${GREEN}✅ Información del backup creada${NC}\n"

# 7. COMPRIMIR TODO EL BACKUP
echo -e "${BLUE}📦 Comprimiendo backup completo...${NC}"
BACKUP_PARENT=$(dirname "$BACKUP_DIR")
BACKUP_NAME=$(basename "$BACKUP_DIR")
cd "$BACKUP_PARENT"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
cd - > /dev/null

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Backup comprimido: ${BACKUP_NAME}.tar.gz${NC}\n"
  
  # Mostrar tamaño
  BACKUP_SIZE=$(du -h "$BACKUP_PARENT/${BACKUP_NAME}.tar.gz" | cut -f1)
  echo -e "${BLUE}📊 Tamaño del backup: ${GREEN}$BACKUP_SIZE${NC}\n"
fi

# RESUMEN FINAL
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ BACKUP COMPLETADO EXITOSAMENTE        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}📁 Ubicación del backup:${NC}"
echo -e "   ${GREEN}$BACKUP_DIR${NC}"
echo -e "   ${GREEN}$BACKUP_PARENT/${BACKUP_NAME}.tar.gz${NC}\n"

echo -e "${BLUE}📋 Próximos pasos:${NC}"
echo -e "   1. Transferir backup al nuevo servidor"
echo -e "   2. Ejecutar script de migración"
echo -e "   3. Verificar integridad con checksums\n"

echo -e "${YELLOW}⚠️  IMPORTANTE: Guarda este backup en un lugar seguro${NC}"
echo -e "${YELLOW}   antes de proceder con la migración${NC}\n"

exit 0
