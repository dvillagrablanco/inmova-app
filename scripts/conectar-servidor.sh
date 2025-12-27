#!/bin/bash

# Script para conectar al servidor con contraseña
# Servidor: 157.180.119.236
# Usuario: root

SERVER_IP="157.180.119.236"
SERVER_USER="root"
SERVER_PASS="UWEw4JTuCUAL"

# Instalar sshpass si no está disponible
if ! command -v sshpass &> /dev/null; then
    echo "Instalando sshpass..."
    apt-get update -qq && apt-get install -y -qq sshpass
fi

# Función para ejecutar comandos en el servidor
function exec_remote {
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$@"
}

# Función para copiar archivos al servidor
function copy_to_server {
    sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no "$@"
}

# Exportar funciones para uso en otros scripts
export -f exec_remote
export -f copy_to_server
export SERVER_IP
export SERVER_USER
export SERVER_PASS

echo "✅ Funciones de conexión configuradas"
echo "   Servidor: $SERVER_IP"
echo "   Usuario: $SERVER_USER"
