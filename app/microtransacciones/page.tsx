import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function MicrotransaccionesPage() {
  return (
    <ComingSoonPage
      title="Microtransacciones"
      description="Sistema de pagos pequeños y servicios adicionales"
      expectedFeatures={[
        'Pagos de servicios adicionales',
        'Wallet digital de inquilino',
        'Recarga de saldo',
        'Historial de microtransacciones',
        'Cashback y promociones',
      ]}
    />
  );
}
