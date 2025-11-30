/**
 * Database Optimization Script
 * Adds performance indexes and analyzes database
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function optimizeDatabase() {
  console.log('Starting database optimization...');
  
  try {
    // The indexes are defined in schema.prisma
    // This script can be extended to:
    // 1. Analyze query performance
    // 2. Add additional indexes
    // 3. Update statistics
    // 4. Vacuum (for PostgreSQL)
    
    console.log('Running ANALYZE to update query planner statistics...');
    // Note: This is PostgreSQL specific
    await prisma.$executeRawUnsafe('ANALYZE');
    
    console.log('Database optimization completed successfully!');
    console.log('\nRecommended indexes have been created in schema.prisma:');
    console.log('- User: email, companyId');
    console.log('- Building: companyId');
    console.log('- Unit: buildingId, estado');
    console.log('- Tenant: companyId, email');
    console.log('- Contract: tenantId, unitId, estado');
    console.log('- Payment: contractId, estado, fechaVencimiento');
    console.log('- MaintenanceRequest: buildingId, estado, prioridad');
    console.log('- AuditLog: userId, companyId, createdAt');
    
  } catch (error) {
    console.error('Error optimizing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeDatabase();
