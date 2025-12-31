import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function WarehouseMovementsPage() {
  return (
    <ComingSoonPage
      title="Movimientos"
      description="Registro de movimientos de inventario"
      expectedFeatures={[
        "Entradas y salidas",
        "Transferencias entre almacenes",
        "Ajustes de inventario",
        "Historial completo",
        "Trazabilidad de lotes"
      ]}
    />
  );
}
