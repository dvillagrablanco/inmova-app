# Configuración Nginx para inmova.com

## Estado actual

- Nginx tiene activo `inmovaapp.com` con HTTPS (Let's Encrypt).
- Se añadió un vhost HTTP para `inmova.com` y `www.inmova.com` apuntando a `localhost:3000`.

Archivo aplicado en el servidor:

- `/etc/nginx/sites-available/inmova.com`
- Symlink: `/etc/nginx/sites-enabled/inmova.com`

## Requisito crítico: DNS

Actualmente, `inmova.com` no apunta a `157.180.119.236`.  
Para que el dominio sea visible desde خارج:

- Actualizar registros A:
  - `inmova.com` → `157.180.119.236`
  - `www.inmova.com` → `157.180.119.236`

## HTTPS (pendiente)

Cuando el DNS esté apuntando al servidor:

```bash
certbot --nginx -d inmova.com -d www.inmova.com
nginx -t
systemctl reload nginx
```

Esto generará el certificado y añadirá el bloque HTTPS.

## Verificación rápida (en servidor)

```bash
curl -I -H "Host: inmova.com" http://127.0.0.1
```

Debe responder `HTTP/1.1 200 OK`.
