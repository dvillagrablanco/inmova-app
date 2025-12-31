import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function RealEstateDeveloperProjectsPage() {
  return (
    <ComingSoonPage
      title="Proyectos de Promoción"
      description="Gestión de proyectos de desarrollo inmobiliario"
      expectedFeatures={[
        "Planning de promociones",
        "Control de licencias y permisos",
        "Gestión de contratas",
        "Presupuestos y desviaciones",
        "Entregas y recepción de obra"
      ]}
    />
  );
}
