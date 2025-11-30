'use client';

import { useState } from 'react';
import { Command, Plus, Building2, Users, FileText, CreditCard, Wrench, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface QuickAction {
  icon: any;
  label: string;
  route: string;
  permission?: 'canCreate' | 'canUpdate';
  gradient: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: Building2,
    label: 'Nuevo Edificio',
    route: '/edificios/nuevo',
    permission: 'canCreate',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Users,
    label: 'Nuevo Inquilino',
    route: '/inquilinos/nuevo',
    permission: 'canCreate',
    gradient: 'from-violet-500 to-purple-500'
  },
  {
    icon: FileText,
    label: 'Nuevo Contrato',
    route: '/contratos/nuevo',
    permission: 'canCreate',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    icon: CreditCard,
    label: 'Nuevo Pago',
    route: '/pagos/nuevo',
    permission: 'canCreate',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: Wrench,
    label: 'Nueva Solicitud',
    route: '/mantenimiento/nuevo',
    permission: 'canCreate',
    gradient: 'from-yellow-500 to-amber-500'
  }
];

export function QuickAccessMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { canCreate } = usePermissions();

  const filteredActions = QUICK_ACTIONS.filter(action => {
    if (!action.permission) return true;
    return canCreate;
  });

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl gradient-primary z-50 hover:scale-110 transition-transform"
        title="Acciones rápidas"
      >
        <Plus className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Menu */}
      <Card className="fixed bottom-24 right-6 w-80 shadow-2xl border-2 border-indigo-200 z-50 animate-in slide-in-from-bottom-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
                <Command className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Acciones Rápidas</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {filteredActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} href={action.route} onClick={() => setIsOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col gap-2 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${action.gradient}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{action.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Usa <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+K</kbd> para abrir este menú
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}