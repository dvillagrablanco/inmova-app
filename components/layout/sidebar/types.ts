/**
 * Tipos compartidos para el Sidebar
 */

import { LucideIcon } from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
  dataTour?: string;
}

export interface NavSection {
  id: string;
  title: string;
  icon?: string;
  items: NavItem[];
}

export interface SidebarProps {
  onNavigate?: () => void;
}

export interface ExpandedSections {
  [key: string]: boolean;
}
