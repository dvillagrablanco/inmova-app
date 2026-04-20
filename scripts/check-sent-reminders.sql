-- =============================================================
-- CONSULTA: Recordatorios de pago enviados ayer y hoy
-- Ejecutar en producción: psql -d inmova_production -f scripts/check-sent-reminders.sql
-- =============================================================

SELECT
  n."createdAt" AS fecha_envio,
  n.titulo,
  n.prioridad,
  c.nombre AS empresa,
  p.periodo,
  p.monto,
  p."fechaVencimiento" AS vencimiento,
  p.estado AS estado_pago,
  p."metodoPago" AS metodo_pago_payment,
  ct."metodoPago" AS metodo_pago_contrato,
  t."nombreCompleto" AS inquilino,
  t.email AS email_inquilino,
  t.telefono AS telefono_inquilino,
  b.nombre AS edificio,
  u.numero AS unidad
FROM notifications n
JOIN "Company" c ON c.id = n."companyId"
LEFT JOIN payments p ON p.id = n."entityId"
LEFT JOIN contracts ct ON ct.id = p."contractId"
LEFT JOIN "Tenant" t ON t.id = ct."tenantId"
LEFT JOIN units u ON u.id = ct."unitId"
LEFT JOIN buildings b ON b.id = u."buildingId"
WHERE n.tipo = 'pago_atrasado'
  AND n."createdAt" >= (CURRENT_DATE - INTERVAL '1 day')
ORDER BY n."createdAt" DESC;
