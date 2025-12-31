import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function UnidadesNuevaPage() {
  return (
    <ComingSoonPage
      title="Nueva Unidad"
      description="Crear nueva unidad residencial o comercial"
      expectedFeatures={[
        "Formulario de alta de unidad",
        "Vinculación con edificio",
        "Características técnicas",
        "Documentación y catastro",
        "Configuración de servicios"
      ]}
    />
  );
}
