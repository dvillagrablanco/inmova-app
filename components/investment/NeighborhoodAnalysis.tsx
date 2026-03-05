'use client';

import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

interface NeighborhoodProps {
  location: string;
  category: string;
}

// Static neighborhood data for major Spanish cities
const NEIGHBORHOOD_DATA: Record<string, { transport: string; schools: string; commerce: string; healthcare: string; safety: string; trend: string; avgAge: string }> = {
  'Madrid': { transport: 'Metro, Cercanías, Bus (excelente)', schools: '450+ centros educativos', commerce: 'Gran Vía, comercio de proximidad', healthcare: '20+ hospitales públicos', safety: 'Media-alta', trend: '📈 +8.2% anual', avgAge: '42 años' },
  'Barcelona': { transport: 'Metro, Tram, Bus (excelente)', schools: '350+ centros', commerce: 'Passeig de Gràcia, mercados', healthcare: '15+ hospitales', safety: 'Media', trend: '📈 +6.5% anual', avgAge: '41 años' },
  'Málaga': { transport: 'Metro, Bus, tren costa', schools: '200+ centros', commerce: 'Calle Larios, centros comerciales', healthcare: '5+ hospitales', safety: 'Media-alta', trend: '📈 +12.1% anual', avgAge: '39 años' },
  'Valencia': { transport: 'Metro, Tram, Bus', schools: '280+ centros', commerce: 'Mercado Central, Colón', healthcare: '10+ hospitales', safety: 'Media', trend: '📈 +15.3% anual', avgAge: '40 años' },
  'Sevilla': { transport: 'Metro, Tram, Bus', schools: '220+ centros', commerce: 'Calle Sierpes, Nervión', healthcare: '8+ hospitales', safety: 'Media', trend: '📈 +7.8% anual', avgAge: '38 años' },
  'Valladolid': { transport: 'Bus urbano, tren', schools: '100+ centros', commerce: 'Calle Santiago, CC Vallsur', healthcare: '3+ hospitales', safety: 'Alta', trend: '📈 +4.2% anual', avgAge: '44 años' },
  'Alicante': { transport: 'Tram, Bus', schools: '150+ centros', commerce: 'Explanada, centros comerciales', healthcare: '4+ hospitales', safety: 'Media', trend: '📈 +9.5% anual', avgAge: '41 años' },
  'Girona': { transport: 'Bus, tren, AVE a BCN', schools: '50+ centros', commerce: 'Centro histórico', healthcare: '2+ hospitales', safety: 'Alta', trend: '📈 +5.8% anual', avgAge: '42 años' },
};

export function NeighborhoodAnalysis({ location, category }: NeighborhoodProps) {
  const cityKey = Object.keys(NEIGHBORHOOD_DATA).find(k => location.toLowerCase().includes(k.toLowerCase()));
  const data = cityKey ? NEIGHBORHOOD_DATA[cityKey] : null;

  if (!data) {
    return <p className="text-[10px] text-muted-foreground">Datos de vecindario no disponibles para {location}</p>;
  }

  const items = [
    { icon: '🚇', label: 'Transporte', value: data.transport },
    { icon: '🏫', label: 'Educación', value: data.schools },
    { icon: '🛒', label: 'Comercio', value: data.commerce },
    { icon: '🏥', label: 'Sanidad', value: data.healthcare },
    { icon: '🛡️', label: 'Seguridad', value: data.safety },
    { icon: '📊', label: 'Tendencia precio', value: data.trend },
    { icon: '👤', label: 'Edad media', value: data.avgAge },
  ];

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-[10px] font-medium mb-1">
        <MapPin className="h-3 w-3" /> Análisis de {cityKey}
      </div>
      {items.map(item => (
        <div key={item.label} className="flex items-start gap-1.5 text-[10px]">
          <span className="w-4 shrink-0">{item.icon}</span>
          <span className="text-muted-foreground w-16 shrink-0">{item.label}:</span>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
}
