/**
 * Layout para página de detalle de unidad
 * Simplificado para evitar errores de SSR con Prisma
 */

import { Metadata } from 'next';

interface Props {
  params: { id: string };
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: 'Detalle de Unidad | INMOVA',
  description: 'Información detallada de la unidad inmobiliaria',
};

export default function UnidadDetailLayout({ children }: Props) {
  return <>{children}</>;
}
