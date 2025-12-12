import 'server-only';
import { prisma } from './db';
import type { BrandingConfig } from '@prisma/client';
import logger from '@/lib/logger';
import { BrandingConfigData, getDefaultBranding } from './branding-utils';

/**
 * Servicio de gestión de personalización White Label (solo servidor)
 * Permite a cada empresa/cliente configurar su propia identidad visual
 */

/**
 * Obtiene la configuración de branding para una empresa
 * Si no existe, retorna valores por defecto
 */
export async function getBrandingConfig(companyId: string): Promise<BrandingConfig | null> {
  try {
    const config = await prisma.brandingConfig.findUnique({
      where: { companyId }
    });
    
    if (!config) {
      return getDefaultBranding(companyId);
    }
    
    return config;
  } catch (error) {
    logger.error('[Branding Service] Error getting config:', error);
    return getDefaultBranding(companyId);
  }
}

/**
 * Actualiza o crea la configuración de branding para una empresa
 */
export async function updateBrandingConfig(
  companyId: string,
  data: BrandingConfigData
): Promise<BrandingConfig> {
  try {
    const config = await prisma.brandingConfig.upsert({
      where: { companyId },
      create: {
        companyId,
        ...data
      },
      update: data
    });
    
    return config;
  } catch (error) {
    logger.error('[Branding Service] Error updating config:', error);
    throw new Error('Error al actualizar la configuración de personalización');
  }
}

/**
 * Elimina la configuración de branding de una empresa
 */
export async function deleteBrandingConfig(companyId: string): Promise<void> {
  try {
    await prisma.brandingConfig.delete({
      where: { companyId }
    });
  } catch (error) {
    logger.error('[Branding Service] Error deleting config:', error);
    throw new Error('Error al eliminar la configuración de personalización');
  }
}

/**
 * Clona la configuración de branding de una empresa a otra
 */
export async function cloneBrandingConfig(
  sourceCompanyId: string,
  targetCompanyId: string
): Promise<BrandingConfig> {
  try {
    const sourceConfig = await getBrandingConfig(sourceCompanyId);
    
    if (!sourceConfig) {
      throw new Error('No se encontró configuración de origen');
    }
    
    // Crear nueva configuración sin el ID y convertir null a undefined
    const { id, companyId, createdAt, updatedAt, ...rest } = sourceConfig;
    
    // Convertir todos los null a undefined para compatibilidad con BrandingConfigData
    const configData: BrandingConfigData = Object.fromEntries(
      Object.entries(rest).map(([key, value]) => [key, value === null ? undefined : value])
    ) as BrandingConfigData;
    
    return await updateBrandingConfig(targetCompanyId, configData);
  } catch (error) {
    logger.error('[Branding Service] Error cloning config:', error);
    throw new Error('Error al clonar la configuración de personalización');
  }
}
