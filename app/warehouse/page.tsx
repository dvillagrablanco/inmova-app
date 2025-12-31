import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function WarehousePage() {
  return (
    <ComingSoonPage
      title="Almacén"
      description="Gestión de almacenes y logística inmobiliaria"
      expectedFeatures={[
        "Control de inventario",
        "Gestión de ubicaciones",
        "Movimientos de stock",
        "Órdenes de trabajo",
        "Trazabilidad completa"
      ]}
    />
  );
}
