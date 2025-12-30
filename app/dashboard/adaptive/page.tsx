import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function DashboardAdaptivePage() {
  return (
    <ComingSoonPage
      title="Dashboard Adaptativo"
      description="Dashboard inteligente que se adapta a tus necesidades y uso"
      expectedFeatures={[
        'Widgets personalizables con drag & drop',
        'Dashboard que aprende de tus hábitos',
        'Recomendaciones inteligentes basadas en IA',
        'Vistas predefinidas por rol de usuario',
        'Accesos rápidos a funciones más usadas',
      ]}
    />
  );
}
