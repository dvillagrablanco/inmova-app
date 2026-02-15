"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AdaptiveDashboard } from '@/components/adaptive/AdaptiveDashboard';
import { AdaptiveSidebar } from '@/components/adaptive/AdaptiveSidebar';
import { UserProfile } from '@/lib/ui-mode-service';
import { Loader2 } from 'lucide-react';

/**
 * EJEMPLO DE PÁGINA CON DASHBOARD ADAPTATIVO
 * 
 * Esta página demuestra cómo usar:
 * - AdaptiveDashboard: Dashboard que cambia según uiMode
 * - AdaptiveSidebar: Sidebar contextual
 */
export default function AdaptiveDashboardPage() {
  const { data: _session, status } = useSession() || {};
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    totalBuildings: 0,
    totalUnits: 0,
    totalTenants: 0,
    activeContracts: 0,
    monthlyRevenue: 0,
    occupancyRate: 0,
    pendingPayments: 0,
    maintenanceIssues: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener perfil del usuario
        const profileRes = await fetch('/api/user/ui-mode');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUserProfile({
            uiMode: profileData.profile.uiMode || 'standard',
            experienceLevel: profileData.profile.experienceLevel,
            techSavviness: profileData.profile.techSavviness,
            portfolioSize: profileData.profile.portfolioSize,
            preferredModules: profileData.profile.preferredModules || [],
            hiddenModules: profileData.profile.hiddenModules || [],
          });
        }

        // Obtener estadísticas (ejemplo con datos mock)
        // En producción, reemplazar con llamada a API real
        setStats({
          totalBuildings: 12,
          totalUnits: 45,
          totalTenants: 38,
          activeContracts: 35,
          monthlyRevenue: 42500,
          occupancyRate: 84,
          pendingPayments: 3,
          maintenanceIssues: 7,
        });
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  if (loading || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Adaptativo */}
      <AdaptiveSidebar
        vertical="alquiler_tradicional"
        userProfile={userProfile}
      />

      {/* Contenido Principal */}
      <main className="flex-1 p-8">
        <AdaptiveDashboard
          userProfile={userProfile}
          stats={stats}
          vertical="alquiler_tradicional"
        />
      </main>
    </div>
  );
}
