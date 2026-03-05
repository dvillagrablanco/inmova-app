-- Database Index Optimization for Inmova
-- Run: psql -U inmova_user -d inmova_production -f scripts/optimize-db-indexes.sql

-- Payments: most queried table (9644 rows)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_company_estado ON "Payment" ("companyId", "estado");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_fecha_vencimiento ON "Payment" ("fechaVencimiento" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_contract ON "Payment" ("contractId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_tenant ON "Payment" ("tenantId");

-- Contracts: frequently filtered by status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contract_company_estado ON "Contract" ("companyId", "estado");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contract_fecha_fin ON "Contract" ("fechaFin");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contract_unit ON "Contract" ("unitId");

-- Units: joined with buildings often
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unit_building ON "Unit" ("buildingId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unit_tenant ON "Unit" ("tenantId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unit_estado ON "Unit" ("estado");

-- Buildings: filtered by company
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_company ON "Building" ("companyId");

-- Tenants: searched by company
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_company ON "Tenant" ("companyId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_email ON "Tenant" ("email");

-- Insurance: filtered by building/unit
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insurance_building ON "Insurance" ("buildingId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insurance_unit ON "Insurance" ("unitId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insurance_company ON "Insurance" ("companyId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insurance_vencimiento ON "Insurance" ("fechaVencimiento");

-- Maintenance: filtered by status and building
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_building ON "MaintenanceRequest" ("buildingId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_status ON "MaintenanceRequest" ("status");

-- Audit log: queried by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_user ON "AuditLog" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_created ON "AuditLog" ("createdAt" DESC);

-- Accounting transactions: sync status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounting_synced ON "AccountingTransaction" ("syncedToZucchetti");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounting_company ON "AccountingTransaction" ("companyId");

ANALYZE;
