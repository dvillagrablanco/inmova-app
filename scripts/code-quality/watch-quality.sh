#!/bin/bash

###
# Watch Quality - Monitoreo continuo de calidad
# 
# Este script vigila los cambios en el código y ejecuta
# verificaciones automáticas
###

# Colores
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}👁️  Iniciando monitoreo de calidad de código...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}\n"

# Instalar fswatch si no está disponible
if ! command -v fswatch &> /dev/null; then
    echo -e "${YELLOW}⚠ fswatch no encontrado. Usando método alternativo...${NC}\n"
    USE_FSWATCH=false
else
    USE_FSWATCH=true
fi

# Contador de ejecuciones
RUN_COUNT=0

# Función para ejecutar verificaciones
run_checks() {
    RUN_COUNT=$((RUN_COUNT + 1))
    echo -e "\n${BLUE}═══ Ejecución #${RUN_COUNT} ═══${NC}"
    echo -e "${BLUE}$(date '+%H:%M:%S')${NC}\n"
    
    # Ejecutar prettier en archivos modificados
    git diff --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' | while read file; do
        if [ -f "$file" ]; then
            echo -e "${GREEN}📝 Formateando: $file${NC}"
            prettier --write "$file" 2>/dev/null || true
        fi
    done
    
    # Ejecutar ESLint en archivos modificados
    git diff --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' | while read file; do
        if [ -f "$file" ]; then
            echo -e "${GREEN}🔍 Linting: $file${NC}"
            eslint --fix "$file" 2>/dev/null || true
        fi
    done
    
    echo -e "\n${GREEN}✓ Verificaciones completadas${NC}"
}

# Si fswatch está disponible, usarlo
if [ "$USE_FSWATCH" = true ]; then
    echo -e "${GREEN}Usando fswatch para monitoreo en tiempo real${NC}\n"
    fswatch -o app lib components | while read event; do
        run_checks
    done
else
    # Método alternativo: polling cada 30 segundos
    echo -e "${YELLOW}Usando polling cada 30 segundos${NC}\n"
    while true; do
        sleep 30
        if [ -n "$(git diff --name-only)" ]; then
            run_checks
        fi
    done
fi
