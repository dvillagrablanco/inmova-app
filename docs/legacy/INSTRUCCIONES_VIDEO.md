# Instrucciones para Subir el Video Demo

## Problema Detectado

El enlace de Google Drive proporcionado tiene permisos restringidos que impiden la descarga automática del video. El navegador redirige a una página de autenticación de Google.

## Soluciones Disponibles

### Opción 1: Cambiar Permisos del Archivo en Google Drive (Recomendado)

1. Ve a Google Drive y busca el archivo `inmova-demo.mp4`
2. Haz clic derecho sobre el archivo
3. Selecciona **"Compartir"**
4. Haz clic en **"Cambiar"** junto a "Restringido"
5. Selecciona **"Cualquiera con el enlace"**
6. Asegúrate de que el permiso sea **"Visualizador"**
7. Haz clic en **"Listo"**
8. Vuelve a proporcionar el enlace y podremos descargarlo automáticamente

### Opción 2: Descargar Manualmente y Subir

1. Descarga el video desde Google Drive a tu ordenador
2. Sube el archivo al proyecto usando uno de estos métodos:

#### Método A: Transferencia Directa (Si tienes acceso SSH)
```bash
scp inmova-demo.mp4 ubuntu@servidor:/home/ubuntu/homming_vidaro/nextjs_space/public/videos/
```

#### Método B: Usar un Servicio de Transferencia
1. Sube el video a WeTransfer, Dropbox, o similar
2. Proporciona el enlace de descarga directa
3. Lo descargaremos y colocaremos en la ubicación correcta

### Opción 3: Usar YouTube o Vimeo (Alternativa)

Si prefieres no alojar el video localmente:

1. Sube el video a YouTube (puede ser no listado) o Vimeo
2. Obtén el código de embed
3. Integraremos el iframe en la landing page

## Ubicación del Video en el Proyecto

El video debe estar en:
```
/home/ubuntu/homming_vidaro/nextjs_space/public/videos/inmova-demo.mp4
```

## Estado Actual

✅ **Código Actualizado**: La landing page ya está preparada para mostrar el video automáticamente cuando esté disponible en la ubicación correcta.

✅ **Elemento <video>**: Se ha implementado un reproductor HTML5 nativo con:
- Controles de reproducción
- Póster de inicio (logo de INMOVA)
- Fallback para navegadores que no soporten el formato
- Diseño responsivo

❌ **Video No Disponible**: El archivo del video aún no está en la ubicación debido a los permisos de Google Drive.

## Características del Reproductor Implementado

```jsx
<video 
  controls 
  className="w-full h-full object-contain"
  poster="/inmova-logo-cover.jpg"
>
  <source src="/videos/inmova-demo.mp4" type="video/mp4" />
</video>
```

- **controls**: Muestra los controles nativos del navegador (play, pausa, volumen, pantalla completa)
- **poster**: Muestra el logo de INMOVA mientras no se ha reproducido el video
- **object-contain**: Mantiene las proporciones del video sin recortar
- **Formato**: Soporta MP4 (H.264)

## Próximos Pasos

1. Selecciona una de las opciones anteriores para subir el video
2. Una vez el archivo esté en `/public/videos/inmova-demo.mp4`, el video se mostrará automáticamente
3. El reproductor estará completamente funcional sin necesidad de cambios adicionales

## Especificaciones Técnicas del Video

Según la documentación del proyecto, el video debe tener:

- **Duración**: 90 segundos
- **Formato**: MP4 (H.264)
- **Resolución**: Full HD (1920x1080) o HD (1280x720)
- **Aspect Ratio**: 16:9
- **Contenido**: Demo de las 88 funcionalidades y 7 verticales de INMOVA

## Soporte

Si necesitas ayuda con cualquiera de estas opciones, por favor proporciona:
- El método que prefieres usar
- El enlace actualizado (si cambias los permisos de Google Drive)
- O el enlace alternativo de descarga directa
