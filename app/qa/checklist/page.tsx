'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Check, X, AlertCircle, Download, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  label: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface ChecklistCategory {
  id: string;
  title: string;
  description: string;
  items: ChecklistItem[];
}

const QA_CHECKLIST: ChecklistCategory[] = [
  {
    id: 'functionality',
    title: '🔧 Funcionalidad',
    description: 'Verificar que todas las features funcionan correctamente',
    items: [
      { id: 'f1', label: 'Todos los tests E2E pasan', priority: 'critical' },
      { id: 'f2', label: 'Todos los tests unitarios pasan (>80% coverage)', priority: 'critical' },
      { id: 'f3', label: 'No hay errores en consola del browser', priority: 'high' },
      { id: 'f4', label: 'Todos los wizards completan correctamente', priority: 'high' },
      { id: 'f5', label: 'Persistencia de wizards funciona (localStorage)', priority: 'high' },
      { id: 'f6', label: 'Cambio de modo UI funciona', priority: 'high' },
      { id: 'f7', label: 'Onboarding completo funciona', priority: 'critical' },
      { id: 'f8', label: 'Mobile navigation funciona', priority: 'high' },
      { id: 'f9', label: 'Gestures (swipe, pull-to-refresh) funcionan', priority: 'medium' },
      { id: 'f10', label: 'APIs devuelven respuestas correctas', priority: 'critical' },
    ],
  },
  {
    id: 'performance',
    title: '⚡ Performance',
    description: 'Optimización y velocidad de carga',
    items: [
      { id: 'p1', label: 'Lighthouse Score > 90 en Performance', priority: 'high' },
      { id: 'p2', label: 'LCP < 2.5s', priority: 'high' },
      { id: 'p3', label: 'FID < 100ms', priority: 'high' },
      { id: 'p4', label: 'CLS < 0.1', priority: 'high' },
      { id: 'p5', label: 'Bundle size optimizado', priority: 'medium' },
      { id: 'p6', label: 'Imágenes optimizadas (WebP/AVIF)', priority: 'medium' },
      { id: 'p7', label: 'Lazy loading implementado', priority: 'medium' },
      { id: 'p8', label: 'No hay memory leaks', priority: 'high' },
    ],
  },
  {
    id: 'accessibility',
    title: '♿ Accesibilidad',
    description: 'WCAG 2.1 Level AA compliance',
    items: [
      { id: 'a1', label: 'axe DevTools sin errores críticos', priority: 'critical' },
      { id: 'a2', label: 'Navegación por teclado funciona', priority: 'critical' },
      { id: 'a3', label: 'Screen reader compatible', priority: 'high' },
      { id: 'a4', label: 'Contraste de colores correcto (4.5:1)', priority: 'high' },
      { id: 'a5', label: 'Labels en todos los inputs', priority: 'high' },
      { id: 'a6', label: 'Focus indicators visibles', priority: 'high' },
      { id: 'a7', label: 'Alt text en todas las imágenes', priority: 'medium' },
      { id: 'a8', label: 'Touch targets >= 44px', priority: 'medium' },
    ],
  },
  {
    id: 'seo',
    title: '🔍 SEO',
    description: 'Optimización para motores de búsqueda',
    items: [
      { id: 's1', label: 'Meta tags presentes', priority: 'high' },
      { id: 's2', label: 'Sitemap.xml generado', priority: 'medium' },
      { id: 's3', label: 'robots.txt configurado', priority: 'medium' },
      { id: 's4', label: 'Open Graph tags', priority: 'medium' },
      { id: 's5', label: 'Schema.org markup', priority: 'low' },
      { id: 's6', label: 'URLs semánticas', priority: 'low' },
    ],
  },
  {
    id: 'security',
    title: '🔒 Seguridad',
    description: 'Protección de datos y vulnerabilidades',
    items: [
      { id: 'sec1', label: 'Variables de entorno en .env', priority: 'critical' },
      { id: 'sec2', label: 'No hay API keys en código cliente', priority: 'critical' },
      { id: 'sec3', label: 'HTTPS en producción', priority: 'critical' },
      { id: 'sec4', label: 'CSP headers configurados', priority: 'high' },
      { id: 'sec5', label: 'CORS configurado correctamente', priority: 'high' },
      { id: 'sec6', label: 'SQL injection protection', priority: 'critical' },
      { id: 'sec7', label: 'XSS protection', priority: 'critical' },
    ],
  },
  {
    id: 'cross-browser',
    title: '🌐 Cross-Browser',
    description: 'Compatibilidad con diferentes navegadores',
    items: [
      { id: 'b1', label: 'Chrome (latest)', priority: 'critical' },
      { id: 'b2', label: 'Firefox (latest)', priority: 'high' },
      { id: 'b3', label: 'Safari (latest)', priority: 'high' },
      { id: 'b4', label: 'Edge (latest)', priority: 'high' },
      { id: 'b5', label: 'Mobile Chrome', priority: 'critical' },
      { id: 'b6', label: 'Mobile Safari', priority: 'critical' },
    ],
  },
  {
    id: 'responsive',
    title: '📱 Responsive Design',
    description: 'Adaptación a diferentes tamaños de pantalla',
    items: [
      { id: 'r1', label: 'Mobile (320px - 768px)', priority: 'critical' },
      { id: 'r2', label: 'Tablet (768px - 1024px)', priority: 'high' },
      { id: 'r3', label: 'Desktop (1024px+)', priority: 'high' },
      { id: 'r4', label: '4K (2560px+)', priority: 'medium' },
      { id: 'r5', label: 'Orientación landscape y portrait', priority: 'medium' },
    ],
  },
];

/**
 * QA CHECKLIST DASHBOARD
 *
 * Dashboard interactivo para tracking de QA
 */
export default function QAChecklistPage() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    const newSet = new Set(checkedItems);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setCheckedItems(newSet);
  };

  const totalItems = QA_CHECKLIST.reduce((sum, cat) => sum + cat.items.length, 0);
  const completedItems = checkedItems.size;
  const progress = (completedItems / totalItems) * 100;

  const criticalItems = QA_CHECKLIST.flatMap((cat) =>
    cat.items.filter((item) => item.priority === 'critical')
  );
  const completedCritical = criticalItems.filter((item) => checkedItems.has(item.id)).length;

  const exportChecklist = () => {
    const data = QA_CHECKLIST.map((cat) => ({
      category: cat.title,
      items: cat.items.map((item) => ({
        label: item.label,
        priority: item.priority,
        completed: checkedItems.has(item.id),
      })),
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-checklist-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">QA Checklist Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Verifica todos los aspectos de calidad antes del lanzamiento
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Progreso Global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(progress)}%</div>
            <Progress value={progress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedItems} de {totalItems} items completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Items Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {completedCritical}/{criticalItems.length}
            </div>
            <Progress value={(completedCritical / criticalItems.length) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {criticalItems.length - completedCritical} items críticos pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {progress === 100 ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <span className="text-lg font-bold text-green-600">Listo</span>
                </>
              ) : completedCritical === criticalItems.length ? (
                <>
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                  <span className="text-lg font-bold text-yellow-600">En Progreso</span>
                </>
              ) : (
                <>
                  <Circle className="h-8 w-8 text-gray-400" />
                  <span className="text-lg font-bold text-gray-600">Pendiente</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {progress === 100 ? 'Todos los checks completados' : 'Aún hay items pendientes'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end mb-6">
        <Button onClick={exportChecklist} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar Checklist
        </Button>
      </div>

      {/* Checklist Categories */}
      <div className="space-y-6">
        {QA_CHECKLIST.map((category) => {
          const categoryCompleted = category.items.filter((item) =>
            checkedItems.has(item.id)
          ).length;
          const categoryProgress = (categoryCompleted / category.items.length) * 100;

          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                  <div className="text-sm font-medium">
                    {categoryCompleted}/{category.items.length}
                  </div>
                </div>
                <Progress value={categoryProgress} className="mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.items.map((item) => {
                    const isChecked = checkedItems.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                          isChecked && 'bg-green-50 border-green-200',
                          !isChecked && 'hover:bg-accent'
                        )}
                      >
                        <Checkbox
                          id={item.id}
                          checked={isChecked}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                        <label htmlFor={item.id} className="flex-1 text-sm cursor-pointer">
                          {item.label}
                        </label>
                        <Badge
                          variant={item.priority === 'critical' ? 'destructive' : 'secondary'}
                          className={cn(
                            item.priority === 'high' && 'bg-orange-100 text-orange-700',
                            item.priority === 'medium' && 'bg-blue-100 text-blue-700',
                            item.priority === 'low' && 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {item.priority}
                        </Badge>
                        {isChecked && <Check className="h-5 w-5 text-green-600" />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Final Status Message */}
      {progress === 100 && (
        <Card className="mt-8 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  ¡Checklist completado al 100%!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Todos los items de QA han sido verificados. El sistema está listo para producción.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
