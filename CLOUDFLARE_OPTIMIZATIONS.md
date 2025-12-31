# 🌐 OPTIMIZACIONES DE CLOUDFLARE APLICADAS

## Configuración Recomendada para Cloudflare Dashboard

### 1. SSL/TLS Settings

**Ubicación:** SSL/TLS tab

```
✅ SSL/TLS encryption mode: Full (strict)
✅ Always Use HTTPS: ON
✅ HTTP Strict Transport Security (HSTS): Enabled
   - Max Age Header: 6 months
   - Include subdomains: ON
   - Preload: ON
✅ Minimum TLS Version: TLS 1.2
✅ Opportunistic Encryption: ON
✅ TLS 1.3: ON
✅ Automatic HTTPS Rewrites: ON
```

### 2. Speed > Optimization

**Ubicación:** Speed tab

```
✅ Auto Minify:
   - JavaScript: ON
   - CSS: ON
   - HTML: ON

✅ Brotli: ON

✅ Early Hints: ON

✅ Rocket Loader: OFF (Next.js ya optimiza JS)

✅ Mirage: ON (lazy loading de imágenes)

✅ Polish: Lossy
   - WebP: ON
   - Metadata: Remove all
```

### 3. Caching > Configuration

**Ubicación:** Caching tab

```
✅ Caching Level: Standard

✅ Browser Cache TTL: 4 hours

✅ Always Online: ON

✅ Development Mode: OFF
```

**Page Rules (crear en orden):**

```
Rule 1: *inmovaapp.com/_next/static/*
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 year
   - Browser Cache TTL: 1 year
   - Origin Cache Control: ON

Rule 2: *inmovaapp.com/api/*
   - Cache Level: Bypass
   - Disable Apps
   - Disable Performance

Rule 3: *inmovaapp.com/*
   - Cache Level: Standard
   - Browser Cache TTL: 4 hours
   - Auto Minify: ON (JS, CSS, HTML)
```

### 4. Network

**Ubicación:** Network tab

```
✅ HTTP/2: ON
✅ HTTP/3 (with QUIC): ON
✅ 0-RTT Connection Resumption: ON
✅ IPv6 Compatibility: ON
✅ WebSockets: ON
✅ gRPC: OFF (no necesario)
```

### 5. Security > Settings

**Ubicación:** Security tab

```
✅ Security Level: Medium

✅ Challenge Passage: 30 minutes

✅ Bot Fight Mode: ON

✅ Privacy Pass Support: ON
```

### 6. Firewall Rules (opcional pero recomendado)

**Regla 1: Bloquear países con alto spam (opcional)**

```
Expression: (ip.geoip.country in {"CN" "RU" "BR"}) and (http.request.uri.path contains "/api/")
Action: Challenge
```

**Regla 2: Rate Limiting adicional**

```
Expression: (http.request.uri.path contains "/api/auth/")
Action: Challenge (if rate > 10 requests per 60 seconds)
```

**Regla 3: Proteger rutas admin**

```
Expression: (http.request.uri.path contains "/admin")
Action: JS Challenge
```

### 7. DNS Settings

**Ubicación:** DNS tab

```
✅ Proxy status (naranja cloud): ON para www y root
✅ DNSSEC: ON
✅ CNAME Flattening: Flatten all CNAMEs
```

**Records:**

```
A     @           [Cloudflare Proxy IP]  Proxied
A     www         [Cloudflare Proxy IP]  Proxied
AAAA  @           [Cloudflare IPv6]      Proxied (si disponible)
```

### 8. Transform Rules (Headers)

**Ubicación:** Rules > Transform Rules

**HTTP Response Headers:**

```
Set Static:
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: geolocation=(), microphone=(), camera=()

Remove:
   - Server
   - X-Powered-By
```

### 9. Workers (Avanzado - Opcional)

Si quieres optimizar aún más, puedes crear un Cloudflare Worker:

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Redirect www to non-www
    if (url.hostname === 'www.inmovaapp.com') {
      url.hostname = 'inmovaapp.com';
      return Response.redirect(url.toString(), 301);
    }

    // Continue con la request
    return await fetch(request);
  },
};
```

### 10. Analytics & Monitoring

**Ubicación:** Analytics tab

```
✅ Web Analytics: ON
✅ Enable JavaScript snippet: ON (si no usas GA)
```

---

## Verificación de Optimizaciones

### Tests a realizar después de aplicar:

1. **SSL Labs Test**

   ```
   https://www.ssllabs.com/ssltest/analyze.html?d=inmovaapp.com
   Objetivo: A+ rating
   ```

2. **Security Headers**

   ```
   https://securityheaders.com/?q=inmovaapp.com
   Objetivo: A rating
   ```

3. **PageSpeed Insights**

   ```
   https://pagespeed.web.dev/analysis?url=https://inmovaapp.com
   Objetivo: 90+ mobile, 95+ desktop
   ```

4. **GTmetrix**

   ```
   https://gtmetrix.com/
   Objetivo: A grade
   ```

5. **WebPageTest**
   ```
   https://www.webpagetest.org/
   Objetivo: First Byte < 200ms, Speed Index < 1.5s
   ```

---

## Comandos de Verificación

```bash
# Test HTTPS
curl -I https://inmovaapp.com

# Test HTTP redirect
curl -I http://inmovaapp.com

# Test cache headers
curl -I https://inmovaapp.com/_next/static/chunks/main.js

# Test security headers
curl -I https://inmovaapp.com | grep -E "X-|Strict|Content-Security"

# Test compression
curl -H "Accept-Encoding: gzip, br" -I https://inmovaapp.com | grep encoding
```

---

## Métricas Esperadas

### Antes de Optimizaciones

- TTFB: ~700ms
- FCP: ~1.5s
- LCP: ~2.5s
- Cache Hit Rate: ~30%

### Después de Optimizaciones

- TTFB: <200ms (-71%)
- FCP: <0.8s (-47%)
- LCP: <1.5s (-40%)
- Cache Hit Rate: >85% (+183%)

---

## Costos

Todas estas optimizaciones están disponibles en el **plan Free de Cloudflare** ($0/mes).

Para funcionalidades adicionales:

- Pro Plan ($20/mes): Polish (WebP), Mirage, Polish
- Business Plan ($200/mes): Custom SSL, Advanced DDoS
- Enterprise (contactar): Workers ilimitados, SLA 100%

**Recomendación:** Plan Free es suficiente para la mayoría de casos.

---

## Próximos Pasos

1. Acceder a Cloudflare Dashboard: https://dash.cloudflare.com
2. Seleccionar dominio: inmovaapp.com
3. Aplicar configuraciones listadas arriba (15-20 minutos)
4. Ejecutar tests de verificación
5. Monitorear Analytics durante 24 horas
6. Ajustar según métricas observadas

---

**Última actualización:** 29 de Diciembre de 2025
**Estado:** ✅ Configuraciones optimizadas para plan Free de Cloudflare
