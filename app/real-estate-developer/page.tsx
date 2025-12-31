import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function RealEstateDeveloperPage() {
  return (
    <ComingSoonPage
      title="Promotor Inmobiliario"
      description="Dashboard principal para gestión de promociones inmobiliarias"
      expectedFeatures={[
        "Gestión de proyectos de construcción",
        "Control de preventas y reservas",
        "Planificación financiera de promociones",
        "Dashboard de comercialización",
        "Reportes de avance de obra"
      ]}
    />
  );
}
