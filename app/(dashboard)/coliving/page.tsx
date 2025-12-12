'use client';
export const dynamic = 'force-dynamic';


import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, MessageSquare, UserCheck, Sparkles, Package } from 'lucide-react';
import FeedSocial from './_components/FeedSocial';
import MatchingPanel from './_components/MatchingPanel';
import GruposInteres from './_components/GruposInteres';
import EventosCalendario from './_components/EventosCalendario';
import ServiciosPremium from './_components/ServiciosPremium';
import PaqueteriaPanel from './_components/PaqueteriaPanel';


export default function ColivingPage() {
  const [activeTab, setActiveTab] = useState('feed');

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Hub de Coliving
              </h1>
              <p className="text-gray-600">
                Conecta, comparte experiencias y disfruta de servicios premium en tu comunidad
              </p>
            </div>

            {/* Tabs principales */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-2">
                <TabsTrigger value="feed" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Feed</span>
                </TabsTrigger>
                <TabsTrigger value="matching" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Matching</span>
                </TabsTrigger>
                <TabsTrigger value="grupos" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Grupos</span>
                </TabsTrigger>
                <TabsTrigger value="eventos" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Eventos</span>
                </TabsTrigger>
                <TabsTrigger value="servicios" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Servicios</span>
                </TabsTrigger>
                <TabsTrigger value="paquetes" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Paquetes</span>
                </TabsTrigger>
              </TabsList>

              {/* Feed Social */}
              <TabsContent value="feed">
                <FeedSocial />
              </TabsContent>

              {/* Matching */}
              <TabsContent value="matching">
                <MatchingPanel />
              </TabsContent>

              {/* Grupos de Interés */}
              <TabsContent value="grupos">
                <GruposInteres />
              </TabsContent>

              {/* Eventos */}
              <TabsContent value="eventos">
                <EventosCalendario />
              </TabsContent>

              {/* Servicios Premium */}
              <TabsContent value="servicios">
                <ServiciosPremium />
              </TabsContent>

              {/* Paquetería */}
              <TabsContent value="paquetes">
                <PaqueteriaPanel />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
