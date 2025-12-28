-- Agregar índices adicionales para optimizar queries de reportes

-- Payment: índice compuesto para queries de ingresos filtrados por fecha y estado
CREATE INDEX IF NOT EXISTS "payments_estado_fechaVencimiento_monto_idx" 
  ON "payments" ("estado", "fechaVencimiento", "monto");

-- Unit: índice para contar unidades ocupadas por edificio
CREATE INDEX IF NOT EXISTS "units_buildingId_estado_idx" 
  ON "units" ("buildingId", "estado");

-- Contract: índice compuesto para unir con pagos en queries de reportes
CREATE INDEX IF NOT EXISTS "contracts_unitId_fechaInicio_fechaFin_idx" 
  ON "contracts" ("unitId", "fechaInicio", "fechaFin");

-- Expense: índice compuesto para queries de gastos por edificio y fecha
CREATE INDEX IF NOT EXISTS "expenses_buildingId_fecha_monto_idx" 
  ON "expenses" ("buildingId", "fecha", "monto");

-- Building: índice para joins rápidos con company
CREATE INDEX IF NOT EXISTS "buildings_companyId_nombre_idx" 
  ON "buildings" ("companyId", "nombre");

-- Comment: Estos índices están optimizados para el endpoint /api/reports
-- que ahora usa agregaciones SQL nativas en lugar de cargar todas las relaciones
