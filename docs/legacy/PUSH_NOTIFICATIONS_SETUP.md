# Configuración de Notificaciones Push

## ¿Qué son las notificaciones push?

Las notificaciones push permiten enviar alertas a los usuarios incluso cuando no están navegando activamente en la aplicación. Funcionan a través de Service Workers y requieren que el usuario conceda permisos.

## Configuración inicial

### 1. Generar claves VAPID

Las claves VAPID son necesarias para autenticar las notificaciones push. Tienes dos opciones para generarlas:

#### Opción A: Usando la API (recomendado)

1. Inicia el servidor de desarrollo:
   ```bash
   yarn dev
   ```

2. Haz una petición POST a:
   ```
   POST http://localhost:3000/api/push/vapid-keys/generate
   ```

3. La respuesta incluirá las claves pública y privada.

#### Opción B: Usando Node.js directamente

```bash
node -e "const webpush = require('web-push'); const keys = webpush.generateVAPIDKeys(); console.log('Public:', keys.publicKey, '\nPrivate:', keys.privateKey);"
```

### 2. Configurar variables de entorno

Agrega las claves generadas a tu archivo `.env`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=TU_CLAVE_PUBLICA_AQUI
VAPID_PRIVATE_KEY=TU_CLAVE_PRIVADA_AQUI
VAPID_EMAIL=mailto:admin@inmova.app
```

**Importante:** 
- La clave pública debe tener el prefijo `NEXT_PUBLIC_` para ser accesible desde el cliente
- La clave privada NO debe tener el prefijo `NEXT_PUBLIC_` por seguridad
- El email es para que los servicios de notificaciones puedan contactarte si hay problemas

### 3. Ejecutar migración de Prisma

Si aún no lo has hecho, ejecuta:

```bash
yarn prisma migrate dev
yarn prisma generate
```

Esto creará la tabla `PushSubscription` en la base de datos.

### 4. Reiniciar el servidor

Reinicia el servidor de desarrollo para que cargue las nuevas variables de entorno:

```bash
yarn dev
```

## Uso en la aplicación
### Para usuarios finales

1. Ve a la configuración de tu perfil
2. Busca la sección "Notificaciones Push"
3. Activa el interruptor
4. Concede permisos cuando el navegador lo solicite
5. ¡Listo! Ahora recibirás notificaciones

### Para desarrolladores

#### Usar el hook en un componente

```tsx
import { usePushNotifications } from '@/hooks/usePushNotifications';

function MyComponent() {
  const { isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  return (
    <button onClick={isSubscribed ? unsubscribe : subscribe}>
      {isSubscribed ? 'Desactivar' : 'Activar'} notificaciones
    </button>
  );
}
```

#### Enviar notificación desde el servidor

```typescript
import { sendPushNotification } from '@/lib/push-service';

// Enviar a un usuario específico
await sendPushNotification(userId, {
  title: 'Nueva tarea asignada',
  body: 'Tienes una nueva tarea: Revisar contrato',
  url: '/tareas/123',
  icon: '/icon-192x192.png',
  tag: 'task-123',
  requireInteraction: true
});
```

#### Enviar notificación desde una API Route

```typescript
// En tu API route
await fetch('/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userIds: ['user-id-1', 'user-id-2'], // O 'all' para todos
    title: 'Nueva actualización',
    body: 'Hay nuevas características disponibles',
    url: '/updates',
    tag: 'system-update'
  })
});
```

## Integración con eventos del sistema

Puedes integrar las notificaciones push con eventos existentes:

### Ejemplo: Notificar cuando se crea una solicitud de mantenimiento

```typescript
// En tu API de creación de solicitud de mantenimiento
import { sendPushNotification } from '@/lib/push-service';

// Después de crear la solicitud
const solicitud = await prisma.solicitudMantenimiento.create({...});

// Notificar al responsable
if (solicitud.asignadoA) {
  await sendPushNotification(solicitud.asignadoA, {
    title: '🔧 Nueva solicitud de mantenimiento',
    body: `${solicitud.titulo} - Prioridad: ${solicitud.prioridad}`,
    url: `/mantenimiento/${solicitud.id}`,
    tag: `maintenance-${solicitud.id}`,
    requireInteraction: solicitud.prioridad === 'urgente'
  });
}
```

## Testing

### Probar notificaciones localmente

1. Asegúrate de estar en HTTPS (requerido para Service Workers)
   - En desarrollo, `localhost` funciona sin HTTPS
   - En producción, HTTPS es obligatorio

2. Abre las DevTools del navegador
3. Ve a la pestaña "Application" > "Service Workers"
4. Verifica que el service worker esté registrado y activo

### Probar en diferentes navegadores

- **Chrome/Edge:** Soporte completo
- **Firefox:** Soporte completo
- **Safari:** Soporte desde iOS 16.4+ y macOS 13+
- **Opera:** Soporte completo

## Troubleshooting

### "Las notificaciones push no están soportadas"
- Verifica que estés usando HTTPS (o localhost en desarrollo)
- Verifica que tu navegador soporte Service Workers y Push API

### "Permisos denegados"
- El usuario debe restablecer los permisos en la configuración del navegador
- En Chrome: Configuración > Privacidad y seguridad > Configuración del sitio > Notificaciones

### "Error 410 Gone" al enviar notificaciones
- La suscripción ha expirado o fue eliminada
- El sistema automáticamente desactiva estas suscripciones

### Service Worker no se registra
- Verifica que el archivo `public/sw.js` existe
- Verifica la consola del navegador para errores
- Intenta desregistrar service workers antiguos en DevTools

## Mejores prácticas

1. **No abuses de las notificaciones:** Solo envía notificaciones importantes
2. **Usa tags apropiados:** Para evitar duplicados
3. **Incluye URLs relevantes:** Para que los usuarios puedan acceder rápidamente al contenido
4. **Maneja errores:** Las suscripciones pueden fallar o expirar
5. **Limpia suscripciones inactivas:** Usa `cleanupInactiveSubscriptions()` periódicamente

## Limitaciones

- Las notificaciones push requieren que el usuario conceda permisos
- En iOS, solo funcionan si la web app está agregada a la pantalla de inicio
- Algunos navegadores pueden limitar la frecuencia de notificaciones
- Las notificaciones pueden ser bloqueadas por configuraciones del sistema operativo

## Recursos adicionales

- [MDN Web Docs - Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [MDN Web Docs - Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Notifications Explained](https://web.dev/push-notifications-overview/)
