/**
 * Componente para seleccionar agente específico
 */

'use client';

import { useState, useEffect } from 'react';
import { Bot, Check } from 'lucide-react';
import { AgentType } from '@/lib/ai-agents/types';

interface AgentInfo {
  type: AgentType;
  name: string;
  description: string;
  enabled: boolean;
  capabilities: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
  }>;
}

interface AgentSelectorProps {
  selectedAgent?: AgentType;
  onSelectAgent: (agent: AgentType) => void;
  className?: string;
}

export default function AgentSelector({
  selectedAgent,
  onSelectAgent,
  className = ''
}: AgentSelectorProps) {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents/list');
      const data = await response.json();
      
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAgentIcon = (agentType: AgentType) => {
    // Aquí podrías importar íconos específicos para cada agente
    return <Bot className="w-6 h-6" />;
  };

  const getAgentColor = (agentType: AgentType) => {
    const colors: Record<AgentType, string> = {
      technical_support: 'border-orange-500 hover:bg-orange-50',
      customer_service: 'border-blue-500 hover:bg-blue-50',
      commercial_management: 'border-green-500 hover:bg-green-50',
      financial_analysis: 'border-purple-500 hover:bg-purple-50',
      legal_compliance: 'border-red-500 hover:bg-red-50',
      maintenance_preventive: 'border-yellow-500 hover:bg-yellow-50',
      general: 'border-gray-500 hover:bg-gray-50'
    };
    return colors[agentType] || 'border-gray-500 hover:bg-gray-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {agents.map((agent) => (
        <button
          key={agent.type}
          onClick={() => onSelectAgent(agent.type)}
          disabled={!agent.enabled}
          className={`
            relative p-6 border-2 rounded-lg text-left transition-all
            ${selectedAgent === agent.type ? 'ring-2 ring-blue-500 border-blue-500' : getAgentColor(agent.type)}
            ${!agent.enabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg cursor-pointer'}
          `}
        >
          {/* Check badge si está seleccionado */}
          {selectedAgent === agent.type && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}

          <div className="flex items-start space-x-3 mb-3">
            <div className={`p-2 rounded-lg ${!agent.enabled ? 'bg-gray-200' : 'bg-blue-100'}`}>
              {getAgentIcon(agent.type)}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{agent.name}</h3>
              {!agent.enabled && (
                <span className="text-xs text-red-600 font-medium">No disponible</span>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3">{agent.description}</p>

          {agent.capabilities && agent.capabilities.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Capacidades:</p>
              {agent.capabilities.slice(0, 3).map((cap) => (
                <div key={cap.id} className="text-xs text-gray-600">
                  • {cap.name}
                </div>
              ))}
              {agent.capabilities.length > 3 && (
                <p className="text-xs text-gray-500 italic">
                  +{agent.capabilities.length - 3} más...
                </p>
              )}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
