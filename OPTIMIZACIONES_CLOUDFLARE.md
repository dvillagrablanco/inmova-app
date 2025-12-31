# ⚡ Optimizaciones de Cloudflare para inmovaapp.com

## ✅ Estado Actual

- ✅ SSL/TLS: Full mode configurado
- ✅ HTTPS funcionando correctamente
- ✅ Headers de seguridad básicos activos

---

## 🚀 Optimizaciones Recomendadas (15 minutos)

### 1. Configurar Page Rules para Cache (GRATIS)

**Beneficio:** Acelera la carga de assets estáticos

1. Ve a **Rules** → **Page Rules**
2. Crea nueva regla:

```
URL: inmovaapp.com/_next/static/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 year
```

3. Orden de prioridad: 1 (más alta)

### 2. Activar HTTP/3 (GRATIS)

**Beneficio:** Conexiones más rápidas, especialmente en móviles

1. Ve a **Network**
2. Activa **HTTP/3 (with QUIC)**
3. Activa **0-RTT Connection Resumption**
4. Activa **WebSockets**

### 3. Activar Brotli Compression (GRATIS)

**Beneficio:** Archivos 15-25% más pequeños que Gzip

1. Ve a **Speed** → **Optimization**
2. Activa **Brotli**
3. Auto Minify:
   - ✅ JavaScript
   - ✅ CSS
   - ✅ HTML

### 4. Configurar Always Use HTTPS (GRATIS)

**Beneficio:** Fuerza HTTPS en todo el sitio

1. Ve a **SSL/TLS** → **Edge Certificates**
2. Activa **Always Use HTTPS**
3. Activa **Automatic HTTPS Rewrites**

### 5. Configurar HSTS (GRATIS)

**Beneficio:** Seguridad adicional, mejor ranking SEO

1. Ve a **SSL/TLS** → **Edge Certificates**
2. Activa **HSTS (HTTP Strict Transport Security)**
3. Configura:
   ```
   Max Age Header: 12 months
   Apply to subdomains: ✅
   Preload: ✅
   No-Sniff Header: ✅
   ```

### 6. Activar WAF (Web Application Firewall) (GRATIS)

**Beneficio:** Protección contra ataques comunes

1. Ve a **Security** → **WAF**
2. Activa **OWASP Core Ruleset**
3. Security Level: **Medium**
4. Challenge Passage: **30 minutes**

### 7. Configurar Bot Fight Mode (GRATIS)

**Beneficio:** Protección contra bots maliciosos

1. Ve a **Security** → **Bots**
2. Activa **Bot Fight Mode**
3. (Plan Pro/Business): Configura Super Bot Fight Mode

### 8. Activar Rocket Loader (GRATIS - Opcional)

**Beneficio:** Carga asíncrona de JavaScript

⚠️ **Precaución:** Puede causar problemas con algunas apps. Probar primero.

1. Ve a **Speed** → **Optimization**
2. Activa **Rocket Loader**
3. Si causa problemas, desactívalo

### 9. Configurar Cache Rules Avanzadas (GRATIS)

**Beneficio:** Optimización granular del cache

1. Ve a **Rules** → **Page Rules**
2. Crea regla para API (sin cache):

```
URL: inmovaapp.com/api/*
Settings:
  - Cache Level: Bypass
```

3. Crea regla para imágenes:

```
URL: inmovaapp.com/_next/image/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 week
```

### 10. Activar Mirage (PRO/BUSINESS)

**Beneficio:** Optimización automática de imágenes

Si tienes plan Pro o Business:

1. Ve a **Speed** → **Optimization**
2. Activa **Mirage**
3. Activa **Polish** (Lossless)
4. Activa **WebP**

---

## 📊 Monitoreo y Analytics

### 1. Activar Analytics

1. Ve a **Analytics & Logs** → **Web Analytics**
2. Activa **Web Analytics**
3. Revisa métricas diariamente:
   - Visitas
   - Ancho de banda
   - Requests por segundo
   - Cache hit rate

### 2. Configurar Alertas

1. Ve a **Notifications**
2. Crea alertas para:
   - **Traffic Anomalies** (tráfico inusual)
   - **Origin Unreachable** (servidor caído)
   - **SSL/TLS Certificate Expiring** (certificado por vencer)
   - **DDoS Attack** (ataque detectado)

---

## 🔐 Seguridad Avanzada

### 1. Configurar IP Access Rules

Bloquea IPs sospechosas:

1. Ve a **Security** → **WAF**
2. Ve a **Tools** → **IP Access Rules**
3. Configura reglas según necesites

### 2. Rate Limiting (PRO/BUSINESS)

Protege contra ataques de fuerza bruta:

1. Ve a **Security** → **WAF**
2. Ve a **Rate Limiting Rules**
3. Crea regla:

```
URL: inmovaapp.com/api/auth/*
Limit: 10 requests per minute
Action: Challenge
```

### 3. Activar Email Security (GRATIS)

Protege tu dominio contra phishing:

1. Ve a **Email** → **Email Routing**
2. Configura SPF, DKIM, DMARC records
3. Activa **Email Security DNS records**

---

## 🎯 Configuración Óptima para Next.js

### Headers Personalizados

1. Ve a **Rules** → **Transform Rules** → **HTTP Response Headers**
2. Crea regla para agregar headers de seguridad adicionales:

```
Rule name: Security Headers
Expression: (http.host eq "inmovaapp.com")

Set static headers:
  - X-Robots-Tag: "all"
  - Permissions-Policy: "geolocation=(), microphone=(), camera=()"
  - Referrer-Policy: "strict-origin-when-cross-origin"
  - Cross-Origin-Embedder-Policy: "require-corp"
  - Cross-Origin-Opener-Policy: "same-origin"
```

---

## 📈 Verificar Mejoras

Después de aplicar las optimizaciones:

### 1. Test de Velocidad

- **PageSpeed Insights**: https://pagespeed.web.dev/
- **GTmetrix**: https://gtmetrix.com/
- **WebPageTest**: https://www.webpagetest.org/

### 2. Test de Seguridad

- **SSL Labs**: https://www.ssllabs.com/ssltest/analyze.html?d=inmovaapp.com
- **Security Headers**: https://securityheaders.com/?q=inmovaapp.com
- **Mozilla Observatory**: https://observatory.mozilla.org/

### 3. Métricas Esperadas

Después de optimizaciones:

```
✅ PageSpeed Score: 90+ (móvil), 95+ (escritorio)
✅ SSL Labs Grade: A+
✅ Security Headers: A
✅ Cache Hit Rate: 85%+
✅ TTFB (Time to First Byte): < 200ms
✅ FCP (First Contentful Paint): < 1.8s
✅ LCP (Largest Contentful Paint): < 2.5s
```

---

## ⏱️ Tiempo Estimado

- **Optimizaciones básicas (1-8):** 15 minutos
- **Configuración avanzada (9-10):** 10 minutos
- **Monitoreo y alertas:** 5 minutos
- **Total:** ~30 minutos

---

## 🆘 Troubleshooting

### Cache no funciona correctamente

1. Purge cache: **Caching** → **Configuration** → **Purge Everything**
2. Verifica Page Rules en orden correcto
3. Revisa que `Cache-Control` headers estén configurados en Next.js

### Rocket Loader causa problemas

1. Desactiva Rocket Loader
2. O excluye scripts específicos con `data-cfasync="false"`

### Bot Fight Mode bloquea usuarios legítimos

1. Reduce Security Level a "Low"
2. O usa "I'm Under Attack Mode" solo cuando sea necesario

---

## 📚 Recursos Adicionales

- **Cloudflare Docs**: https://developers.cloudflare.com/
- **Next.js + Cloudflare**: https://nextjs.org/docs/deployment
- **Performance Best Practices**: https://web.dev/learn-web-vitals/

---

## ✅ Checklist de Optimizaciones

- [ ] Page Rules para cache de assets
- [ ] HTTP/3 activado
- [ ] Brotli compression activado
- [ ] Always Use HTTPS activado
- [ ] HSTS configurado
- [ ] WAF activado
- [ ] Bot Fight Mode activado
- [ ] Analytics configurado
- [ ] Alertas configuradas
- [ ] Tests de velocidad realizados
- [ ] Tests de seguridad realizados

---

**¡Con estas optimizaciones tu app será ultra-rápida y segura! 🚀**
