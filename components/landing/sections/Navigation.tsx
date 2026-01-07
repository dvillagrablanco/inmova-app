'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Building2, Sparkles, Menu, X, HardHat } from 'lucide-react';

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

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {menuItems.map((item) => (
              item.highlight ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 hover:border-orange-300"
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
            <Link href="/login">
              <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100 hover:border-gray-400 font-semibold">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/50">
                Comenzar Gratis
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
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
                        className="flex items-center gap-2 text-lg font-semibold text-orange-600 hover:text-orange-700 transition-colors py-2 px-4 hover:bg-orange-50 rounded-lg border border-orange-200"
                      >
                        {item.icon && <item.icon className="h-5 w-5" />}
                        {item.label}
                        <Badge className="bg-orange-500 text-white text-xs ml-auto">B2B</Badge>
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
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Iniciar Sesión
                      </Button>
                    </Link>
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
    </nav>
  );
}
