import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface RecommendationCriteria {
  buildingId: string;
  tipo: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  presupuestoMax?: number;
  fechaRequerida?: Date;
  limit?: number;
}

interface ProviderScore {
  total: number;
  breakdown: {
    rating: number;
    availability: number;
    specialization: number;
    workload: number;
    performance: number;
    responseTime: number;
  };
}

interface ProviderRecommendation {
  provider: {
    id: string;
    nombre: string;
    tipo: string;
    telefono: string;
    email: string | null;
    rating: number | null;
  };
  score: ProviderScore;
  reasoning: string[];
  recommendation: string;
}

interface RecommendationResponse {
  success: boolean;
  recommendations: ProviderRecommendation[];
  metadata?: {
    timestamp: string;
    criteria: any;
  };
}

export function useProviderRecommendations() {
  const [recommendations, setRecommendations] = useState<ProviderRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async (criteria: RecommendationCriteria) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/providers/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...criteria,
          fechaRequerida: criteria.fechaRequerida?.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Error al obtener recomendaciones');
      }

      const data: RecommendationResponse = await response.json();

      if (data.success) {
        setRecommendations(data.recommendations || []);
        return data.recommendations;
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error desconocido';
      setError(errorMessage);
      toast.error('No se pudieron obtener recomendaciones');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setRecommendations([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    recommendations,
    loading,
    error,
    fetchRecommendations,
    reset,
  };
}

interface ProviderPerformance {
  providerId: string;
  period: {
    days: number;
    from: string;
    to: string;
  };
  metrics: {
    completion: {
      avgTime: number;
      rate: number;
      onTimeRate: number;
    };
    workload: {
      completed: number;
      pending: number;
    };
    quality: {
      avgRating: number;
      trend: 'improving' | 'stable' | 'declining';
    };
    responsiveness: {
      avgResponseTime: number;
    };
  };
  analysis: string[];
}

export function useProviderPerformance() {
  const [performance, setPerformance] = useState<ProviderPerformance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async (providerId: string, days: number = 90) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/providers/performance/${providerId}?days=${days}`);

      if (!response.ok) {
        throw new Error('Error al obtener métricas de rendimiento');
      }

      const data = await response.json();

      if (data.success) {
        setPerformance(data);
        return data;
      } else {
        throw new Error(data.error || 'Error en la respuesta');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error desconocido';
      setError(errorMessage);
      toast.error('No se pudieron obtener las métricas');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPerformance(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    performance,
    loading,
    error,
    fetchPerformance,
    reset,
  };
}

interface AssignmentStats {
  totalProviders: number;
  totalWorkOrders: number;
  completedOrders: number;
  completionRate: number;
  avgProviderRating: number;
}

export function useAssignmentStats() {
  const [stats, setStats] = useState<AssignmentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/providers/stats');

      if (!response.ok) {
        throw new Error('Error al obtener estadísticas');
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        return data.stats;
      } else {
        throw new Error(data.error || 'Error en la respuesta');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error desconocido';
      setError(errorMessage);
      toast.error('No se pudieron obtener las estadísticas');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setStats(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    stats,
    loading,
    error,
    fetchStats,
    reset,
  };
}
