import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function InformesPage() {
  return (
    <ComingSoonPage
      title="Informes Personalizados"
      description="Generador de informes y reportes personalizados"
      expectedFeatures={[
        'Constructor de informes drag & drop',
        'Plantillas predefinidas',
        'Exportación a PDF y Excel',
        'Programación de informes automáticos',
        'Visualizaciones interactivas',
      ]}
    />
  );
}
