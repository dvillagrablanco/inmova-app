import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function WarehouseInventoryPage() {
  return (
    <ComingSoonPage
      title="Inventario"
      description="Gestión de inventario de materiales y suministros"
      expectedFeatures={[
        "Catálogo de productos",
        "Stock en tiempo real",
        "Alertas de reposición",
        "Valoración de inventario",
        "Rotación de productos"
      ]}
    />
  );
}
