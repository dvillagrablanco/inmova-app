"use client";

import { useNavigationHistory } from '@/hooks/use-navigation-history';
import { Clock, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function NavigationHistory() {
  const { history, clearHistory } = useNavigationHistory();

  if (history.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Clock className="h-5 w-5" />
          {history.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {history.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Historial de Navegación</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="h-auto p-1 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {history.map((item, index) => (
            <DropdownMenuItem key={`${item.path}-${item.timestamp}`} asChild>
              <Link
                href={item.path}
                className="flex flex-col items-start py-2 cursor-pointer"
              >
                <span className="font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground">{item.path}</span>
                <span className="text-xs text-muted-foreground">
                  {getRelativeTime(item.timestamp)}
                </span>
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;
  return new Date(timestamp).toLocaleDateString('es-ES');
}
