'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Circle, AlertTriangle, Building2, Home, FileText, MapPin, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { getPropertyInspectionChecklist, type InspectionItem } from '@/lib/investment-calculators';

interface CheckedItem {
  checked: boolean;
  notes: string;
  status: 'ok' | 'warning' | 'issue' | 'pending';
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Edificio': <Building2 className="h-4 w-4" />,
  'Interior': <Home className="h-4 w-4" />,
  'Documentación': <FileText className="h-4 w-4" />,
  'Entorno': <MapPin className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  ok: 'text-green-600',
  warning: 'text-yellow-600',
  issue: 'text-red-600',
  pending: 'text-gray-400',
};

export function PropertyInspectionChecklist({ propertyId, onExport }: { propertyId?: string; onExport?: (data: Record<string, CheckedItem>) => void }) {
  const items = getPropertyInspectionChecklist();
  const [checkedItems, setCheckedItems] = useState<Record<string, CheckedItem>>(() => {
    const initial: Record<string, CheckedItem> = {};
    items.forEach(item => {
      initial[item.id] = { checked: false, notes: '', status: 'pending' };
    });
    return initial;
  });
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const toggleCheck = useCallback((id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        checked: !prev[id].checked,
        status: !prev[id].checked ? 'ok' : 'pending',
      },
    }));
  }, []);

  const setStatus = useCallback((id: string, status: CheckedItem['status']) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: { ...prev[id], status, checked: status !== 'pending' },
    }));
  }, []);

  const setNotes = useCallback((id: string, notes: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: { ...prev[id], notes },
    }));
  }, []);

  const categories = [...new Set(items.map(i => i.category))];
  const checkedCount = Object.values(checkedItems).filter(i => i.checked).length;
  const criticalPending = items.filter(i => i.critical && !checkedItems[i.id].checked).length;
  const issues = Object.values(checkedItems).filter(i => i.status === 'issue').length;

  const exportChecklist = () => {
    const lines: string[] = [
      `CHECKLIST DE VISITA - ${new Date().toLocaleDateString('es-ES')}`,
      `Propiedad: ${propertyId || 'Sin asignar'}`,
      `Completado: ${checkedCount}/${items.length}`,
      `Problemas detectados: ${issues}`,
      '',
    ];

    categories.forEach(cat => {
      lines.push(`\n=== ${cat.toUpperCase()} ===`);
      items.filter(i => i.category === cat).forEach(item => {
        const ci = checkedItems[item.id];
        const mark = ci.status === 'ok' ? '✅' : ci.status === 'warning' ? '⚠️' : ci.status === 'issue' ? '❌' : '⬜';
        lines.push(`${mark} ${item.text}${item.critical ? ' [CRÍTICO]' : ''}`);
        if (ci.notes) lines.push(`   Notas: ${ci.notes}`);
      });
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checklist-visita-${propertyId || 'inmueble'}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onExport?.(checkedItems);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Checklist de Visita</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {checkedCount}/{items.length} completados
              {criticalPending > 0 && <span className="text-red-500 ml-2">{criticalPending} críticos pendientes</span>}
              {issues > 0 && <span className="text-red-500 ml-2">{issues} problemas</span>}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportChecklist}>
            <Download className="h-4 w-4 mr-1" /> Exportar
          </Button>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div
            className="bg-primary rounded-full h-2 transition-all"
            style={{ width: `${(checkedCount / items.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map(cat => {
          const catItems = items.filter(i => i.category === cat);
          const catChecked = catItems.filter(i => checkedItems[i.id].checked).length;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                {categoryIcons[cat]}
                <h4 className="font-medium text-sm">{cat}</h4>
                <Badge variant="outline" className="text-xs">{catChecked}/{catItems.length}</Badge>
              </div>
              <div className="space-y-1">
                {catItems.map(item => {
                  const ci = checkedItems[item.id];
                  const isExpanded = expandedItem === item.id;
                  return (
                    <div key={item.id} className="border rounded-lg">
                      <div
                        className="flex items-start gap-2 p-2 cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCheck(item.id); }}
                          className="mt-0.5 shrink-0"
                        >
                          {ci.checked
                            ? <CheckCircle2 className={`h-5 w-5 ${statusColors[ci.status]}`} />
                            : <Circle className="h-5 w-5 text-gray-300" />
                          }
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm ${ci.checked ? 'line-through text-muted-foreground' : ''}`}>
                            {item.text}
                          </span>
                          {item.critical && <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">Crítico</Badge>}
                          {ci.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{ci.notes}</p>}
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                      </div>
                      {isExpanded && (
                        <div className="px-2 pb-2 space-y-2">
                          {item.hint && (
                            <p className="text-xs bg-yellow-50 text-yellow-700 p-2 rounded flex items-start gap-1">
                              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> {item.hint}
                            </p>
                          )}
                          <div className="flex gap-1">
                            {(['ok', 'warning', 'issue'] as const).map(s => (
                              <Button
                                key={s}
                                variant={ci.status === s ? 'default' : 'outline'}
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setStatus(item.id, s)}
                              >
                                {s === 'ok' ? '✅ OK' : s === 'warning' ? '⚠️ Revisar' : '❌ Problema'}
                              </Button>
                            ))}
                          </div>
                          <Textarea
                            placeholder="Notas sobre este punto..."
                            value={ci.notes}
                            onChange={(e) => setNotes(item.id, e.target.value)}
                            className="text-sm h-16"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
