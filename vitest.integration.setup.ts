import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL no está configurado. Define un .env.test o exporta la variable antes de ejecutar integración.'
  );
}

process.env.INTEGRATION_TESTS = 'true';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'integration-test-secret';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
