'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Store, Star, Euro } from 'lucide-react';
import { toast } from 'sonner';

export default function PartnerMarketplacePage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/partners/marketplace').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.services) setServices(d.services);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Store className="h-8 w-8 text-indigo-600" /> Marketplace de Servicios</h1>
        <p className="text-gray-500">Servicios profesionales ofrecidos por partners verificados</p>
      </div>
      {loading ? <div className="text-center py-12 text-gray-400">Cargando...</div> :
       services.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-500">
          <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No hay servicios publicados todavía</p>
        </CardContent></Card>
       ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s: any) => (
            <Card key={s.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{s.nombre}</CardTitle>
                  <Badge variant="outline">{s.categoria}</Badge>
                </div>
                <p className="text-sm text-gray-500">{s.partnerName}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">{s.descripcion}</p>
                {s.precio && <p className="font-bold text-lg flex items-center gap-1"><Euro className="h-4 w-4" />{s.precio}€</p>}
                {s.precioDesde && <p className="text-sm text-gray-500">Desde {s.precioDesde}€</p>}
                <Button className="w-full mt-3" size="sm">Solicitar servicio</Button>
              </CardContent>
            </Card>
          ))}
        </div>
       )}
    </div>
  );
}
