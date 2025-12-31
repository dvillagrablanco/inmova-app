import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function WarehouseLocationsPage() {
  return (
    <ComingSoonPage
      title="Ubicaciones"
      description="Gestión de ubicaciones de almacén"
      expectedFeatures={[
        "Mapa de almacenes",
        "Zonificación y pasillos",
        "Optimización de picking",
        "Capacidad y ocupación",
        "Asignación inteligente"
      ]}
    />
  );
}
