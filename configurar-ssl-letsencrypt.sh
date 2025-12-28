#!/bin/bash
# Script para configurar SSL de Let's Encrypt cuando expire el rate limit

echo "🔐 Configurando SSL con Let's Encrypt..."
echo ""

# Asegurarse que NGINX está corriendo
sudo service nginx status > /dev/null || sudo service nginx start

# Intentar obtener certificado
sudo /usr/bin/certbot --nginx -d inmova.app -d www.inmova.app --non-interactive --agree-tos --email admin@inmova.app --redirect

if [ $? -eq 0 ]; then
    echo "✅ SSL configurado exitosamente!"
    echo "🔄 Reiniciando NGINX..."
    sudo service nginx restart
    echo ""
    echo "🎉 ¡inmova.app está ahora con HTTPS válido!"
else
    echo "❌ Error al configurar SSL. Verifica:"
    echo "1. Que el DNS apunta directamente a este servidor (157.180.119.236)"
    echo "2. Que no hay proxy/CDN activo"
    echo "3. Los logs: sudo tail -f /var/log/letsencrypt/letsencrypt.log"
fi
