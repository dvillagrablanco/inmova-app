#!/bin/bash

###
# Diagnose JSX Issues
# 
# Este script identifica archivos con problemas de sintaxis JSX
# y proporciona sugerencias de corrección
###

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔍 DIAGNÓSTICO DE PROBLEMAS JSX                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Contador de problemas
ISSUES_FOUND=0

# Función para verificar un archivo
check_file() {
    local file=$1
    local has_issues=false
    
    # Verificar si Prettier puede parsear el archivo
    if ! prettier --check "$file" 2>/dev/null >/dev/null; then
        echo -e "${RED}❌ $file${NC}"
        has_issues=true
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        
        # Intentar identificar el problema específico
        if grep -q "AuthenticatedLayout>" "$file"; then
            # Verificar indentación
            if grep -E "^          <div className=" "$file" >/dev/null; then
                echo -e "   ${YELLOW}→ Indentación excesiva detectada${NC}"
            fi
            
            # Verificar cierres
            local opens=$(grep -c "<AuthenticatedLayout>" "$file")
            local closes=$(grep -c "</AuthenticatedLayout>" "$file")
            if [ "$opens" -ne "$closes" ]; then
                echo -e "   ${YELLOW}→ Desbalance en tags AuthenticatedLayout (opens: $opens, closes: $closes)${NC}"
            fi
            
            # Verificar si necesita Fragment
            if grep -q "</AuthenticatedLayout>" "$file" && grep -q "<Dialog" "$file"; then
                local has_fragment=$(grep -c "<>" "$file")
                if [ "$has_fragment" -eq "0" ]; then
                    echo -e "   ${YELLOW}→ Posiblemente necesita Fragment (<>) para Dialog${NC}"
                fi
            fi
        fi
        
        echo ""
    fi
}

# Buscar archivos TSX en app/
echo -e "${BLUE}Analizando archivos en app/...${NC}\n"

find app -name "*.tsx" -type f | while read file; do
    check_file "$file"
done

# Resumen
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
if [ "$ISSUES_FOUND" -eq "0" ]; then
    echo -e "${GREEN}✅ No se encontraron problemas de sintaxis JSX${NC}"
else
    echo -e "${RED}⚠️  Encontrados $ISSUES_FOUND archivos con problemas${NC}"
    echo -e ""
    echo -e "${YELLOW}Soluciones recomendadas:${NC}"
    echo -e ""
    echo -e "  1. ${GREEN}Corrección manual:${NC}"
    echo -e "     Editar cada archivo siguiendo el patrón:"
    echo -e "     ${BLUE}code <archivo>${NC}"
    echo -e ""
    echo -e "  2. ${GREEN}Ver patrones correctos:${NC}"
    echo -e "     ${BLUE}cat ESTADO_BUILD_Y_DEPLOYMENT.md${NC}"
    echo -e ""
    echo -e "  3. ${GREEN}Deshabilitar temporalmente:${NC}"
    echo -e "     ${BLUE}mv <archivo> <archivo>.disabled${NC}"
    echo -e ""
fi
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
