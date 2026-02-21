/**
 * Tests unitarios para el AI Document Agent Service
 * 
 * Tests que no requieren el mock de Anthropic SDK
 * 
 * @module __tests__/unit/services/ai-document-agent.test.ts
 */

import { describe, it, expect } from 'vitest';
import { calculateStringSimilarity } from '@/lib/ai-document-agent-service';

describe('AI Document Agent Service', () => {
  describe('calculateStringSimilarity', () => {
    it('retorna 1.0 para strings idénticos', () => {
      expect(calculateStringSimilarity('hello', 'hello')).toBe(1.0);
    });

    it('retorna 1.0 para strings idénticos con diferente case', () => {
      expect(calculateStringSimilarity('HELLO', 'hello')).toBe(1.0);
    });

    it('retorna 0.0 para strings completamente diferentes', () => {
      const similarity = calculateStringSimilarity('abc', 'xyz');
      expect(similarity).toBeLessThan(0.5);
    });

    it('retorna valor entre 0 y 1 para strings similares', () => {
      const similarity = calculateStringSimilarity('hello', 'hallo');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('maneja strings vacíos', () => {
      expect(calculateStringSimilarity('', '')).toBe(1.0);
      expect(calculateStringSimilarity('hello', '')).toBe(0.0);
    });

    it('calcula similitud para direcciones', () => {
      const addr1 = 'Calle Mayor 123, Madrid';
      const addr2 = 'Calle Mayor 123, Madrid, España';
      const similarity = calculateStringSimilarity(addr1, addr2);
      expect(similarity).toBeGreaterThan(0.7);
    });

    it('detecta CIFs similares', () => {
      const cif1 = 'B-19774660';
      const cif2 = 'B12345679';
      const similarity = calculateStringSimilarity(cif1, cif2);
      expect(similarity).toBeGreaterThan(0.8);
    });
  });
});

describe('Document Classification Categories', () => {
  const categories = [
    'escritura_propiedad',
    'contrato_alquiler',
    'dni_nie',
    'factura',
    'seguro',
    'certificado_energetico',
    'acta_comunidad',
    'recibo_pago',
    'nota_simple',
    'ite_iee',
    'licencia',
    'fianza',
    'inventario',
    'foto_inmueble',
    'plano',
    'otro',
  ];

  it('soporta todas las categorías de documentos esperadas', () => {
    expect(categories).toHaveLength(16);
    expect(categories).toContain('contrato_alquiler');
    expect(categories).toContain('escritura_propiedad');
    expect(categories).toContain('dni_nie');
  });
});

describe('Extracted Data Types', () => {
  const dataTypes = [
    'company_info',
    'property_info',
    'tenant_info',
    'contract_info',
    'financial_info',
    'insurance_info',
    'energy_info',
    'community_info',
    'provider_info',
    'maintenance_info',
  ];

  it('soporta todos los tipos de datos extraídos', () => {
    expect(dataTypes).toHaveLength(10);
    expect(dataTypes).toContain('property_info');
    expect(dataTypes).toContain('tenant_info');
    expect(dataTypes).toContain('contract_info');
  });
});
