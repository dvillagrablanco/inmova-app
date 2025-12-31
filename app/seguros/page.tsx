import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function SegurosPage() {
  return (
    <ComingSoonPage
      title="Seguros"
      description="Gestión de seguros de propiedades e inquilinos"
      expectedFeatures={[
        'Catálogo de seguros',
        'Comparador de pólizas',
        'Gestión de siniestros',
        'Renovaciones automáticas',
        'Integración con aseguradoras',
      ]}
    />
  );
}
