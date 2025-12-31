import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function StockGestionPage() {
  return (
    <ComingSoonPage
      title="Gestión de Stock"
      description="Control de inventario de propiedades disponibles"
      expectedFeatures={[
        "Dashboard de disponibilidad",
        "Reservas y bloqueos temporales",
        "Rotación de inventario",
        "Alertas de stock bajo",
        "Estadísticas de ocupación"
      ]}
    />
  );
}
