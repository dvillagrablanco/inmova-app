#!/bin/bash

################################################################################
# Script para configurar acceso SSH desde Abacus AI
################################################################################

echo "🔐 Configurando acceso SSH..."

# Crear directorio .ssh si no existe
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Agregar clave pública
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDXhz+hsB4yrdwI91XC5gVwuE/LjKrmfqiOLb9DiwSbSrPGjE7jewTd3mguh8ZeoYBecUGyfmOGDQEoI9fySbiGfyy6Fx2kALvUEJi1x+xObH6rtw9Wz+cRSS1yLCWiSZ9ffW0+nFHjRjIrjaE5tXm5P8dlRb1f2+j9hAnY8o/A3bp743Y6HIy/jVr4N62SqADpAbsfJjJMT9uDz4hGcLlLbxOQqX2+GFDW5hNIXiSHZexNK1ZRWxseDDx1wsBy/K88OLQPXHThe42qo8Y6qwuRFoTMdU+euRz/ML29pu1nSh2vBx8p8QSmBtznpRSB+PSy+D1u14kp3ZapQH/rikgPG/AsNDF1VjPw6BgnPsEfxaMkJJp0c+ySAbh/yM4zEztQ+7JMrIMPQXc/7Nh2hr5yH19tpTUSheio9WpWSOo12tBpy0N+eI4koEQtxuiDivaY51kvLJ2QzTe5Qkl78wUI7ftwww9px/iDS2tHlcr8SPGMxXXkxoUIHult1Ioek17Fx0cCYq5eZqeRJ+PIDiSyEG7n8/uxl2Cjg73+Vd+9Tl9cmMytu90OmZKsTnmoctqnEnl9EAHsMkeLV3KTYGPvIlK4P9bsbGbQsI+25q4ifF7eYLd6Anl8PKnBW6FYvrL5mgJw0QII6GGrDt8FYAtdvglEPrs5PV5CgHvt6rD7bQ== inmova-deployment@abacus" >> ~/.ssh/authorized_keys

# Establecer permisos correctos
chmod 600 ~/.ssh/authorized_keys

echo "✅ Clave SSH agregada correctamente"
echo "✅ Acceso SSH configurado"
echo ""
echo "Ahora puedes cerrar esta sesión y el deployment se ejecutará automáticamente."
