/**
 * Layout para página de detalle de unidad con SEO optimizado
 */

import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { generatePropertyMetaTags } from '@/lib/seo-utils';
import {
  generatePropertySchema,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
} from '@/lib/structured-data';
import { StructuredDataScript } from '@/components/seo/StructuredDataScript';

interface Props {
  params: { id: string };
  children: React.ReactNode;
}

/**
 * Genera meta-tags dinámicos para la propiedad
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;

  try {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        building: true,
        tenant: true,
      },
    });

    if (!unit) {
      return {
        title: 'Unidad no encontrada | INMOVA',
        description: 'La unidad solicitada no se encuentra disponible.',
      };
    }

    // Construir datos para SEO
    const propertyData = {
      id: unit.id,
      titulo: `${unit.building?.nombre || 'Edificio'} - Unidad ${unit.numero}`,
      descripcion: `${unit.tipo} de ${unit.superficie}m² con ${unit.habitaciones} habitaciones y ${unit.banos} baños`,
      precio: unit.rentaMensual || undefined,
      tipo: unit.tipo || undefined,
      superficie: unit.superficie || undefined,
      habitaciones: unit.habitaciones || undefined,
      banos: unit.banos || undefined,
      direccion: unit.building?.direccion || undefined,
      estado: unit.estado || undefined,
      imagenes: unit.imagenes || [],
      buildingNombre: unit.building?.nombre || undefined,
    };

    // Generar meta-tags
    return generatePropertyMetaTags(propertyData, process.env.NEXT_PUBLIC_BASE_URL);
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'INMOVA - Gestión Inmobiliaria',
      description: 'Plataforma de gestión inmobiliaria profesional',
    };
  }
}

export default async function UnidadDetailLayout({ params, children }: Props) {
  const { id } = params;

  try {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        building: true,
      },
    });

    if (!unit) {
      return <>{children}</>;
    }

    // Datos estructurados para SEO
    const propertyData = {
      id: unit.id,
      titulo: `${unit.building?.nombre || 'Edificio'} - Unidad ${unit.numero}`,
      descripcion: `${unit.tipo} de ${unit.superficie}m² con ${unit.habitaciones} habitaciones y ${unit.banos} baños`,
      precio: unit.rentaMensual || undefined,
      tipo: unit.tipo || undefined,
      superficie: unit.superficie || undefined,
      habitaciones: unit.habitaciones || undefined,
      banos: unit.banos || undefined,
      direccion: unit.building?.direccion || undefined,
      estado: unit.estado || undefined,
      imagenes: unit.imagenes || [],
    };

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://inmova.app';

    // Generar JSON-LD schemas
    const propertySchema = generatePropertySchema(propertyData, baseUrl);
    const organizationSchema = generateOrganizationSchema(baseUrl);
    const breadcrumbSchema = generateBreadcrumbSchema(
      [
        { name: 'Inicio', url: '/' },
        { name: 'Unidades', url: '/unidades' },
        { name: `Unidad ${unit.numero}`, url: `/unidades/${unit.id}` },
      ],
      baseUrl
    );

    return (
      <>
        <StructuredDataScript data={[propertySchema, organizationSchema, breadcrumbSchema] as unknown as Record<string, unknown>[]} />
        {children}
      </>
    );
  } catch (error) {
    console.error('Error in layout:', error);
    return <>{children}</>;
  }
}
