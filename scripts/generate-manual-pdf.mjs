import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 25mm 20mm 25mm 20mm; size: A4; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; line-height: 1.6; font-size: 11pt; }
  h1 { color: #0f3460; font-size: 22pt; border-bottom: 3px solid #0f3460; padding-bottom: 8px; page-break-before: always; margin-top: 0; }
  h1:first-of-type { page-break-before: avoid; }
  h2 { color: #16213e; font-size: 16pt; border-bottom: 1.5px solid #e94560; padding-bottom: 4px; margin-top: 28px; }
  h3 { color: #0f3460; font-size: 13pt; margin-top: 20px; }
  h4 { color: #e94560; font-size: 11pt; margin-top: 14px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
  th { background: #0f3460; color: white; padding: 8px 10px; text-align: left; }
  td { padding: 6px 10px; border-bottom: 1px solid #ddd; }
  tr:nth-child(even) { background: #f8f9fa; }
  .cover { text-align: center; padding: 120px 40px 60px; page-break-after: always; }
  .cover h1 { border: none; font-size: 32pt; color: #0f3460; page-break-before: avoid; }
  .cover .subtitle { font-size: 16pt; color: #e94560; margin-top: 10px; }
  .cover .info { font-size: 11pt; color: #666; margin-top: 40px; }
  .cover .logo { font-size: 48pt; color: #0f3460; margin-bottom: 20px; }
  .tip { background: #e8f4fd; border-left: 4px solid #0f3460; padding: 10px 14px; margin: 12px 0; font-size: 10pt; }
  .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px 14px; margin: 12px 0; font-size: 10pt; }
  .step { background: #f0f7ff; border-radius: 6px; padding: 12px 16px; margin: 8px 0; }
  .step-num { display: inline-block; background: #0f3460; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; margin-right: 8px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9pt; font-weight: bold; }
  .badge-admin { background: #e94560; color: white; }
  .badge-gestor { background: #0f3460; color: white; }
  .badge-operador { background: #6c757d; color: white; }
  ul, ol { margin: 6px 0; padding-left: 24px; }
  li { margin: 3px 0; }
  .toc { page-break-after: always; }
  .toc a { color: #0f3460; text-decoration: none; }
  .toc li { margin: 6px 0; }
  .footer { text-align: center; font-size: 9pt; color: #999; margin-top: 40px; }
  code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-size: 10pt; }
  .separator { border: none; border-top: 2px solid #0f3460; margin: 30px 0; }
</style>
</head>
<body>

<!-- PORTADA -->
<div class="cover">
  <div class="logo">&#127970;</div>
  <h1>MANUAL DE USUARIO<br>INMOVA APP</h1>
  <div class="subtitle">Grupo Vidaro Inversiones</div>
  <div class="info">
    <p><strong>Plataforma de Gestión Inmobiliaria Integral</strong></p>
    <p>Versión 3.0 — Abril 2026</p>
    <p>Documento confidencial — Uso interno</p>
    <p style="margin-top: 40px; font-size: 10pt;">
      Sociedades: Grupo Vidaro Inversiones · Rovida S.L.U. · Viroda Inversiones S.L.U. · VIBLA PE SCR S.A.
    </p>
  </div>
</div>

<!-- ÍNDICE -->
<div class="toc">
<h1 style="page-break-before: avoid;">ÍNDICE DE CONTENIDOS</h1>
<ol style="font-size: 12pt; line-height: 2.2;">
  <li><a href="#cap1">Introducción y Estructura del Grupo Vidaro</a></li>
  <li><a href="#cap2">Acceso a la Plataforma y Roles de Usuario</a></li>
  <li><a href="#cap3">Panel de Control (Dashboard)</a></li>
  <li><a href="#cap4">Gestión de Edificios y Propiedades</a></li>
  <li><a href="#cap5">Gestión de Unidades (Pisos, Locales, Garajes)</a></li>
  <li><a href="#cap6">Gestión de Inquilinos</a></li>
  <li><a href="#cap7">Gestión de Contratos</a></li>
  <li><a href="#cap8">Gestión de Pagos y Cobros</a></li>
  <li><a href="#cap9">Facturación</a></li>
  <li><a href="#cap10">Seguros</a></li>
  <li><a href="#cap11">Mantenimiento e Incidencias</a></li>
  <li><a href="#cap12">Suministros y Garajes/Trasteros</a></li>
  <li><a href="#cap13">Finanzas y Banca del Grupo</a></li>
  <li><a href="#cap14">Actualización de Rentas (IPC)</a></li>
  <li><a href="#cap15">Documentos y Archivos</a></li>
  <li><a href="#cap16">Calendario y Alertas</a></li>
  <li><a href="#cap17">Inteligencia Artificial</a></li>
  <li><a href="#cap18">Inversiones y Family Office</a></li>
  <li><a href="#cap19">Reportes y Analítica</a></li>
  <li><a href="#cap20">Administración y Configuración</a></li>
  <li><a href="#cap21">Portales Externos (Inquilino, Propietario, Proveedor)</a></li>
  <li><a href="#cap22">Comunidades de Propietarios</a></li>
  <li><a href="#cap23">Preguntas Frecuentes</a></li>
</ol>
</div>

<!-- CAPÍTULO 1 -->
<h1 id="cap1">1. Introducción y Estructura del Grupo Vidaro</h1>

<h2>1.1 Sobre Inmova App</h2>
<p>Inmova es una plataforma PropTech de gestión inmobiliaria integral diseñada para gestores de patrimonio, empresas de alquiler y family offices. Permite centralizar toda la operativa inmobiliaria: desde la gestión de edificios e inquilinos hasta la facturación, seguros, banca y análisis de inversiones con inteligencia artificial.</p>

<h2>1.2 Estructura Empresarial del Grupo Vidaro</h2>
<p>El sistema está configurado con la siguiente jerarquía de sociedades:</p>

<table>
<tr><th>Sociedad</th><th>Tipo</th><th>Relación</th><th>Actividad Principal</th></tr>
<tr><td><strong>Grupo Vidaro Inversiones</strong></td><td>Holding / Matriz</td><td>—</td><td>Dirección estratégica, consolidación</td></tr>
<tr><td><strong>Rovida S.L.U.</strong></td><td>Filial 100%</td><td>Hija de Vidaro</td><td>Gestión patrimonial inmobiliaria</td></tr>
<tr><td><strong>Viroda Inversiones S.L.U.</strong></td><td>Filial 100%</td><td>Hija de Vidaro</td><td>Gestión patrimonial inmobiliaria</td></tr>
<tr><td><strong>VIBLA PE SCR S.A.</strong></td><td>SCR</td><td>Filial de Vidaro</td><td>Inversión en Private Equity</td></tr>
<tr><td>Facundo Blanco S.A.</td><td>Participada</td><td>100%</td><td>Actividad empresarial</td></tr>
<tr><td>Disfasa S.A.U.</td><td>Participada</td><td>100%</td><td>Actividad empresarial</td></tr>
<tr><td>Los Girasoles S.A.U.</td><td>Participada</td><td>100%</td><td>Actividad empresarial</td></tr>
<tr><td>PDV Gesfasa Desarrollo SLU</td><td>Participada</td><td>100%</td><td>Desarrollo</td></tr>
</table>

<div class="tip"><strong>Nota:</strong> Al acceder a Inmova, el usuario puede cambiar entre las sociedades del grupo desde el selector de empresa en la cabecera. Cada sociedad tiene sus propios edificios, inquilinos, contratos y datos financieros.</div>

<h2>1.3 URL de Acceso</h2>
<p><strong>Producción:</strong> <code>https://inmovaapp.com</code></p>
<p><strong>Login:</strong> <code>https://inmovaapp.com/login</code></p>

<!-- CAPÍTULO 2 -->
<h1 id="cap2">2. Acceso a la Plataforma y Roles de Usuario</h1>

<h2>2.1 Cuentas de Usuario Configuradas</h2>

<table>
<tr><th>Email</th><th>Rol</th><th>Sociedad</th><th>Permisos Clave</th></tr>
<tr><td>admin@grupovidaro.com</td><td><span class="badge badge-admin">Administrador</span></td><td>Grupo Vidaro</td><td>Acceso total, gestión usuarios, finanzas, configuración</td></tr>
<tr><td>director.financiero@grupovidaro.com</td><td><span class="badge badge-gestor">Gestor</span></td><td>Grupo Vidaro</td><td>CRUD inmuebles/inquilinos/contratos, sin eliminar, sin finanzas avanzadas</td></tr>
<tr><td>admin@rovida.com</td><td><span class="badge badge-admin">Administrador</span></td><td>Rovida</td><td>Acceso total dentro de Rovida</td></tr>
<tr><td>operador@rovida.com</td><td><span class="badge badge-operador">Operador</span></td><td>Rovida</td><td>Solo lectura y operaciones básicas</td></tr>
<tr><td>admin@virodainversiones.com</td><td><span class="badge badge-admin">Administrador</span></td><td>Viroda Inversiones</td><td>Acceso total dentro de Viroda</td></tr>
<tr><td>propietario@virodainversiones.com</td><td><span class="badge badge-gestor">Gestor</span></td><td>Viroda Inversiones</td><td>Consulta y edición limitada</td></tr>
</table>

<div class="warning"><strong>Importante:</strong> Cambiar las contraseñas por defecto en el primer acceso. Ir a Configuración → Perfil → Cambiar contraseña.</div>

<h2>2.2 Roles y Permisos</h2>

<table>
<tr><th>Permiso</th><th><span class="badge badge-admin">Administrador</span></th><th><span class="badge badge-gestor">Gestor</span></th><th><span class="badge badge-operador">Operador</span></th></tr>
<tr><td>Ver datos (edificios, inquilinos, contratos)</td><td>✅</td><td>✅</td><td>✅</td></tr>
<tr><td>Crear edificios, unidades, inquilinos</td><td>✅</td><td>✅</td><td>❌</td></tr>
<tr><td>Editar datos existentes</td><td>✅</td><td>✅</td><td>❌</td></tr>
<tr><td>Eliminar registros</td><td>✅</td><td>❌</td><td>❌</td></tr>
<tr><td>Gestionar usuarios</td><td>✅</td><td>❌</td><td>❌</td></tr>
<tr><td>Ver finanzas y banca</td><td>✅</td><td>❌</td><td>❌</td></tr>
<tr><td>Configuración de empresa</td><td>✅</td><td>❌</td><td>❌</td></tr>
<tr><td>Aprobar/rechazar solicitudes</td><td>✅</td><td>❌</td><td>❌</td></tr>
<tr><td>Exportar informes</td><td>✅</td><td>✅</td><td>✅</td></tr>
</table>

<h2>2.3 Proceso de Login</h2>
<div class="step"><span class="step-num">1</span> Abrir <code>https://inmovaapp.com/login</code></div>
<div class="step"><span class="step-num">2</span> Introducir email y contraseña</div>
<div class="step"><span class="step-num">3</span> Pulsar <strong>Iniciar Sesión</strong></div>
<div class="step"><span class="step-num">4</span> Se redirigirá al Dashboard principal</div>
<div class="tip">Si olvidaste la contraseña, utiliza el enlace "¿Olvidaste tu contraseña?" en la pantalla de login.</div>

<h2>2.4 Cambio de Sociedad</h2>
<p>En la cabecera superior de la aplicación aparece el nombre de la sociedad activa. Para cambiar:</p>
<div class="step"><span class="step-num">1</span> Hacer clic en el nombre de la sociedad actual</div>
<div class="step"><span class="step-num">2</span> Seleccionar la sociedad destino (Rovida, Viroda, etc.)</div>
<div class="step"><span class="step-num">3</span> Los datos se actualizarán automáticamente</div>

<!-- CAPÍTULO 3 -->
<h1 id="cap3">3. Panel de Control (Dashboard)</h1>

<h2>3.1 Acceso</h2>
<p>URL: <code>/dashboard</code> — Se muestra automáticamente tras el login.</p>

<h2>3.2 KPIs Principales</h2>
<p>El dashboard muestra en tiempo real:</p>
<ul>
  <li><strong>Ingresos mensuales:</strong> Suma de rentas de contratos activos</li>
  <li><strong>Unidades totales:</strong> Total de unidades gestionadas</li>
  <li><strong>Tasa de ocupación:</strong> Porcentaje de unidades ocupadas (excluyendo garajes)</li>
  <li><strong>Morosidad:</strong> Pagos pendientes/vencidos</li>
  <li><strong>Ingresos netos:</strong> Ingresos menos gastos</li>
  <li><strong>Margen neto:</strong> Porcentaje de beneficio</li>
</ul>

<h2>3.3 Widgets Informativos</h2>
<ul>
  <li><strong>Pagos pendientes:</strong> Lista de cobros por recibir con enlace a /pagos</li>
  <li><strong>Contratos por vencer:</strong> Contratos que expiran en los próximos 30 días</li>
  <li><strong>Mantenimiento activo:</strong> Incidencias abiertas pendientes de resolución</li>
  <li><strong>Unidades disponibles:</strong> Inmuebles sin inquilino actual</li>
</ul>

<h2>3.4 Gráficos</h2>
<ul>
  <li>Gráfico de barras con ingresos mensuales (últimos 12 meses)</li>
  <li>Gráfico circular de distribución de gastos</li>
  <li>Tarjeta de ocupación por tipo de inmueble</li>
</ul>

<div class="tip"><strong>Dashboard Ejecutivo:</strong> Disponible en <code>/dashboard/ejecutivo</code> — Vista consolidada del patrimonio, indicadores operativos y alertas para dirección.</div>

<!-- CAPÍTULO 4 -->
<h1 id="cap4">4. Gestión de Edificios y Propiedades</h1>

<h2>4.1 Acceso</h2>
<p>Menú lateral: <strong>Propiedades → Edificios</strong> o URL <code>/edificios</code></p>

<h2>4.2 Listado de Edificios</h2>
<p>Muestra todos los edificios de la sociedad activa con:</p>
<ul>
  <li>Nombre y dirección</li>
  <li>Número de unidades</li>
  <li>Tasa de ocupación</li>
  <li>Ingresos mensuales</li>
  <li>Buscador y filtros</li>
</ul>

<h2>4.3 Crear un Edificio</h2>
<div class="step"><span class="step-num">1</span> Pulsar <strong>+ Nuevo Edificio</strong> o ir a <code>/edificios/nuevo-wizard</code></div>
<div class="step"><span class="step-num">2</span> Completar datos obligatorios:
  <ul>
    <li><strong>Nombre</strong> del edificio (ej: "Hernández de Tejada 6")</li>
    <li><strong>Dirección</strong> completa</li>
    <li><strong>Código postal</strong> y <strong>ciudad</strong></li>
    <li><strong>Tipo</strong>: residencial, comercial, mixto</li>
  </ul>
</div>
<div class="step"><span class="step-num">3</span> Datos opcionales recomendados:
  <ul>
    <li>Referencia catastral</li>
    <li>Año de construcción</li>
    <li>Número de plantas</li>
    <li>Certificado energético (tipo y fecha)</li>
    <li>Gastos de comunidad mensuales</li>
    <li>IBI anual</li>
    <li>Características: ascensor, garaje, trastero, piscina, jardín</li>
  </ul>
</div>
<div class="step"><span class="step-num">4</span> Pulsar <strong>Guardar</strong></div>

<h2>4.4 Detalle del Edificio</h2>
<p>Al hacer clic en un edificio se muestra:</p>
<ul>
  <li><strong>Ficha técnica:</strong> Todos los datos registrados</li>
  <li><strong>Galería de fotos:</strong> Imágenes del edificio</li>
  <li><strong>Mapa:</strong> Ubicación con MapBox</li>
  <li><strong>Plano catastral:</strong> Visor de parcela</li>
  <li><strong>Listado de unidades:</strong> Con estado, inquilino y renta</li>
  <li><strong>Documentos:</strong> PDFs y archivos asociados</li>
  <li><strong>Asistente IA:</strong> Análisis documental y sugerencias</li>
</ul>

<!-- CAPÍTULO 5 -->
<h1 id="cap5">5. Gestión de Unidades</h1>

<h2>5.1 Acceso</h2>
<p>Menú lateral: <strong>Propiedades → Unidades</strong> o desde el detalle de un edificio</p>

<h2>5.2 Crear una Unidad</h2>
<div class="step"><span class="step-num">1</span> Desde el edificio, pulsar <strong>+ Añadir Unidad</strong></div>
<div class="step"><span class="step-num">2</span> Completar:
  <ul>
    <li><strong>Número/piso/puerta</strong> (ej: "3ºA")</li>
    <li><strong>Tipo:</strong> vivienda, local comercial, garaje, trastero</li>
    <li><strong>Superficie</strong> en m²</li>
    <li><strong>Habitaciones</strong> y <strong>baños</strong></li>
    <li><strong>Renta mensual</strong> actual</li>
    <li><strong>Estado:</strong> disponible, ocupada, en mantenimiento</li>
  </ul>
</div>
<div class="step"><span class="step-num">3</span> Guardar</div>

<h2>5.3 Detalle de Unidad</h2>
<p>Pestañas disponibles:</p>
<ul>
  <li><strong>Información:</strong> Datos técnicos de la unidad</li>
  <li><strong>Inquilino:</strong> Inquilino actual (si ocupada)</li>
  <li><strong>Contratos:</strong> Histórico de contratos</li>
  <li><strong>Documentos:</strong> Archivos asociados</li>
</ul>

<!-- CAPÍTULO 6 -->
<h1 id="cap6">6. Gestión de Inquilinos</h1>

<h2>6.1 Acceso</h2>
<p>Menú lateral: <strong>Inquilinos</strong> o URL <code>/inquilinos</code></p>

<h2>6.2 Registrar un Inquilino</h2>
<div class="step"><span class="step-num">1</span> Pulsar <strong>+ Nuevo Inquilino</strong></div>
<div class="step"><span class="step-num">2</span> Completar:
  <ul>
    <li><strong>Nombre</strong> y <strong>apellidos</strong></li>
    <li><strong>DNI/NIE</strong></li>
    <li><strong>Email</strong> y <strong>teléfono</strong></li>
    <li><strong>Cuenta bancaria</strong> (IBAN) para domiciliaciones</li>
    <li>Situación laboral (opcional)</li>
    <li>Ingresos mensuales (opcional)</li>
  </ul>
</div>
<div class="step"><span class="step-num">3</span> Guardar</div>

<h2>6.3 Ficha del Inquilino</h2>
<p>Información completa: datos personales, contratos vinculados, histórico de pagos, documentos, incidencias reportadas y comunicaciones.</p>

<!-- CAPÍTULO 7 -->
<h1 id="cap7">7. Gestión de Contratos</h1>

<h2>7.1 Acceso</h2>
<p>Menú lateral: <strong>Contratos</strong> o URL <code>/contratos</code></p>

<h2>7.2 Crear un Contrato</h2>
<div class="step"><span class="step-num">1</span> Ir a <code>/contratos/nuevo</code> o pulsar <strong>+ Nuevo Contrato</strong></div>
<div class="step"><span class="step-num">2</span> Formulario guiado (wizard móvil-compatible):
  <ul>
    <li><strong>Seleccionar Unidad:</strong> Del edificio correspondiente</li>
    <li><strong>Seleccionar Inquilino:</strong> Del listado registrado</li>
    <li><strong>Fecha de inicio</strong> y <strong>fecha de fin</strong></li>
    <li><strong>Renta mensual</strong> (€)</li>
    <li><strong>Depósito/fianza:</strong> Importe y meses</li>
    <li><strong>Tipo de contrato:</strong> Residencial, temporal, vacacional</li>
    <li><strong>Tipo de actualización:</strong> IPC, IRAV, pactado, sin actualización</li>
    <li><strong>Gastos incluidos/excluidos</strong></li>
    <li><strong>Cláusulas adicionales</strong></li>
  </ul>
</div>
<div class="step"><span class="step-num">3</span> Subir PDF del contrato firmado (opcional)</div>
<div class="step"><span class="step-num">4</span> Guardar → La unidad se marca automáticamente como <strong>"Ocupada"</strong></div>

<div class="tip"><strong>Asistente IA:</strong> Durante la creación del contrato, el asistente de IA puede ayudar a redactar cláusulas y revisar condiciones.</div>

<h2>7.3 Estados del Contrato</h2>
<table>
<tr><th>Estado</th><th>Descripción</th></tr>
<tr><td><strong>Activo</strong></td><td>Contrato en vigor</td></tr>
<tr><td><strong>Próximo a vencer</strong></td><td>Expira en los próximos 30-60 días</td></tr>
<tr><td><strong>Vencido</strong></td><td>Fecha fin superada — la unidad se libera automáticamente</td></tr>
<tr><td><strong>Renovado</strong></td><td>Se ha generado un nuevo contrato</td></tr>
</table>

<h2>7.4 Renovación de Contratos</h2>
<p>Desde el detalle del contrato, pulsar <strong>Renovar</strong> para generar un nuevo contrato con los datos actualizados.</p>

<h2>7.5 Firma Digital</h2>
<p>La plataforma genera PDFs de contratos y soporta firma digital. Desde el detalle del contrato, pulsar <strong>Solicitar Firma</strong> para iniciar el proceso con los firmantes.</p>

<!-- CAPÍTULO 8 -->
<h1 id="cap8">8. Gestión de Pagos y Cobros</h1>

<h2>8.1 Acceso</h2>
<p>Menú lateral: <strong>Pagos</strong> o URL <code>/pagos</code></p>

<h2>8.2 Registrar un Pago</h2>
<div class="step"><span class="step-num">1</span> Pulsar <strong>+ Nuevo Pago</strong></div>
<div class="step"><span class="step-num">2</span> Seleccionar contrato, importe, fecha y método de pago</div>
<div class="step"><span class="step-num">3</span> Guardar</div>

<h2>8.3 Marcar como Pagado</h2>
<p>En el listado de pagos, pulsar el botón <strong>Marcar Pagado</strong> junto al pago correspondiente.</p>

<h2>8.4 Exportación SEPA</h2>
<p>Para domiciliación bancaria:</p>
<div class="step"><span class="step-num">1</span> Ir a <code>/pagos/sepa</code></div>
<div class="step"><span class="step-num">2</span> Seleccionar pagos pendientes</div>
<div class="step"><span class="step-num">3</span> Generar fichero SEPA XML para enviar al banco</div>

<h2>8.5 Alertas de Morosidad</h2>
<p>El sistema genera alertas automáticas cuando un pago supera su fecha de vencimiento. Se muestran en el Dashboard y en la sección de Alertas.</p>

<!-- CAPÍTULO 9 -->
<h1 id="cap9">9. Facturación</h1>

<h2>9.1 Acceso</h2>
<p>Menú lateral: <strong>Finanzas → Facturación</strong> o URL <code>/facturacion</code></p>

<h2>9.2 Series de Facturación</h2>
<p>Configurar series antes de emitir facturas:</p>
<div class="step"><span class="step-num">1</span> Ir a la pestaña <strong>Series</strong></div>
<div class="step"><span class="step-num">2</span> Crear series: F- (facturas), P- (proformas), R- (rectificativas)</div>
<div class="step"><span class="step-num">3</span> Cada serie mantiene numeración correlativa automática</div>

<h2>9.3 Crear una Factura</h2>
<div class="step"><span class="step-num">1</span> Pulsar <strong>+ Nueva Factura</strong></div>
<div class="step"><span class="step-num">2</span> Seleccionar serie, tipo (factura/proforma/rectificativa)</div>
<div class="step"><span class="step-num">3</span> Indicar destinatario (nombre y NIF), concepto, base imponible, IVA% e IRPF%</div>
<div class="step"><span class="step-num">4</span> El sistema calcula automáticamente impuestos y total</div>
<div class="step"><span class="step-num">5</span> Guardar como borrador o emitir directamente</div>

<h2>9.4 Estados de Factura</h2>
<table>
<tr><th>Estado</th><th>Descripción</th></tr>
<tr><td>Borrador</td><td>En preparación, editable</td></tr>
<tr><td>Emitida</td><td>Enviada al destinatario, pendiente de cobro</td></tr>
<tr><td>Pagada</td><td>Cobro confirmado</td></tr>
<tr><td>Anulada</td><td>Factura cancelada</td></tr>
<tr><td>Rectificada</td><td>Sustituida por factura rectificativa</td></tr>
</table>

<h2>9.5 KPIs de Facturación</h2>
<p>En la cabecera del módulo se muestran:</p>
<ul>
  <li>Total facturado (excluyendo anuladas y borradores)</li>
  <li>Pendiente de cobro (facturas emitidas)</li>
  <li>Facturas del mes en curso</li>
</ul>

<!-- CAPÍTULO 10 -->
<h1 id="cap10">10. Seguros</h1>

<h2>10.1 Acceso</h2>
<p>Menú lateral: <strong>Seguros</strong> o URL <code>/seguros</code></p>

<h2>10.2 Pólizas Registradas (Viroda)</h2>
<p>El sistema ya tiene cargadas pólizas de comunidad para los edificios de Viroda Inversiones (Allianz, AXA) con sus documentos PDF en almacenamiento cloud.</p>

<h2>10.3 Registrar una Póliza</h2>
<div class="step"><span class="step-num">1</span> Pulsar <strong>+ Nuevo Seguro</strong></div>
<div class="step"><span class="step-num">2</span> Completar:
  <ul>
    <li>Número de póliza</li>
    <li>Aseguradora</li>
    <li>Tipo: comunidad, hogar, comercio</li>
    <li>Tomador</li>
    <li>Edificio y/o unidad vinculada</li>
    <li>Fechas de inicio y vencimiento</li>
    <li>Prima mensual/anual</li>
    <li>Coberturas</li>
  </ul>
</div>
<div class="step"><span class="step-num">3</span> Subir PDF de la póliza</div>
<div class="step"><span class="step-num">4</span> Guardar</div>

<h2>10.4 Propagación de Cobertura</h2>
<p>Las pólizas de edificio se propagan automáticamente a todas sus unidades. En la ficha de cada unidad aparece la cobertura del seguro del edificio.</p>

<h2>10.5 Alertas de Vencimiento</h2>
<p>El sistema genera alertas cuando una póliza está próxima a vencer, visible en el Dashboard y en Alertas.</p>

<!-- CAPÍTULO 11 -->
<h1 id="cap11">11. Mantenimiento e Incidencias</h1>

<h2>11.1 Acceso</h2>
<p>Menú lateral: <strong>Mantenimiento</strong> o URL <code>/mantenimiento</code></p>

<h2>11.2 Crear Solicitud de Mantenimiento</h2>
<div class="step"><span class="step-num">1</span> Ir a <code>/mantenimiento/nuevo</code></div>
<div class="step"><span class="step-num">2</span> Seleccionar edificio y unidad afectada</div>
<div class="step"><span class="step-num">3</span> Describir la incidencia: título, descripción, prioridad (baja/media/alta/urgente)</div>
<div class="step"><span class="step-num">4</span> Asignar proveedor (si procede)</div>
<div class="step"><span class="step-num">5</span> Guardar</div>

<h2>11.3 Tablero Kanban</h2>
<p>Disponible en <code>/mantenimiento/kanban</code>. Columnas:</p>
<table>
<tr><th>Columna</th><th>Descripción</th></tr>
<tr><td><strong>Pendiente</strong></td><td>Solicitudes nuevas sin asignar</td></tr>
<tr><td><strong>En progreso</strong></td><td>Asignadas y en ejecución</td></tr>
<tr><td><strong>Resuelto</strong></td><td>Completadas con coste final registrado</td></tr>
</table>
<p>Arrastrar tarjetas entre columnas para actualizar el estado.</p>

<h2>11.4 Mantenimiento Preventivo</h2>
<p>Programar mantenimientos recurrentes (ascensores, calderas, plagas) con frecuencia configurable y alertas de próxima fecha.</p>

<h2>11.5 IA para Clasificación</h2>
<p>El sistema clasifica automáticamente las incidencias (fontanería, electricidad, HVAC, etc.) y sugiere proveedor adecuado con estimación de coste.</p>

<!-- CAPÍTULO 12 -->
<h1 id="cap12">12. Suministros y Garajes/Trasteros</h1>

<h2>12.1 Suministros</h2>
<p>Menú: <strong>Suministros</strong> o URL <code>/suministros</code></p>
<p>Registrar y gestionar contratos de suministros por unidad:</p>
<ul>
  <li>Tipos: electricidad, agua, gas, internet, teléfono</li>
  <li>Proveedor y número de contrato</li>
  <li>Titular del contrato</li>
  <li>Lecturas periódicas con consumo</li>
  <li>Estado: activo, baja, pendiente</li>
</ul>

<h2>12.2 Garajes y Trasteros</h2>
<p>Menú: <strong>Garajes/Trasteros</strong> o URL <code>/garajes-trasteros</code></p>
<p>Gestión de plazas de garaje y trasteros vinculados a edificios:</p>
<ul>
  <li>Tipo (garaje o trastero), número, planta, m²</li>
  <li>Estado: libre, ocupado, reservado</li>
  <li>Precio mensual</li>
  <li>Vinculación a unidad e inquilino</li>
</ul>

<!-- CAPÍTULO 13 -->
<h1 id="cap13">13. Finanzas y Banca del Grupo</h1>

<h2>13.1 Acceso</h2>
<p>Menú lateral: <strong>Finanzas</strong> o URL <code>/finanzas</code></p>

<h2>13.2 Módulos Financieros</h2>
<table>
<tr><th>Módulo</th><th>URL</th><th>Función</th></tr>
<tr><td>Cuadro de Mandos</td><td>/finanzas/cuadro-de-mandos</td><td>Resumen financiero consolidado</td></tr>
<tr><td>Conciliación</td><td>/finanzas/conciliacion</td><td>Conciliar movimientos bancarios con pagos</td></tr>
<tr><td>Open Banking</td><td>/open-banking</td><td>Conexión directa con cuentas bancarias</td></tr>
<tr><td>Cobros</td><td>/pagos</td><td>Gestión de pagos y cobros</td></tr>
<tr><td>Contabilidad</td><td>/contabilidad</td><td>Importar y gestionar asientos contables</td></tr>
</table>

<h2>13.3 Banca del Grupo Vidaro</h2>
<p>URL: <code>/finanzas/bancaria-grupo</code></p>
<p>Panel consolidado con las 22 cuentas bancarias del grupo mostrando:</p>
<ul>
  <li>IBAN y saldo de cada cuenta</li>
  <li>Sociedad titular</li>
  <li>Estado de conexión Open Banking (Salt Edge / Nordigen)</li>
  <li>Mandatos SEPA activos</li>
  <li>Pagos y cobros pendientes</li>
  <li>Estado de reconciliación</li>
</ul>

<div class="tip"><strong>Sincronización automática:</strong> El sistema sincroniza transacciones bancarias del Grupo Vidaro periódicamente via <code>/api/banking/sync-grupo-vidaro</code>.</div>

<!-- CAPÍTULO 14 -->
<h1 id="cap14">14. Actualización de Rentas (IPC)</h1>

<h2>14.1 Acceso</h2>
<p>Menú lateral: <strong>Contratos → Actualización IPC</strong> o URL <code>/actualizaciones-renta</code></p>

<h2>14.2 Crear Actualización</h2>
<div class="step"><span class="step-num">1</span> Pulsar <strong>+ Nueva Actualización</strong></div>
<div class="step"><span class="step-num">2</span> Seleccionar contrato</div>
<div class="step"><span class="step-num">3</span> Indicar tipo (IPC, pactado, renta de referencia, IRAV)</div>
<div class="step"><span class="step-num">4</span> Indicar renta anterior y nueva renta</div>
<div class="step"><span class="step-num">5</span> El sistema calcula el % de incremento automáticamente</div>
<div class="step"><span class="step-num">6</span> Guardar</div>

<h2>14.3 Estados</h2>
<table>
<tr><th>Estado</th><th>Descripción</th></tr>
<tr><td>Pendiente</td><td>Calculada, pendiente de comunicar al inquilino</td></tr>
<tr><td>Comunicada</td><td>Notificada al inquilino</td></tr>
<tr><td>Aplicada</td><td>Renta actualizada en el contrato</td></tr>
<tr><td>Rechazada</td><td>El inquilino no aceptó (requiere negociación)</td></tr>
</table>

<!-- CAPÍTULO 15 -->
<h1 id="cap15">15. Documentos y Archivos</h1>

<h2>15.1 Acceso</h2>
<p>Menú lateral: <strong>Documentos</strong> o URL <code>/documentos</code></p>

<h2>15.2 Funcionalidades</h2>
<ul>
  <li><strong>Subir documentos:</strong> PDF, imágenes, Excel vinculados a edificios, unidades o inquilinos</li>
  <li><strong>Carpetas:</strong> Organizar documentos por carpetas</li>
  <li><strong>Etiquetas:</strong> Clasificar por tipo (contrato, seguro, factura, identificación)</li>
  <li><strong>Búsqueda:</strong> Buscar por nombre, tipo o entidad vinculada</li>
  <li><strong>Fechas de vencimiento:</strong> Alertas automáticas para documentos que expiran</li>
  <li><strong>Asistente IA:</strong> Análisis automático del contenido de documentos</li>
</ul>

<!-- CAPÍTULO 16 -->
<h1 id="cap16">16. Calendario y Alertas</h1>

<h2>16.1 Calendario</h2>
<p>URL: <code>/calendario</code></p>
<p>Vista mensual/semanal con todos los eventos:</p>
<ul>
  <li>Pagos programados y vencidos</li>
  <li>Vencimientos de contratos</li>
  <li>Visitas programadas</li>
  <li>Mantenimientos y revisiones</li>
  <li>Inspecciones</li>
  <li>Reuniones</li>
  <li>Recordatorios personalizados</li>
</ul>
<p>Se pueden crear eventos manualmente y el sistema genera eventos automáticos desde los datos existentes.</p>

<h2>16.2 Alertas</h2>
<p>URL: <code>/alertas</code></p>
<p>Panel centralizado de alertas por categoría:</p>
<ul>
  <li><strong>Pagos:</strong> Morosidad, cobros vencidos</li>
  <li><strong>Contratos:</strong> Próximos a vencer</li>
  <li><strong>Mantenimiento:</strong> Incidencias urgentes</li>
  <li><strong>Documentos:</strong> Documentos por vencer</li>
  <li><strong>Seguros:</strong> Pólizas próximas a renovación</li>
</ul>
<p>Prioridades: alta, media, baja. Cada alerta incluye enlace directo al elemento afectado.</p>

<!-- CAPÍTULO 17 -->
<h1 id="cap17">17. Inteligencia Artificial</h1>

<h2>17.1 Funcionalidades IA Disponibles</h2>

<table>
<tr><th>Función</th><th>Acceso</th><th>Descripción</th></tr>
<tr><td><strong>Valoración de Inmuebles</strong></td><td>/valoracion-ia</td><td>Estimación del valor de mercado con comparables, datos de zona y análisis IA</td></tr>
<tr><td><strong>Copiloto Financiero</strong></td><td>Panel financiero</td><td>Análisis consolidado del grupo (Vidaro) con recomendaciones</td></tr>
<tr><td><strong>Análisis de Inversiones</strong></td><td>/inversiones</td><td>Memo de inversión con 7 dimensiones (financiero, mercado, riesgo, fiscal...)</td></tr>
<tr><td><strong>Clasificación de Incidencias</strong></td><td>Al crear incidencia</td><td>Clasifica tipo, urgencia, proveedor y coste estimado</td></tr>
<tr><td><strong>Análisis de Documentos</strong></td><td>Asistente en documentos</td><td>Extrae datos clave de contratos, escrituras, notas simples</td></tr>
<tr><td><strong>Optimización de Rentas</strong></td><td>Desde contrato</td><td>Sugiere renta óptima basada en mercado</td></tr>
<tr><td><strong>Screening de Inquilinos</strong></td><td>Desde inquilinos</td><td>Evaluación de riesgo del inquilino</td></tr>
<tr><td><strong>Predicción de Morosidad</strong></td><td>Dashboard</td><td>Detecta inquilinos con riesgo de impago</td></tr>
<tr><td><strong>Chat IA General</strong></td><td>Widget flotante</td><td>Asistente conversacional para consultas sobre la plataforma</td></tr>
<tr><td><strong>Generador de Contratos</strong></td><td>Creación contrato</td><td>Ayuda a redactar cláusulas adaptadas</td></tr>
<tr><td><strong>Asesor de Seguros</strong></td><td>Módulo seguros</td><td>Recomendaciones de cobertura</td></tr>
<tr><td><strong>Mantenimiento Predictivo</strong></td><td>Dashboard mantenimiento</td><td>Predice incidencias recurrentes por edificio</td></tr>
</table>

<!-- CAPÍTULO 18 -->
<h1 id="cap18">18. Inversiones y Family Office</h1>

<h2>18.1 Panel de Inversiones</h2>
<p>URL: <code>/inversiones</code></p>
<p>Dashboard consolidado del patrimonio del grupo con:</p>
<ul>
  <li>Valor total del patrimonio</li>
  <li>Rentabilidad por activo</li>
  <li>Cash flow y flujos de caja</li>
  <li>Hipotecas activas</li>
  <li>Inversiones en Private Equity (VIBLA SCR)</li>
  <li>Simulador fiscal (ITP, IBI, IRPF)</li>
</ul>

<h2>18.2 Oportunidades de Inversión</h2>
<p>URL: <code>/inversiones/oportunidades</code></p>
<p>Motor de búsqueda de oportunidades con 5 fuentes:</p>
<ul>
  <li>Subastas BOE (judiciales, notariales, AEAT)</li>
  <li>Inmuebles de banca (Haya, Solvia, Aliseda)</li>
  <li>Detector IA de zonas infravaloradas</li>
  <li>Tendencias emergentes (barrios en crecimiento)</li>
  <li>Crowdfunding (Urbanitae, Wecity)</li>
</ul>
<p>Cada oportunidad incluye: scoring IA (1-100), gráfico radar comparativo, simulador de salida, calculadora de reforma y análisis de vecindario.</p>

<h2>18.3 Family Office</h2>
<p>URL: <code>/family-office/dashboard</code></p>
<p>Para VIBLA SCR y el grupo:</p>
<ul>
  <li>Portfolio consolidado con P&L</li>
  <li>Fondos de Private Equity (comprometido, desembolsado, NAV)</li>
  <li>Cuentas y tesorería</li>
  <li>Participaciones en sociedades</li>
</ul>

<!-- CAPÍTULO 19 -->
<h1 id="cap19">19. Reportes y Analítica</h1>

<h2>19.1 Acceso</h2>
<p>Menú lateral: <strong>Reportes</strong> o URL <code>/reportes</code></p>

<h2>19.2 Tipos de Informes</h2>
<table>
<tr><th>Informe</th><th>URL</th><th>Contenido</th></tr>
<tr><td>Financieros</td><td>/reportes/financieros</td><td>Ingresos brutos/netos, ROI, gastos por inmueble</td></tr>
<tr><td>Operacionales</td><td>/reportes/operacionales</td><td>Ocupación, incidencias, tiempos de resolución</td></tr>
<tr><td>Avanzados</td><td>/reportes/avanzados</td><td>Datos detallados de inquilinos, contratos, pagos</td></tr>
<tr><td>Analítica</td><td>/dashboard/analytics</td><td>KPIs agregados con selector de periodo</td></tr>
</table>

<h2>19.3 Exportación</h2>
<p>Los informes pueden exportarse en formato CSV y PDF para reporting externo.</p>

<!-- CAPÍTULO 20 -->
<h1 id="cap20">20. Administración y Configuración</h1>

<h2>20.1 Configuración de Empresa</h2>
<p>URL: <code>/configuracion/empresas</code> <span class="badge badge-admin">Solo Admin</span></p>
<ul>
  <li>Datos fiscales: CIF, dirección, teléfono, email</li>
  <li>Logo de la empresa</li>
  <li>Contacto principal</li>
</ul>

<h2>20.2 Gestión de Usuarios</h2>
<p>URL: <code>/admin/usuarios</code> <span class="badge badge-admin">Solo Admin</span></p>
<ul>
  <li>Crear, editar y desactivar usuarios</li>
  <li>Asignar roles (administrador, gestor, operador)</li>
  <li>Asignar a sociedad del grupo</li>
</ul>

<div class="warning"><strong>Seguridad:</strong> Al crear un usuario se requiere una contraseña de mínimo 8 caracteres. No se permiten contraseñas por defecto.</div>

<h2>20.3 Campos Personalizados</h2>
<p>URL: <code>/admin/campos-personalizados</code> <span class="badge badge-admin">Solo Admin</span></p>
<p>Añadir campos personalizados a: inmuebles, inquilinos, contratos, incidencias y propietarios. Tipos: texto, número, fecha, selección, checkbox.</p>

<h2>20.4 Notificaciones</h2>
<p>URL: <code>/configuracion/notificaciones</code></p>
<p>Configurar qué notificaciones recibir y por qué canal (email, in-app).</p>

<h2>20.5 Modo de Interfaz</h2>
<p>URL: <code>/configuracion/ui-mode</code></p>
<p>Tres modos: <strong>Simple</strong> (funciones básicas), <strong>Estándar</strong> (recomendado) y <strong>Avanzado</strong> (todas las funciones).</p>

<h2>20.6 Monitorización del Sistema</h2>
<p>URL: <code>/admin/monitoring</code> <span class="badge badge-admin">Solo Admin</span></p>
<p>Panel técnico: estado del servidor, memoria, conexión BD, integraciones activas, cuentas bloqueadas.</p>

<!-- CAPÍTULO 21 -->
<h1 id="cap21">21. Portales Externos</h1>

<h2>21.1 Portal del Inquilino</h2>
<p>Los inquilinos acceden a <code>/portal-inquilino</code> con sus propias credenciales para:</p>
<ul>
  <li>Ver su contrato activo</li>
  <li>Consultar y pagar recibos</li>
  <li>Reportar incidencias con fotos</li>
  <li>Descargar documentos</li>
  <li>Comunicarse con el gestor</li>
  <li>Solicitar renovación de contrato</li>
</ul>

<h2>21.2 Portal del Propietario</h2>
<p>Acceso en <code>/portal-propietario</code>:</p>
<ul>
  <li>Dashboard de propiedades</li>
  <li>Estado de contratos y pagos</li>
  <li>Liquidaciones mensuales</li>
  <li>Incidencias reportadas</li>
  <li>Informe mensual descargable</li>
</ul>

<h2>21.3 Portal del Proveedor</h2>
<p>Acceso en <code>/portal-proveedor</code>:</p>
<ul>
  <li>Órdenes de trabajo asignadas</li>
  <li>Envío de presupuestos</li>
  <li>Facturación de servicios</li>
  <li>Chat con el gestor</li>
</ul>

<!-- CAPÍTULO 22 -->
<h1 id="cap22">22. Comunidades de Propietarios</h1>

<h2>22.1 Acceso</h2>
<p>Menú lateral: <strong>Comunidades</strong> o URL <code>/comunidades</code></p>

<h2>22.2 Módulos Disponibles</h2>
<table>
<tr><th>Módulo</th><th>Función</th></tr>
<tr><td>Mis Comunidades</td><td>Listado de comunidades gestionadas</td></tr>
<tr><td>Libro de Actas</td><td>Actas digitales de reuniones</td></tr>
<tr><td>Cuotas</td><td>Gestión de cuotas comunitarias</td></tr>
<tr><td>Fondos y Derramas</td><td>Control de fondos de reserva y derramas extraordinarias</td></tr>
<tr><td>Votaciones</td><td>Votación telemática para acuerdos</td></tr>
<tr><td>Finanzas</td><td>Cash flow, fianzas, impagos comunitarios</td></tr>
<tr><td>Cumplimiento</td><td>CEE, ITE, cédulas, modelos fiscales</td></tr>
<tr><td>Renovaciones</td><td>Actualización de cuotas con IPC</td></tr>
<tr><td>Reuniones</td><td>Convocatorias y actas de juntas</td></tr>
<tr><td>Incidencias</td><td>Partes comunitarios</td></tr>
</table>

<!-- CAPÍTULO 23 -->
<h1 id="cap23">23. Preguntas Frecuentes</h1>

<h3>¿Cómo cambio entre sociedades del grupo?</h3>
<p>Haga clic en el nombre de la sociedad actual en la cabecera superior y seleccione la sociedad deseada.</p>

<h3>¿Qué ocurre cuando vence un contrato?</h3>
<p>La unidad se libera automáticamente (estado "Disponible") y el inquilino queda desvinculado. Se genera una alerta en el Dashboard.</p>

<h3>¿Puedo asignar un inquilino a varias unidades?</h3>
<p>Sí. Un inquilino puede tener contratos activos en múltiples unidades (ej: vivienda + garaje).</p>

<h3>¿Cómo consulto la cobertura del seguro de un piso?</h3>
<p>En la ficha de la unidad aparece la tarjeta de cobertura de seguro. Si el edificio tiene póliza, se propaga automáticamente a todas sus unidades.</p>

<h3>¿Cómo exporto datos a Excel?</h3>
<p>En los listados principales (inquilinos, contratos, pagos) hay un botón de exportación que genera un archivo CSV compatible con Excel.</p>

<h3>¿Quién puede ver los datos financieros?</h3>
<p>Solo los usuarios con rol <strong>Administrador</strong>. Los roles Gestor y Operador no tienen acceso a finanzas avanzadas.</p>

<h3>¿Los datos están seguros?</h3>
<p>Sí. La plataforma utiliza: cifrado HTTPS, autenticación con tokens seguros, bloqueo automático tras 5 intentos fallidos, protección contra ataques (CSRF, XSS, SQL injection), y backups diarios de la base de datos.</p>

<h3>¿Cómo contacto con soporte?</h3>
<p>Desde <code>/dashboard/ayuda</code> o el chat de soporte integrado en la esquina inferior derecha.</p>

<hr class="separator">

<div class="footer">
  <p><strong>INMOVA APP</strong> — Manual de Usuario para Grupo Vidaro Inversiones</p>
  <p>Versión 3.0 — Abril 2026 — Documento confidencial</p>
  <p>Soporte: soporte@inmovaapp.com | https://inmovaapp.com</p>
</div>

</body>
</html>`;

const outputPath = resolve(process.cwd(), 'MANUAL_USUARIO_GRUPO_VIDARO.pdf');

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
    margin: { top: '25mm', bottom: '25mm', left: '20mm', right: '20mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#999;margin-top:5mm;">INMOVA APP — Manual de Usuario — Grupo Vidaro Inversiones</div>',
    footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#999;margin-bottom:5mm;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>',
  });
  
  await browser.close();
  console.log('PDF generado en:', outputPath);
}

main().catch(e => { console.error(e); process.exit(1); });
