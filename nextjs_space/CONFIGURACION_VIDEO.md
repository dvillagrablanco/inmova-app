# 🎥 Configuración del Video de Demostración

## Problema Resuelto ✅

Si no puedes subir el archivo de video directamente al servidor, ahora tienes **3 opciones flexibles** para mostrar el video de demostración en la landing page.

---

## 📋 Opciones Disponibles

### **Opción 1: YouTube (Recomendada) 🎬**

**Ventajas:**
- ✅ No consume espacio en el servidor
- ✅ Reproducción optimizada y rápida
- ✅ Analytics integrados
- ✅ Control de privacidad (público/no listado)

**Pasos:**

1. **Sube tu video a YouTube:**
   - Ve a https://studio.youtube.com
   - Haz clic en "Crear" > "Subir video"
   - Sube tu archivo `inmova-demo.mp4`
   - Configura la privacidad (Público o No listado)

2. **Obtén la URL de inserción:**
   - En tu video, haz clic en "Compartir"
   - Selecciona "Insertar"
   - Copia la URL que aparece en `src="..."`
   - Ejemplo: `https://www.youtube.com/embed/dQw4w9WgXcQ`

3. **Configura la variable de entorno:**
   ```bash
   # En el archivo .env
   NEXT_PUBLIC_VIDEO_URL=https://www.youtube.com/embed/TU_VIDEO_ID
   ```

4. **Reinicia el servidor:**
   ```bash
   cd /home/ubuntu/homming_vidaro/nextjs_space
   # Detén el servidor actual (Ctrl+C)
   yarn dev
   ```

---

### **Opción 2: Vimeo 🎞️**

**Ventajas:**
- ✅ Más profesional y sin anuncios
- ✅ Controles de privacidad avanzados
- ✅ Mejor calidad de video

**Pasos:**

1. **Sube tu video a Vimeo:**
   - Ve a https://vimeo.com
   - Haz clic en "Upload"
   - Sube tu archivo `inmova-demo.mp4`
   - Configura la privacidad

2. **Obtén la URL de inserción:**
   - En tu video, haz clic en el botón "Share"
   - Selecciona la pestaña "Embed"
   - Copia la URL del iframe (dentro de `src="..."`)
   - Ejemplo: `https://player.vimeo.com/video/123456789`

3. **Configura la variable de entorno:**
   ```bash
   # En el archivo .env
   NEXT_PUBLIC_VIDEO_URL=https://player.vimeo.com/video/TU_VIDEO_ID
   ```

4. **Reinicia el servidor:**
   ```bash
   cd /home/ubuntu/homming_vidaro/nextjs_space
   yarn dev
   ```

---

### **Opción 3: Enlace Directo a MP4 🔗**

**Ventajas:**
- ✅ Control total sobre el archivo
- ✅ Sin dependencia de terceros

**Pasos:**

1. **Sube tu video a un servicio de almacenamiento:**
   - Google Drive (configurado como público)
   - Dropbox (enlace público)
   - AWS S3
   - Cloudflare R2
   - Cualquier CDN

2. **Obtén el enlace directo:**
   - El enlace debe terminar en `.mp4`
   - Ejemplo: `https://cdn.ejemplo.com/videos/inmova-demo.mp4`

3. **Configura la variable de entorno:**
   ```bash
   # En el archivo .env
   NEXT_PUBLIC_VIDEO_URL=https://tu-cdn.com/inmova-demo.mp4
   ```

4. **Reinicia el servidor:**
   ```bash
   cd /home/ubuntu/homming_vidaro/nextjs_space
   yarn dev
   ```

---

### **Opción 4: Archivo Local (Si puedes subir archivos)**

Si en algún momento puedes subir el archivo directamente:

1. **Sube el archivo a:**
   ```
   /home/ubuntu/homming_vidaro/nextjs_space/public/videos/inmova-demo.mp4
   ```

2. **Asegúrate de que el archivo se llame exactamente:** `inmova-demo.mp4`

3. **No necesitas configurar ninguna variable de entorno**, la app lo detectará automáticamente.

---

## 🔄 Verificación

Para verificar que el video se muestra correctamente:

1. **Ve a la landing page:**
   ```
   http://localhost:3000/landing
   ```

2. **Desplázate hasta la sección "Mira INMOVA en Acción"**

3. **Deberías ver:**
   - Si configuraste `NEXT_PUBLIC_VIDEO_URL`: El video funcionando
   - Si NO configuraste la URL: Un mensaje con instrucciones

---

## ❓ Troubleshooting

### El video no se muestra después de configurar la URL

**Solución:**
```bash
# 1. Verifica que la variable esté en el archivo .env
cat /home/ubuntu/homming_vidaro/nextjs_space/.env | grep VIDEO

# 2. Asegúrate de que empiece con NEXT_PUBLIC_
# ✅ Correcto: NEXT_PUBLIC_VIDEO_URL=...
# ❌ Incorrecto: VIDEO_URL=...

# 3. Reinicia el servidor de desarrollo
cd /home/ubuntu/homming_vidaro/nextjs_space
# Ctrl+C para detener
yarn dev
```

### El video de YouTube no se reproduce

**Solución:**
- Asegúrate de usar la URL de **embed** (https://www.youtube.com/**embed**/VIDEO_ID)
- NO uses la URL normal (https://www.youtube.com/watch?v=VIDEO_ID)

### El video directo (MP4) no carga

**Solución:**
- Verifica que la URL sea accesible públicamente
- Prueba abrir la URL directamente en tu navegador
- Asegúrate de que el servidor permita CORS

---

## 📊 Recomendación Final

**Para producción:** Usa **YouTube (No listado)** o **Vimeo**
- Mejor rendimiento
- No consume recursos del servidor
- Analytics incluidos

**Para desarrollo/pruebas:** Usa un enlace directo a MP4
- Más control
- Sin depender de servicios externos

---

## 📞 Soporte

Si tienes problemas:
1. Revisa que la variable `NEXT_PUBLIC_VIDEO_URL` esté correctamente configurada en `.env`
2. Reinicia el servidor de desarrollo
3. Verifica que la URL del video sea accesible
4. Consulta este documento

---

**¡Listo!** 🎉 Tu video de demostración debería estar funcionando ahora.