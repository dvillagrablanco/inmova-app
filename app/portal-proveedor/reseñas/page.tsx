import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PortalProveedorReseñasPage() {
  return (
    <ComingSoonPage
      title="Reseñas de Proveedores"
      description="Sistema de valoraciones y reseñas de proveedores de servicios"
      expectedFeatures={[
        'Valoraciones de clientes',
        'Sistema de estrellas y comentarios',
        'Respuestas a reseñas',
        'Estadísticas de satisfacción',
        'Certificaciones de calidad',
        'Rankings de proveedores',
      ]}
    />
  );
}
