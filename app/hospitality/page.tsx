import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function HospitalityPage() {
  return (
    <ComingSoonPage
      title="Hospitality & Hotel Management"
      description="Gestión hotelera y servicios de hospitalidad"
      expectedFeatures={[
        'PMS (Property Management System)',
        'Channel manager para OTAs',
        'Revenue management',
        'Gestión de housekeeping',
        'Guest experience management',
      ]}
    />
  );
}
