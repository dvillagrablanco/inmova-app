"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AdaptiveDashboard } from '@/components/adaptive/AdaptiveDashboard';
import { AdaptiveSidebar } from '@/components/adaptive/AdaptiveSidebar';
import { UserProfile } from '@/lib/ui-mode-service';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * EJEMPLO DE PÁGINA CON DASHBOARD ADAPTATIVO
 * 
 * Esta página demuestra cómo usar:
 * - AdaptiveDashboard: Dashboard que cambia según uiMode
 * - AdaptiveSidebar: Sidebar contextual
 */
export default function AdaptiveDashboardPage() {
  const { status } = useSession() || {};
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

        const dashboardRes = await fetch('/api/dashboard');
        if (!dashboardRes.ok) {
          const errorData = await dashboardRes.json();
          throw new Error(errorData.error || 'Error al cargar estadísticas');
        }
        const dashboardData = await dashboardRes.json();
        const statsPayload = dashboardData.stats || {
          totalBuildings: dashboardData.kpis?.numeroPropiedades || 0,
          totalUnits: dashboardData.kpis?.totalUnits || 0,
          totalTenants: dashboardData.kpis?.totalTenants || 0,
          activeContracts: dashboardData.kpis?.activeContracts || 0,
          monthlyRevenue: dashboardData.kpis?.ingresosTotalesMensuales || 0,
          occupancyRate: dashboardData.kpis?.tasaOcupacion || 0,
          pendingPayments: dashboardData.kpis?.pendingPayments || dashboardData.pagosPendientes?.length || 0,
          maintenanceIssues: dashboardData.maintenanceRequests?.length || 0,
        };
        setStats(statsPayload);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar datos del dashboard');
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
