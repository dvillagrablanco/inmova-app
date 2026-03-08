'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight, Phone, Mail, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  nuevo: { label: 'Nuevo', color: 'bg-blue-100 border-blue-300' },
  contactado: { label: 'Contactado', color: 'bg-cyan-100 border-cyan-300' },
  visita: { label: 'Visita', color: 'bg-yellow-100 border-yellow-300' },
  negociacion: { label: 'Negociación', color: 'bg-orange-100 border-orange-300' },
  propuesta: { label: 'Propuesta', color: 'bg-purple-100 border-purple-300' },
  convertido: { label: 'Convertido', color: 'bg-green-100 border-green-300' },
  perdido: { label: 'Perdido', color: 'bg-gray-100 border-gray-300' },
};

export default function PipelinePage() {
  const [pipeline, setPipeline] = useState<Record<string, any[]>>({});
  const [stages, setStages] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    fetch('/api/portal-comercial/pipeline').then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setPipeline(d.pipeline); setStages(d.stages); setStats(d.stats); }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const moveLead = async (leadId: string, newStage: string) => {
    const res = await fetch('/api/portal-comercial/pipeline', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, newStage }),
    });
    if (res.ok) { toast.success('Lead movido'); loadData(); }
    else toast.error('Error');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Pipeline Comercial</h1>
        <p className="text-gray-500">{stats?.total || 0} leads · {stats?.conversionRate || 0}% conversión</p></div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.filter(s => s !== 'perdido').map(stage => {
          const cfg = STAGE_CONFIG[stage] || { label: stage, color: 'bg-gray-100' };
          const leads = pipeline[stage] || [];
          return (
            <div key={stage} className={`min-w-[250px] flex-shrink-0 rounded-xl border-2 ${cfg.color} p-3`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{cfg.label}</h3>
                <Badge variant="outline" className="text-xs">{leads.length}</Badge>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {leads.map((lead: any) => (
                  <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{lead.nombre}</p>
                      {lead.empresa && <p className="text-xs text-gray-500 flex items-center gap-1"><Building2 className="h-3 w-3" />{lead.empresa}</p>}
                      <div className="flex gap-2 mt-2">
                        {lead.email && <a href={`mailto:${lead.email}`} className="text-xs text-blue-600"><Mail className="h-3 w-3" /></a>}
                        {lead.telefono && <a href={`tel:${lead.telefono}`} className="text-xs text-green-600"><Phone className="h-3 w-3" /></a>}
                      </div>
                      {/* Quick move buttons */}
                      <div className="flex gap-1 mt-2">
                        {stages.filter(s => s !== stage && s !== 'perdido').slice(0, 2).map(s => (
                          <Button key={s} size="sm" variant="ghost" className="text-[10px] h-6 px-2" onClick={() => moveLead(lead.id, s)}>
                            → {STAGE_CONFIG[s]?.label || s}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {leads.length === 0 && <p className="text-center text-xs text-gray-400 py-4">Sin leads</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
