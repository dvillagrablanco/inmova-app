'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Bot, Activity, BrainCircuit, ShieldCheck, TrendingUp, Users, MessageSquare } from 'lucide-react';

interface Agent {
  type: string;
  name: string;
  description: string;
  enabled: boolean;
  capabilities: string[];
}

interface AgentMetric {
  agentType: string;
  totalInteractions: number;
  successfulInteractions: number;
  averageResponseTime: number;
  averageConfidence: number;
}

export default function AiAgentsDashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [metrics, setMetrics] = useState<AgentMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/admin/ai-agents/dashboard');
        if (response.ok) {
          const data = await response.json();
          setAgents(data.agents);
          setMetrics(data.metrics);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'technical_support': return <Bot className="h-6 w-6 text-blue-500" />;
      case 'legal_compliance': return <ShieldCheck className="h-6 w-6 text-red-500" />;
      case 'financial_analysis': return <TrendingUp className="h-6 w-6 text-green-500" />;
      case 'customer_service': return <Users className="h-6 w-6 text-orange-500" />;
      case 'commercial_management': return <MessageSquare className="h-6 w-6 text-purple-500" />;
      default: return <BrainCircuit className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <AuthenticatedLayout maxWidth="7xl">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BrainCircuit className="h-8 w-8 text-indigo-600" />
            Centro de Control de Agentes IA
          </h1>
          <p className="text-gray-600 mt-2">
            Gestión y monitorización de la flota de agentes autónomos inteligentes
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => {
              const metric = metrics.find(m => m.agentType === agent.type);
              
              return (
                <Card key={agent.type} className="hover:shadow-lg transition-shadow border-t-4 border-t-indigo-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        {getAgentIcon(agent.type)}
                      </div>
                      <CardTitle className="text-lg font-bold">
                        {agent.name}
                      </CardTitle>
                    </div>
                    <Badge variant={agent.enabled ? "default" : "secondary"} className={agent.enabled ? "bg-green-100 text-green-800" : ""}>
                      {agent.enabled ? "Activo" : "Inactivo"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-4 h-10 line-clamp-2">
                      {agent.description}
                    </p>
                    
                    <div className="space-y-3 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Interacciones</span>
                        <span className="font-semibold">{metric?.totalInteractions || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Éxito</span>
                        <span className="font-semibold text-green-600">
                          {metric?.totalInteractions ? Math.round((metric.successfulInteractions / metric.totalInteractions) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Confianza</span>
                        <span className="font-semibold">
                          {metric?.averageConfidence ? Math.round(metric.averageConfidence * 100) : 0}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 flex gap-2">
                      <Button variant="outline" className="w-full text-xs" size="sm">
                        <Activity className="h-3 w-3 mr-1" /> Logs
                      </Button>
                      <Button variant="default" className="w-full text-xs bg-indigo-600" size="sm">
                        Configurar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
