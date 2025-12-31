import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function GuardiasPage() {
  return (
    <ComingSoonPage
      title="Gestión de Guardias"
      description="Coordinación de turnos y guardias de seguridad"
      expectedFeatures={[
        'Calendario de turnos',
        'Gestión de personal de seguridad',
        'Informes de incidencias',
        'Control de accesos',
        'Comunicación con guardias',
      ]}
    />
  );
}
