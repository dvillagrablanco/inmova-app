'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Building2, Sparkles, Menu, X, HardHat, ChevronDown,
  Users, Home, Briefcase, Hammer, Handshake,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { href: '#features', label: 'Características' },
    { href: '#accesos', label: 'Accesos' },
    { href: '#pricing', label: 'Precios' },
    { href: '#integraciones', label: 'Integraciones' },
    { href: '/ewoorker/landing', label: 'eWoorker', icon: HardHat, highlight: true },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 w-full bg-white backdrop-blur-md border-b border-gray-200 z-[9999] shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full animate-pulse" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              INMOVA
            </span>
            <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0 hidden sm:inline-flex">
              <Sparkles className="h-3 w-3 mr-1" />
              PropTech
            </Badge>
          </div>

          {/* Desktop Menu - Links */}
          <div className="hidden md:flex items-center gap-6">
            {menuItems.map((item) => (
              item.highlight ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 text-sm font-bold text-orange-800 hover:text-orange-900 transition-colors bg-orange-100 px-3 py-1.5 rounded-full border border-orange-300 hover:border-orange-400"
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm font-semibold text-gray-900 hover:text-indigo-700 transition-colors"
                >
                  {item.label}
                </a>
              )
            ))}
          </div>

          {/* Auth Buttons - SIEMPRE VISIBLES */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100 hover:border-gray-400 font-semibold text-xs sm:text-sm px-2 sm:px-4">
                    Iniciar Sesión
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4 text-emerald-600" />
                      <div><p className="font-medium">Gestor / Admin</p><p className="text-xs text-muted-foreground">Panel de gestión</p></div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/portal-inquilino/login" className="flex items-center gap-2 cursor-pointer">
                      <Home className="h-4 w-4 text-indigo-600" />
                      <div><p className="font-medium">Inquilino</p><p className="text-xs text-muted-foreground">Pagos e incidencias</p></div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/portal-propietario/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <Building2 className="h-4 w-4 text-amber-600" />
                      <div><p className="font-medium">Propietario</p><p className="text-xs text-muted-foreground">Rentabilidad y activos</p></div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/portal-proveedor/login" className="flex items-center gap-2 cursor-pointer">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                      <div><p className="font-medium">Proveedor</p><p className="text-xs text-muted-foreground">Órdenes y facturación</p></div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/partners/login" className="flex items-center gap-2 cursor-pointer">
                      <Handshake className="h-4 w-4 text-rose-600" />
                      <div><p className="font-medium">Partner</p><p className="text-xs text-muted-foreground">Comisiones y recursos</p></div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/ewoorker/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <Hammer className="h-4 w-4 text-orange-600" />
                      <div><p className="font-medium">Construcción</p><p className="text-xs text-muted-foreground">ewoorker B2B</p></div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/50 text-xs sm:text-sm px-3 sm:px-4">
                <span className="sm:hidden">Empezar</span>
                <span className="hidden sm:inline">Comenzar Gratis</span>
              </Button>
            </Link>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-indigo-600" />
                    <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                      INMOVA
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {menuItems.map((item) => (
                    item.highlight ? (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-lg font-bold text-orange-800 hover:text-orange-900 transition-colors py-2 px-4 hover:bg-orange-100 rounded-lg border border-orange-300"
                      >
                        {item.icon && <item.icon className="h-5 w-5" />}
                        {item.label}
                        <Badge className="bg-orange-600 text-white text-xs ml-auto font-bold">B2B</Badge>
                      </Link>
                    ) : (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-lg font-semibold text-gray-900 hover:text-indigo-700 transition-colors py-2 px-4 hover:bg-indigo-50 rounded-lg"
                      >
                        {item.label}
                      </a>
                    )
                  ))}
                  <div className="border-t pt-4 mt-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Acceder como:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-1.5">
                          <Users className="h-3.5 w-3.5 text-emerald-600" /> Gestor
                        </Button>
                      </Link>
                      <Link href="/portal-inquilino/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-1.5">
                          <Home className="h-3.5 w-3.5 text-indigo-600" /> Inquilino
                        </Button>
                      </Link>
                      <Link href="/portal-propietario/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-amber-600" /> Propietario
                        </Button>
                      </Link>
                      <Link href="/portal-proveedor/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-blue-600" /> Proveedor
                        </Button>
                      </Link>
                      <Link href="/partners/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-1.5">
                          <Handshake className="h-3.5 w-3.5 text-rose-600" /> Partner
                        </Button>
                      </Link>
                      <Link href="/ewoorker/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-1.5">
                          <Hammer className="h-3.5 w-3.5 text-orange-600" /> Construcción
                        </Button>
                      </Link>
                    </div>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                        Comenzar Gratis
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
