import puppeteer from 'puppeteer-core';
import { resolve } from 'path';

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 20mm 18mm 20mm 18mm; size: A4; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; line-height: 1.55; font-size: 10pt; }
  h1 { color: #0f3460; font-size: 20pt; border-bottom: 3px solid #0f3460; padding-bottom: 6px; page-break-before: always; margin-top: 0; }
  h1:first-of-type { page-break-before: avoid; }
  h2 { color: #16213e; font-size: 14pt; border-bottom: 1.5px solid #e94560; padding-bottom: 3px; margin-top: 22px; }
  h3 { color: #0f3460; font-size: 12pt; margin-top: 16px; }
  h4 { color: #e94560; font-size: 10.5pt; margin-top: 12px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9pt; }
  th { background: #0f3460; color: white; padding: 5px 8px; text-align: left; font-size: 9pt; }
  td { padding: 4px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
  tr:nth-child(even) { background: #f8f9fa; }
  .cover { text-align: center; padding: 80px 40px 40px; page-break-after: always; }
  .cover h1 { border: none; font-size: 28pt; color: #0f3460; page-break-before: avoid; }
  .cover .subtitle { font-size: 14pt; color: #e94560; margin-top: 8px; }
  .cover .info { font-size: 10pt; color: #666; margin-top: 30px; }
  .tip { background: #e8f4fd; border-left: 4px solid #0f3460; padding: 8px 12px; margin: 10px 0; font-size: 9pt; }
  .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 8px 12px; margin: 10px 0; font-size: 9pt; }
  .critical { background: #f8d7da; border-left: 4px solid #dc3545; padding: 8px 12px; margin: 10px 0; font-size: 9pt; }
  .ok { background: #d4edda; border-left: 4px solid #28a745; padding: 8px 12px; margin: 10px 0; font-size: 9pt; }
  .checkbox { font-size: 12pt; margin-right: 6px; }
  ul, ol { margin: 4px 0; padding-left: 20px; }
  li { margin: 2px 0; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 8px; font-size: 8pt; font-weight: bold; color: white; }
  .badge-red { background: #dc3545; }
  .badge-yellow { background: #ffc107; color: #333; }
  .badge-green { background: #28a745; }
  .badge-blue { background: #0f3460; }
  .footer { text-align: center; font-size: 8pt; color: #999; margin-top: 30px; }
  .page-break { page-break-before: always; }
  code { background: #f4f4f4; padding: 1px 4px; border-radius: 3px; font-size: 9pt; }
  .section-box { border: 1px solid #dee2e6; border-radius: 6px; padding: 12px; margin: 10px 0; }
</style>
</head>
<body>

<!-- PORTADA -->
<div class="cover">
  <div style="font-size: 42pt; color: #0f3460; margin-bottom: 16px;">&#128203;</div>
  <h1>CHECKLIST DE DATOS<br>PARA PUESTA EN MARCHA</h1>
  <div class="subtitle">Grupo Vidaro Inversiones — Parte Inmobiliaria</div>
  <div class="info">
    <p><strong>Destinatario:</strong> Diego (Gestor de la cuenta)</p>
    <p><strong>Objetivo:</strong> Listado exhaustivo de todos los datos que deben cargarse, verificarse y completarse en Inmova para que el sistema funcione en real</p>
    <p><strong>Alcance:</strong> Exclusivamente gestión inmobiliaria (edificios, unidades, inquilinos, contratos, pagos, seguros, mantenimiento)</p>
    <p style="margin-top: 30px;">Versión 1.0 — Abril 2026</p>
    <p>Sociedades: Rovida S.L.U. · Viroda Inversiones S.L.U.</p>
  </div>
</div>

<!-- ÍNDICE -->
<div style="page-break-after: always;">
<h1 style="page-break-before: avoid;">ÍNDICE</h1>
<ol style="font-size: 11pt; line-height: 2;">
  <li>Resumen del Estado Actual del Sistema</li>
  <li>Datos de Empresas — Verificación y Corrección</li>
  <li>Edificios — Inventario y Datos a Completar</li>
  <li>Unidades — Verificación por Edificio</li>
  <li>Inquilinos — Datos Reales a Cargar</li>
  <li>Contratos — Datos Reales a Cargar</li>
  <li>Pagos — Histórico y Configuración</li>
  <li>Seguros — Verificación de Pólizas</li>
  <li>Suministros — Alta de Contratos</li>
  <li>Mantenimiento — Incidencias Abiertas y Proveedores</li>
  <li>Documentación — Archivos a Subir</li>
  <li>Resumen de Prioridades y Cronograma</li>
</ol>
</div>

<!-- CAP 1 -->
<h1>1. Resumen del Estado Actual del Sistema</h1>

<h2>1.1 Diagnóstico General</h2>
<div class="critical"><strong>NINGÚN DATO CARGADO EN EL SISTEMA ES FIABLE PARA PRODUCCIÓN.</strong> Todos los datos actuales provienen de scripts de seed con valores ficticios (CIFs falsos, teléfonos 000, emails inventados, DNIs sintéticos). Es necesario revisar y corregir TODO.</div>

<h2>1.2 Lo que existe en el sistema (requiere revisión completa)</h2>

<table>
<tr><th>Elemento</th><th>Rovida</th><th>Viroda</th><th>Estado</th></tr>
<tr><td>Empresa/Sociedad</td><td>Sí (datos placeholder)</td><td>Sí (datos placeholder)</td><td><span class="badge badge-red">Revisar</span></td></tr>
<tr><td>Edificios</td><td>19 edificios cargados</td><td>5 edificios cargados</td><td><span class="badge badge-yellow">Verificar</span></td></tr>
<tr><td>Unidades</td><td>Cientos (garajes, locales)</td><td>~44 unidades</td><td><span class="badge badge-yellow">Verificar</span></td></tr>
<tr><td>Inquilinos</td><td>124 (datos sintéticos)</td><td>8 (datos ficticios)</td><td><span class="badge badge-red">Rehacer</span></td></tr>
<tr><td>Contratos</td><td>Generados automáticamente</td><td>Algunos</td><td><span class="badge badge-red">Rehacer</span></td></tr>
<tr><td>Seguros</td><td>13 pólizas sintéticas</td><td>10 pólizas con PDF real</td><td><span class="badge badge-yellow">Verificar</span></td></tr>
<tr><td>Pagos</td><td>Ninguno</td><td>Ninguno</td><td><span class="badge badge-red">Cargar</span></td></tr>
<tr><td>Suministros</td><td>Ninguno</td><td>Ninguno</td><td><span class="badge badge-red">Cargar</span></td></tr>
<tr><td>Mantenimiento</td><td>Ninguno</td><td>Ninguno</td><td><span class="badge badge-red">Cargar</span></td></tr>
<tr><td>Documentos S3</td><td>Solo seguros Viroda</td><td>10 PDFs pólizas</td><td><span class="badge badge-yellow">Ampliar</span></td></tr>
</table>

<h2>1.3 Problemas Detectados en los Datos Cargados</h2>
<table>
<tr><th>#</th><th>Problema</th><th>Dónde</th><th>Impacto</th></tr>
<tr><td>1</td><td>CIF falsos: <code>B-VIDARO-001</code>, <code>B-ROVIDA-001</code>, <code>B-PENDIENTE</code>, <code>B-XXXXXXXX</code></td><td>Todas las empresas</td><td><span class="badge badge-red">Crítico</span></td></tr>
<tr><td>2</td><td>Direcciones: <code>"Por definir"</code></td><td>Empresa Grupo Vidaro</td><td><span class="badge badge-red">Crítico</span></td></tr>
<tr><td>3</td><td>Teléfonos: <code>+34 000 000 000</code></td><td>Empresas + 124 inquilinos Rovida</td><td><span class="badge badge-red">Crítico</span></td></tr>
<tr><td>4</td><td>Emails inventados: <code>@rovida-tenant.local</code>, <code>@example.com</code></td><td>Todos los inquilinos</td><td><span class="badge badge-red">Crítico</span></td></tr>
<tr><td>5</td><td>DNIs sintéticos: <code>ROV-XXXXXX</code>, <code>12345678A-H</code></td><td>Todos los inquilinos</td><td><span class="badge badge-red">Crítico</span></td></tr>
<tr><td>6</td><td>Fechas nacimiento ficticias: <code>1980-01-01</code>, <code>1990-01-01</code></td><td>Todos los inquilinos</td><td><span class="badge badge-yellow">Medio</span></td></tr>
<tr><td>7</td><td>Rentas estimadas: <code>1000€</code> fijo en todas las unidades Viroda</td><td>Unidades Viroda</td><td><span class="badge badge-red">Crítico</span></td></tr>
<tr><td>8</td><td>Contratos con fechas genéricas: <code>2025-01-01 a 2025-12-31</code></td><td>Contratos Rovida</td><td><span class="badge badge-red">Crítico</span></td></tr>
<tr><td>9</td><td>Pólizas de seguro Rovida con nº sintéticos: <code>SEG-TOMILLAR-001</code></td><td>13 seguros Rovida</td><td><span class="badge badge-red">Crítico</span></td></tr>
<tr><td>10</td><td>Nombres de empresa inconsistentes entre scripts</td><td>Múltiples</td><td><span class="badge badge-yellow">Medio</span></td></tr>
<tr><td>11</td><td>Posibles edificios duplicados por ejecución de múltiples scripts</td><td>Rovida y Viroda</td><td><span class="badge badge-yellow">Medio</span></td></tr>
<tr><td>12</td><td>Contraseña por defecto sin cambiar: <code>vidaro2025</code></td><td>6 usuarios</td><td><span class="badge badge-red">Crítico</span></td></tr>
</table>

<!-- CAP 2 -->
<h1>2. Datos de Empresas — Verificación y Corrección</h1>

<h2>2.1 Para cada sociedad, obtener y cargar:</h2>

<h3>ROVIDA S.L.U.</h3>
<table>
<tr><th>Campo</th><th>Valor Actual (FALSO)</th><th>Dato Real Necesario</th><th>&#9744;</th></tr>
<tr><td>CIF</td><td><code>B-ROVIDA-001</code></td><td>CIF real de Rovida</td><td>&#9744;</td></tr>
<tr><td>Dirección fiscal</td><td><code>Por definir</code></td><td>Dirección completa del domicilio social</td><td>&#9744;</td></tr>
<tr><td>Código postal</td><td>No cargado</td><td>CP del domicilio social</td><td>&#9744;</td></tr>
<tr><td>Ciudad</td><td>No cargado</td><td>Ciudad</td><td>&#9744;</td></tr>
<tr><td>Teléfono</td><td><code>+34 000 000 001</code></td><td>Teléfono real de la sociedad</td><td>&#9744;</td></tr>
<tr><td>Email</td><td><code>info@rovida.com</code></td><td>Verificar si es correcto</td><td>&#9744;</td></tr>
<tr><td>Contacto principal</td><td><code>Por definir</code></td><td>Nombre del responsable</td><td>&#9744;</td></tr>
<tr><td>Email contacto</td><td><code>contacto@rovida.com</code></td><td>Email del responsable real</td><td>&#9744;</td></tr>
<tr><td>Logo</td><td>No cargado</td><td>Logo de Rovida (PNG/SVG)</td><td>&#9744;</td></tr>
</table>

<h3>VIRODA INVERSIONES S.L.U.</h3>
<table>
<tr><th>Campo</th><th>Valor Actual (FALSO)</th><th>Dato Real Necesario</th><th>&#9744;</th></tr>
<tr><td>CIF</td><td><code>B-VIRODA-001</code></td><td>CIF real de Viroda</td><td>&#9744;</td></tr>
<tr><td>Dirección fiscal</td><td><code>Por definir</code></td><td>Dirección completa</td><td>&#9744;</td></tr>
<tr><td>Código postal</td><td>No cargado</td><td>CP</td><td>&#9744;</td></tr>
<tr><td>Ciudad</td><td>No cargado</td><td>Ciudad</td><td>&#9744;</td></tr>
<tr><td>Teléfono</td><td><code>+34 000 000 002</code></td><td>Teléfono real</td><td>&#9744;</td></tr>
<tr><td>Email</td><td><code>info@virodainversiones.com</code></td><td>Verificar</td><td>&#9744;</td></tr>
<tr><td>Contacto principal</td><td><code>Por definir</code></td><td>Nombre del responsable</td><td>&#9744;</td></tr>
<tr><td>Logo</td><td>No cargado</td><td>Logo de Viroda (PNG/SVG)</td><td>&#9744;</td></tr>
</table>

<div class="tip"><strong>Fuente de los datos:</strong> Escrituras de constitución, Registro Mercantil, o preguntar a Alfonso (administrador).</div>

<!-- CAP 3 -->
<h1>3. Edificios — Inventario y Datos a Completar</h1>

<h2>3.1 Edificios de ROVIDA (19 cargados — verificar todos)</h2>
<p>Para CADA edificio, verificar que los siguientes datos son correctos y completar los que faltan:</p>

<table>
<tr><th>#</th><th>Edificio</th><th>Dirección cargada</th><th>Ciudad</th><th>Datos a completar</th></tr>
<tr><td>1</td><td>Garajes Espronceda 32</td><td>C/ Espronceda, 32</td><td>Madrid</td><td rowspan="19" style="font-size:8pt;">
Para CADA uno:<br>
&#9744; Dirección completa verificada<br>
&#9744; Código postal<br>
&#9744; Referencia catastral<br>
&#9744; Año de construcción<br>
&#9744; Número de plantas<br>
&#9744; Tipo (residencial/comercial/mixto/garaje)<br>
&#9744; Estado de conservación<br>
&#9744; Certificado energético (tipo + fecha)<br>
&#9744; ¿Tiene ascensor?<br>
&#9744; ¿Tiene garaje propio?<br>
&#9744; ¿Tiene trastero?<br>
&#9744; Gastos de comunidad mensuales (€)<br>
&#9744; IBI anual (€)<br>
&#9744; Fotos del edificio (mínimo 2-3)<br>
&#9744; Verificar que nº de unidades es correcto
</td></tr>
<tr><td>2</td><td>Garajes Hernández de Tejada 6</td><td>C/ Hernández de Tejada, 6</td><td>Madrid</td></tr>
<tr><td>3</td><td>Locales Barquillo 30</td><td>C/ Barquillo, 30</td><td>Madrid</td></tr>
<tr><td>4</td><td>Locales Reina 15</td><td>C/ Reina, 15</td><td>Madrid</td></tr>
<tr><td>5</td><td>Edificio Piamonte 23</td><td>C/ Piamonte, 23</td><td>Madrid</td></tr>
<tr><td>6</td><td>Oficinas Av Europa 34</td><td>Av. Europa, 34, Bl.B</td><td>Madrid</td></tr>
<tr><td>7</td><td>Garajes Menéndez Pelayo 17</td><td>C/ Menéndez Pelayo, 17</td><td>Palencia</td></tr>
<tr><td>8</td><td>Local Menéndez Pelayo 15</td><td>C/ Menéndez Pelayo, 15</td><td>Palencia</td></tr>
<tr><td>9</td><td>Naves Avda Cuba 48-50-52</td><td>Avda. Cuba, 48-50-52</td><td>Palencia</td></tr>
<tr><td>10</td><td>Garajes Constitución 5</td><td>C/ Constitución, 5</td><td>Valladolid</td></tr>
<tr><td>11</td><td>Naves Metal 4 (Pg. Argales)</td><td>C/ Metal, 4, Pg. Argales</td><td>Valladolid</td></tr>
<tr><td>12</td><td>Inmueble Constitución 8</td><td>C/ Constitución, 8, 2ºA</td><td>Valladolid</td></tr>
<tr><td>13</td><td>Apartamentos Gemelos 20</td><td>Ed. Gemelos 20</td><td>Benidorm</td></tr>
<tr><td>14</td><td>Apartamentos Gemelos II</td><td>Ed. Gemelos II</td><td>Benidorm</td></tr>
<tr><td>15</td><td>Apartamentos Gemelos IV</td><td>Ed. Gemelos IV</td><td>Benidorm</td></tr>
<tr><td>16</td><td>Casa El Tomillar</td><td>El Tomillar de Nagüelles, 2</td><td>—</td></tr>
<tr><td>17</td><td>Garajes Urb. Castillo Magaz</td><td>Urb. Castillo de Magaz</td><td>Palencia</td></tr>
<tr><td>18</td><td>Terreno Rústico Grijota</td><td>Finca rústica</td><td>Grijota</td></tr>
<tr><td>19</td><td>Local Prado 10</td><td>C/ Prado, 10</td><td>Madrid</td></tr>
</table>

<h2>3.2 Edificios de VIRODA (5 cargados — verificar todos)</h2>
<table>
<tr><th>#</th><th>Edificio</th><th>Dirección cargada</th><th>Datos a completar</th></tr>
<tr><td>1</td><td>Manuel Silvela 5</td><td>C/ Manuel Silvela, 5, Madrid 28002</td><td rowspan="5" style="font-size:8pt;">
Mismos 15 campos que Rovida:<br>
&#9744; Dirección + CP verificados<br>
&#9744; Ref. catastral<br>
&#9744; Año construcción<br>
&#9744; Tipo, plantas, conservación<br>
&#9744; CEE<br>
&#9744; Comunidad mensual (€)<br>
&#9744; IBI anual (€)<br>
&#9744; Fotos<br>
&#9744; Nº unidades correcto
</td></tr>
<tr><td>2</td><td>Hernández de Tejada 6</td><td>C/ Hernández de Tejada, 6, Madrid</td></tr>
<tr><td>3</td><td>Candelaria Mora 12-14</td><td>C/ Candelaria Mora, Madrid</td></tr>
<tr><td>4</td><td>Reina 15 (Residencial)</td><td>C/ Reina, 15, Madrid 28004</td></tr>
<tr><td>5</td><td>Menéndez Pelayo 15</td><td>C/ Menéndez Pelayo, Madrid/Palencia</td></tr>
</table>

<div class="warning"><strong>Atención:</strong> La dirección de "Menéndez Pelayo 15" aparece como Madrid en un script y como Palencia en otro. VERIFICAR cuál es la correcta.</div>

<h2>3.3 Verificación de duplicados</h2>
<div class="critical">Se han ejecutado múltiples scripts que pueden haber creado edificios duplicados. Diego debe verificar en el sistema que no existan edificios repetidos (especialmente Reina 15 y Hernández de Tejada 6, que aparecen tanto en Rovida como en Viroda).</div>

<!-- CAP 4 -->
<h1>4. Unidades — Verificación por Edificio</h1>

<h2>4.1 Para CADA unidad de CADA edificio, verificar:</h2>
<table>
<tr><th>Campo</th><th>Estado Actual</th><th>Acción Requerida</th></tr>
<tr><td>Número/piso/puerta</td><td>Cargado (puede haber errores)</td><td>&#9744; Verificar que coincide con la realidad</td></tr>
<tr><td>Tipo</td><td>Cargado (vivienda/garaje/local/nave)</td><td>&#9744; Verificar tipo correcto</td></tr>
<tr><td>Superficie (m²)</td><td>Parcialmente cargado</td><td>&#9744; Completar con m² reales</td></tr>
<tr><td>Habitaciones</td><td>Mayormente no cargado</td><td>&#9744; Cargar para viviendas</td></tr>
<tr><td>Baños</td><td>No cargado</td><td>&#9744; Cargar para viviendas</td></tr>
<tr><td>Renta mensual real</td><td><span class="badge badge-red">1000€ estimado</span> en Viroda; heurístico en Rovida</td><td>&#9744; <strong>CORREGIR con renta real de cada unidad</strong></td></tr>
<tr><td>Estado actual</td><td>Puede estar desactualizado</td><td>&#9744; Verificar: disponible / ocupada / mantenimiento</td></tr>
<tr><td>Referencia catastral individual</td><td>No cargada</td><td>&#9744; Cargar (obtener del Catastro)</td></tr>
<tr><td>Fotos</td><td>No cargadas</td><td>&#9744; Subir fotos de cada unidad (al menos las que se alquilan)</td></tr>
</table>

<h2>4.2 Volumen estimado de trabajo</h2>
<table>
<tr><th>Sociedad</th><th>Edificios</th><th>Unidades estimadas</th><th>Trabajo</th></tr>
<tr><td>Rovida</td><td>19</td><td>~300+ (muchos garajes)</td><td>Verificar listado de plazas, locales, naves</td></tr>
<tr><td>Viroda</td><td>5</td><td>~44-60 viviendas</td><td>Verificar cada vivienda con datos reales</td></tr>
</table>

<div class="tip"><strong>Prioridad:</strong> Empezar por las unidades OCUPADAS (con inquilino y contrato activo). Las vacías pueden completarse después.</div>

<!-- CAP 5 -->
<h1>5. Inquilinos — Datos Reales a Cargar</h1>

<div class="critical"><strong>TODOS los datos de inquilinos son ficticios.</strong> Los 124 inquilinos de Rovida tienen emails <code>@rovida-tenant.local</code>, DNIs <code>ROV-XXXXXX</code> y teléfono <code>+34 000 000 000</code>. Los 8 de Viroda tienen <code>@example.com</code> y DNI <code>12345678X</code>. TODO debe rehacerse con datos reales.</div>

<h2>5.1 Para CADA inquilino activo, obtener:</h2>
<table>
<tr><th>Campo</th><th>Obligatorio</th><th>Fuente del dato</th></tr>
<tr><td><strong>Nombre</strong></td><td>SÍ</td><td>Contrato de arrendamiento</td></tr>
<tr><td><strong>Apellidos</strong></td><td>SÍ</td><td>Contrato de arrendamiento</td></tr>
<tr><td><strong>DNI/NIE/CIF</strong></td><td>SÍ</td><td>Copia del documento de identidad</td></tr>
<tr><td><strong>Email</strong></td><td>SÍ (para comunicaciones)</td><td>Preguntar al inquilino o en contrato</td></tr>
<tr><td><strong>Teléfono</strong></td><td>SÍ</td><td>Preguntar al inquilino o en contrato</td></tr>
<tr><td>Cuenta bancaria (IBAN)</td><td>Si hay domiciliación</td><td>Ficha de domiciliación bancaria</td></tr>
<tr><td>Fecha de nacimiento</td><td>No</td><td>Documento de identidad</td></tr>
<tr><td>Nacionalidad</td><td>No</td><td>—</td></tr>
<tr><td>Dirección anterior</td><td>No</td><td>—</td></tr>
<tr><td>Situación laboral</td><td>No</td><td>Documentación de solvencia</td></tr>
<tr><td>Tipo (persona física/jurídica)</td><td>SÍ</td><td>Contrato — si es empresa, CIF</td></tr>
</table>

<h2>5.2 Verificar nombres cargados vs realidad</h2>
<p>Los NOMBRES de los 124 inquilinos de Rovida SÍ parecen ser reales (cargados desde subcuentas contables 4300). Diego debe:</p>
<div class="step" style="background:#f0f7ff; border-radius:6px; padding:10px;">
&#9744; Obtener del sistema contable (Alfonso) el listado de inquilinos activos por subcuenta 4300<br>
&#9744; Cruzar con los 124 cargados: ¿sobran? ¿faltan?<br>
&#9744; Para cada inquilino activo: completar DNI real, email real, teléfono real<br>
&#9744; Marcar como inactivos los que ya no tienen contrato<br>
&#9744; Para Viroda: rehacer los 8 inquilinos con datos reales
</div>

<h2>5.3 Volumen estimado</h2>
<table>
<tr><th>Sociedad</th><th>Inquilinos cargados</th><th>Estimación activos</th><th>Datos a corregir por inquilino</th></tr>
<tr><td>Rovida</td><td>124</td><td>~80-100 activos</td><td>DNI + email + teléfono + IBAN = 4 campos</td></tr>
<tr><td>Viroda</td><td>8</td><td>~30-50 (faltan la mayoría)</td><td>Todos los campos (crear de cero)</td></tr>
</table>

<!-- CAP 6 -->
<h1>6. Contratos — Datos Reales a Cargar</h1>

<div class="critical"><strong>Los contratos cargados tienen fechas y rentas ficticias.</strong> Todos los contratos de Rovida son 2025-01-01 a 2025-12-31 con rentas heurísticas. Deben corregirse con datos del contrato real firmado.</div>

<h2>6.1 Para CADA contrato activo, verificar/corregir:</h2>
<table>
<tr><th>Campo</th><th>Obligatorio</th><th>Valor actual (FALSO)</th><th>Dato real necesario</th></tr>
<tr><td><strong>Unidad vinculada</strong></td><td>SÍ</td><td>Puede estar mal asignada</td><td>&#9744; Verificar que unidad es correcta</td></tr>
<tr><td><strong>Inquilino vinculado</strong></td><td>SÍ</td><td>Asignado automáticamente</td><td>&#9744; Verificar que coincide</td></tr>
<tr><td><strong>Fecha de inicio</strong></td><td>SÍ</td><td><code>2025-01-01</code></td><td>&#9744; Fecha real del contrato</td></tr>
<tr><td><strong>Fecha de fin</strong></td><td>SÍ</td><td><code>2025-12-31</code></td><td>&#9744; Fecha real</td></tr>
<tr><td><strong>Renta mensual</strong></td><td>SÍ</td><td>Heurística/estimada</td><td>&#9744; Renta pactada real (€)</td></tr>
<tr><td><strong>Depósito/fianza</strong></td><td>SÍ</td><td>= rentaMensual</td><td>&#9744; Fianza real depositada</td></tr>
<tr><td>Tipo actualización</td><td>SÍ</td><td><code>IPC</code> por defecto</td><td>&#9744; Verificar: IPC, IRAV, pactado, sin</td></tr>
<tr><td>Tipo contrato</td><td>SÍ</td><td><code>residencial</code></td><td>&#9744; Residencial, temporal, comercial</td></tr>
<tr><td>Renovación automática</td><td>No</td><td><code>false</code></td><td>&#9744; ¿Se renueva automáticamente?</td></tr>
<tr><td>Gastos incluidos</td><td>No</td><td>Vacío</td><td>&#9744; ¿Qué gastos incluye la renta?</td></tr>
<tr><td>PDF del contrato firmado</td><td>Recomendado</td><td>No cargado</td><td>&#9744; Subir escaneo del contrato</td></tr>
</table>

<h2>6.2 Fuente de los datos</h2>
<div class="tip">
<strong>Imprescindible:</strong> Obtener copia de cada contrato de arrendamiento vigente (digital o escaneado). Del contrato se extraen: fechas, renta, fianza, cláusulas de actualización, gastos incluidos.
<br><br>
<strong>Alternativa rápida:</strong> Pedir a Alfonso un listado de contratos activos con: unidad, inquilino, renta mensual, fecha inicio/fin. Cruzar con lo cargado.
</div>

<!-- CAP 7 -->
<h1>7. Pagos — Histórico y Configuración</h1>

<div class="warning"><strong>No hay NINGÚN pago registrado en el sistema.</strong> Es necesario cargar al menos el último mes de pagos para que el dashboard muestre datos reales.</div>

<h2>7.1 Datos a cargar</h2>
<table>
<tr><th>Dato</th><th>Fuente</th><th>Acción</th></tr>
<tr><td>Pagos del mes actual</td><td>Extractos bancarios / contabilidad</td><td>&#9744; Registrar cada cobro recibido</td></tr>
<tr><td>Impagos actuales</td><td>Control de Alfonso</td><td>&#9744; Registrar pagos pendientes/vencidos</td></tr>
<tr><td>Método de cobro por inquilino</td><td>Preguntar</td><td>&#9744; Transferencia / domiciliación / efectivo</td></tr>
<tr><td>Día de cobro por contrato</td><td>Contrato</td><td>&#9744; Día del mes (1-31)</td></tr>
</table>

<h2>7.2 Recomendación</h2>
<p>Cargar mínimo los últimos 3 meses de cobros para que los gráficos del dashboard y los reportes tengan sentido. Idealmente 12 meses.</p>

<!-- CAP 8 -->
<h1>8. Seguros — Verificación de Pólizas</h1>

<h2>8.1 Pólizas de VIRODA (10 cargadas con PDF real)</h2>
<p>Estos seguros tienen datos reales extraídos de los PDFs. Diego debe verificar:</p>
<table>
<tr><th>#</th><th>Póliza</th><th>Aseguradora</th><th>Edificio</th><th>Verificar</th></tr>
<tr><td>1</td><td>057780547</td><td>Allianz</td><td>Hernández de Tejada 6</td><td>&#9744; Vigente? &#9744; Edificio correcto?</td></tr>
<tr><td>2</td><td>85265721</td><td>AXA</td><td>Candelaria Mora 12</td><td>&#9744; Vigente? &#9744; Edificio correcto?</td></tr>
<tr><td>3</td><td>85374359</td><td>AXA</td><td>Reina 15</td><td>&#9744; Vigente? &#9744; Edificio correcto?</td></tr>
<tr><td>4</td><td>85447715</td><td>AXA</td><td>Piamonte 23</td><td>&#9744; Vigente? &#9744; Edificio correcto?</td></tr>
<tr><td>5</td><td>86523893</td><td>AXA</td><td>Manuel Silvela 5</td><td>&#9744; Vigente? &#9744; Edificio correcto?</td></tr>
<tr><td>6</td><td>82712931</td><td>AXA</td><td>Menéndez Pelayo 15 - 5º</td><td>&#9744; Vigente? &#9744; Unidad correcta?</td></tr>
<tr><td>7</td><td>84844930</td><td>AXA</td><td>Menéndez Pelayo 15 - 1º</td><td>&#9744; Vigente? &#9744; Unidad correcta?</td></tr>
<tr><td>8</td><td>85481460</td><td>AXA</td><td>Menéndez Pelayo 15 - 4ºDR</td><td>&#9744; Vigente? &#9744; Unidad correcta?</td></tr>
<tr><td>9</td><td>86441815</td><td>AXA</td><td>Prado 10 (comercio)</td><td>&#9744; Vigente? &#9744; Edificio correcto?</td></tr>
<tr><td>10</td><td>(duplicado marcado)</td><td>—</td><td>—</td><td>&#9744; Eliminar si es duplicado</td></tr>
</table>

<h2>8.2 Pólizas de ROVIDA (13 cargadas — TODAS sintéticas)</h2>
<div class="critical">Las 13 pólizas de Rovida tienen números inventados (<code>SEG-TOMILLAR-001</code>, etc.) y datos genéricos. Diego debe obtener las pólizas REALES de cada edificio de Rovida y reemplazar los datos ficticios.</div>

<table>
<tr><th>Edificio Rovida</th><th>¿Tiene seguro cargado?</th><th>Acción</th></tr>
<tr><td>Garajes Espronceda 32</td><td>No</td><td>&#9744; Obtener póliza real y cargar</td></tr>
<tr><td>Garajes Hernández de Tejada 6</td><td>No (solo Viroda)</td><td>&#9744; Obtener póliza real y cargar</td></tr>
<tr><td>Locales Barquillo 30</td><td>No</td><td>&#9744; Obtener póliza real y cargar</td></tr>
<tr><td>Locales Reina 15</td><td>No</td><td>&#9744; Obtener póliza real y cargar</td></tr>
<tr><td>Edificio Piamonte 23</td><td>Sí (sintética)</td><td>&#9744; Reemplazar con póliza real</td></tr>
<tr><td>Oficinas Av Europa 34</td><td>Sí (sintética)</td><td>&#9744; Reemplazar con póliza real</td></tr>
<tr><td>Todos los de Palencia</td><td>Parcial (sintéticas)</td><td>&#9744; Obtener pólizas reales</td></tr>
<tr><td>Todos los de Benidorm</td><td>Sí (sintéticas AXA)</td><td>&#9744; Reemplazar con reales</td></tr>
<tr><td>Casa El Tomillar</td><td>Sí (sintética)</td><td>&#9744; Reemplazar con real</td></tr>
</table>

<h2>8.3 Documentos PDF de pólizas en S3</h2>
<table>
<tr><th>Sociedad</th><th>PDFs subidos a S3</th><th>Acción</th></tr>
<tr><td>Viroda</td><td>~9 PDFs bajo <code>seguros/grupo-vidaro/</code></td><td>&#9744; Verificar que se pueden descargar desde la app</td></tr>
<tr><td>Rovida</td><td>0 PDFs reales</td><td>&#9744; Obtener y subir todos los PDFs de pólizas</td></tr>
</table>

<!-- CAP 9 -->
<h1>9. Suministros — Alta de Contratos</h1>

<div class="warning">No hay NINGÚN suministro cargado en el sistema.</div>

<h2>9.1 Para cada unidad OCUPADA, registrar:</h2>
<table>
<tr><th>Suministro</th><th>Datos necesarios</th></tr>
<tr><td>Electricidad</td><td>Proveedor, nº contrato, titular, última lectura</td></tr>
<tr><td>Agua</td><td>Proveedor, nº contrato, titular, última lectura</td></tr>
<tr><td>Gas (si aplica)</td><td>Proveedor, nº contrato, titular</td></tr>
<tr><td>Internet/teléfono (si incluido)</td><td>Proveedor, nº contrato</td></tr>
</table>

<div class="tip"><strong>Prioridad baja:</strong> Este módulo es útil pero no bloquea el funcionamiento. Puede cargarse progresivamente.</div>

<!-- CAP 10 -->
<h1>10. Mantenimiento — Incidencias y Proveedores</h1>

<h2>10.1 Incidencias abiertas actuales</h2>
<p>Si hay incidencias de mantenimiento pendientes en algún inmueble, cargarlas:</p>
<table>
<tr><th>Campo</th><th>Dato necesario</th></tr>
<tr><td>Edificio y unidad afectada</td><td>Dónde está el problema</td></tr>
<tr><td>Descripción</td><td>Qué hay que reparar</td></tr>
<tr><td>Prioridad</td><td>Baja / media / alta / urgente</td></tr>
<tr><td>Proveedor asignado</td><td>Quién lo va a reparar</td></tr>
<tr><td>Presupuesto estimado</td><td>Coste previsto</td></tr>
</table>

<h2>10.2 Proveedores habituales</h2>
<p>Registrar los proveedores de mantenimiento de cada zona:</p>
<table>
<tr><th>Tipo</th><th>Datos</th></tr>
<tr><td>Fontanero</td><td>Nombre, teléfono, email, zona (Madrid/Palencia/Valladolid/Benidorm)</td></tr>
<tr><td>Electricista</td><td>Nombre, teléfono, email, zona</td></tr>
<tr><td>Cerrajero</td><td>Nombre, teléfono, email, zona</td></tr>
<tr><td>Albañil/Reformas</td><td>Nombre, teléfono, email, zona</td></tr>
<tr><td>Empresa limpieza</td><td>Nombre, teléfono, email</td></tr>
<tr><td>Mantenimiento ascensores</td><td>Empresa, nº contrato, teléfono</td></tr>
<tr><td>Mantenimiento calderas</td><td>Empresa, nº contrato, teléfono</td></tr>
</table>

<!-- CAP 11 -->
<h1>11. Documentación — Archivos a Subir</h1>

<h2>11.1 Documentos por edificio</h2>
<table>
<tr><th>Documento</th><th>Formato</th><th>Prioridad</th></tr>
<tr><td>Escritura de propiedad</td><td>PDF</td><td>Alta</td></tr>
<tr><td>Nota simple del Registro</td><td>PDF</td><td>Alta</td></tr>
<tr><td>Certificado energético (CEE)</td><td>PDF</td><td>Alta</td></tr>
<tr><td>Licencia de primera ocupación</td><td>PDF</td><td>Media</td></tr>
<tr><td>Planos del edificio</td><td>PDF/imagen</td><td>Media</td></tr>
<tr><td>ITE/IEE (si aplica)</td><td>PDF</td><td>Media</td></tr>
<tr><td>Cédula de habitabilidad</td><td>PDF</td><td>Media</td></tr>
<tr><td>Fotos exteriores e interiores</td><td>JPG/PNG</td><td>Media</td></tr>
</table>

<h2>11.2 Documentos por contrato</h2>
<table>
<tr><th>Documento</th><th>Formato</th><th>Prioridad</th></tr>
<tr><td>Contrato de arrendamiento firmado</td><td>PDF</td><td><span class="badge badge-red">Crítica</span></td></tr>
<tr><td>Justificante de fianza depositada</td><td>PDF</td><td>Alta</td></tr>
<tr><td>Inventario de entrada</td><td>PDF/fotos</td><td>Media</td></tr>
</table>

<h2>11.3 Documentos por inquilino</h2>
<table>
<tr><th>Documento</th><th>Formato</th><th>Prioridad</th></tr>
<tr><td>DNI/NIE escaneado</td><td>PDF/imagen</td><td>Alta</td></tr>
<tr><td>Justificante de ingresos/nómina</td><td>PDF</td><td>Media</td></tr>
<tr><td>Ficha de domiciliación bancaria</td><td>PDF</td><td>Si hay SEPA</td></tr>
</table>

<!-- CAP 12 -->
<h1>12. Resumen de Prioridades y Cronograma</h1>

<h2>12.1 Fase 1 — CRÍTICA (Semana 1-2)</h2>
<table>
<tr><th>#</th><th>Tarea</th><th>Volumen</th><th>&#9744;</th></tr>
<tr><td>1</td><td>Corregir datos de empresas (CIF, dirección, teléfono)</td><td>3 sociedades</td><td>&#9744;</td></tr>
<tr><td>2</td><td>Verificar edificios: eliminar duplicados, completar direcciones y CP</td><td>24 edificios</td><td>&#9744;</td></tr>
<tr><td>3</td><td>Verificar unidades: contar, corregir rentas reales</td><td>~350 unidades</td><td>&#9744;</td></tr>
<tr><td>4</td><td>Completar datos reales de inquilinos activos (DNI, email, teléfono)</td><td>~100-130 inquilinos</td><td>&#9744;</td></tr>
<tr><td>5</td><td>Corregir contratos: fechas reales, rentas reales, tipo actualización</td><td>~100-130 contratos</td><td>&#9744;</td></tr>
<tr><td>6</td><td>Cambiar contraseñas de todos los usuarios</td><td>6 usuarios</td><td>&#9744;</td></tr>
</table>

<h2>12.2 Fase 2 — IMPORTANTE (Semana 2-3)</h2>
<table>
<tr><th>#</th><th>Tarea</th><th>Volumen</th><th>&#9744;</th></tr>
<tr><td>7</td><td>Cargar pagos últimos 3 meses</td><td>~300-400 pagos</td><td>&#9744;</td></tr>
<tr><td>8</td><td>Verificar seguros Viroda (vinculación edificio correcta)</td><td>9 pólizas</td><td>&#9744;</td></tr>
<tr><td>9</td><td>Reemplazar seguros sintéticos Rovida con pólizas reales</td><td>13 pólizas</td><td>&#9744;</td></tr>
<tr><td>10</td><td>Subir PDFs de contratos firmados</td><td>~100 PDFs</td><td>&#9744;</td></tr>
<tr><td>11</td><td>Completar datos de edificios (ref. catastral, IBI, CEE, comunidad)</td><td>24 edificios</td><td>&#9744;</td></tr>
</table>

<h2>12.3 Fase 3 — DESEABLE (Semana 3-4)</h2>
<table>
<tr><th>#</th><th>Tarea</th><th>Volumen</th><th>&#9744;</th></tr>
<tr><td>12</td><td>Subir documentación (escrituras, notas simples, CEE)</td><td>~24-50 documentos</td><td>&#9744;</td></tr>
<tr><td>13</td><td>Registrar proveedores de mantenimiento</td><td>~10-15 proveedores</td><td>&#9744;</td></tr>
<tr><td>14</td><td>Cargar incidencias abiertas actuales</td><td>Variable</td><td>&#9744;</td></tr>
<tr><td>15</td><td>Registrar suministros por unidad</td><td>~50-100 contratos</td><td>&#9744;</td></tr>
<tr><td>16</td><td>Subir fotos de edificios y unidades</td><td>~50-100 fotos</td><td>&#9744;</td></tr>
<tr><td>17</td><td>Cargar garajes/trasteros como entidades separadas</td><td>Variable</td><td>&#9744;</td></tr>
</table>

<h2>12.4 Fuentes de información necesarias</h2>
<table>
<tr><th>Fuente</th><th>Qué obtener</th><th>Contacto</th></tr>
<tr><td><strong>Alfonso (Contabilidad)</strong></td><td>Listado inquilinos activos, rentas reales, impagos, CIFs sociedades</td><td>&#9744; Solicitar</td></tr>
<tr><td><strong>Contratos originales</strong></td><td>Fechas, rentas, fianzas, cláusulas IPC, PDFs firmados</td><td>&#9744; Localizar archivo</td></tr>
<tr><td><strong>Mediador de seguros</strong></td><td>Pólizas reales de Rovida (nº póliza, aseguradora, coberturas, PDFs)</td><td>&#9744; Solicitar</td></tr>
<tr><td><strong>Catastro online</strong></td><td>Referencias catastrales de cada inmueble</td><td>catastro.hacienda.gob.es</td></tr>
<tr><td><strong>Ayuntamientos</strong></td><td>Recibos IBI anuales por inmueble</td><td>&#9744; Obtener últimos recibos</td></tr>
<tr><td><strong>Administradores de fincas</strong></td><td>Gastos de comunidad mensuales por edificio</td><td>&#9744; Solicitar</td></tr>
</table>

<hr style="border: none; border-top: 2px solid #0f3460; margin: 30px 0;">

<div class="footer">
  <p><strong>INMOVA APP</strong> — Checklist de Datos para Puesta en Marcha</p>
  <p>Grupo Vidaro Inversiones — Gestión Inmobiliaria</p>
  <p>Abril 2026 — Documento para uso interno</p>
</div>

</body>
</html>`;

const outputPath = resolve(process.cwd(), 'CHECKLIST_DATOS_GESTOR_VIDARO.pdf');

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/local/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setContent(HTML, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:7px;width:100%;text-align:center;color:#999;margin-top:4mm;">CHECKLIST DE DATOS — Grupo Vidaro — Gestión Inmobiliaria — CONFIDENCIAL</div>',
    footerTemplate: '<div style="font-size:7px;width:100%;text-align:center;color:#999;margin-bottom:4mm;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>',
  });
  await browser.close();
  console.log('PDF generado:', outputPath);
}

main().catch(e => { console.error(e); process.exit(1); });
