'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface AiInsight {
  id: string;
  nivel: 'verde' | 'amarillo' | 'rojo' | 'info';
  titulo: string;
  detalle: string;
  accion?: string;
}

interface AiInsightPanelProps {
  /** API endpoint to call */
  apiUrl: string;
  /** 'insights' = GET data with alert cards, 'chat' = POST chat with AI agent */
  mode: 'insights' | 'chat';
  /** Panel title */
  title: string;
  /** Icon to show (optional, defaults to Brain) */
  icon?: React.ReactNode;
  /** Additional context to send with chat messages */
  chatContext?: string;
  /** HTTP method override for insights mode (default: GET) */
  insightsMethod?: 'GET' | 'POST';
  /** Body for POST insights requests */
  insightsBody?: Record<string, any>;
  /** Custom transform function for API response to insights */
  transformResponse?: (data: any) => AiInsight[];
  /** Whether to auto-load on expand (default: true) */
  autoLoad?: boolean;
  /** Accent color */
  accentColor?: string;
}

// ============================================================================
// DEFAULT TRANSFORMS
// ============================================================================

function defaultTransformInsights(data: any): AiInsight[] {
  // Handle multiple common API response shapes

  // Shape 1: { predictions: [...] } (predictive maintenance)
  if (data.predictions) {
    return data.predictions.map((p: any, i: number) => ({
      id: `pred-${i}`,
      nivel: p.urgency === 'high' || p.urgencia === 'alta' ? 'rojo'
        : p.urgency === 'medium' || p.urgencia === 'media' ? 'amarillo' : 'verde',
      titulo: p.title || p.edificio || p.description || `Predicción ${i + 1}`,
      detalle: p.detail || p.detalle || p.message || JSON.stringify(p),
      accion: p.action || p.accion,
    }));
  }

  // Shape 2: { tenants: [...] } (delinquency risk)
  if (data.tenants) {
    return data.tenants.slice(0, 10).map((t: any, i: number) => ({
      id: `tenant-${i}`,
      nivel: (t.riskScore || t.score || 0) >= 70 ? 'rojo'
        : (t.riskScore || t.score || 0) >= 40 ? 'amarillo' : 'verde',
      titulo: t.name || t.nombreCompleto || `Inquilino ${i + 1}`,
      detalle: `Riesgo: ${t.riskScore || t.score || 0}/100${t.reason ? ` — ${t.reason}` : ''}`,
    }));
  }

  // Shape 3: { recommendations: [...] } (rent optimization)
  if (data.recommendations) {
    return data.recommendations.map((r: any, i: number) => ({
      id: `rec-${i}`,
      nivel: r.priority === 'high' ? 'rojo' : r.priority === 'medium' ? 'amarillo' : 'verde',
      titulo: r.title || r.unit || `Recomendación ${i + 1}`,
      detalle: r.detail || r.recommendation || r.detalle || JSON.stringify(r),
      accion: r.action || r.suggestedAction,
    }));
  }

  // Shape 4: { buildings: [...] } (predictive maintenance alt)
  if (data.buildings) {
    const insights: AiInsight[] = [];
    for (const b of data.buildings) {
      if (b.alerts?.length > 0) {
        for (const a of b.alerts) {
          insights.push({
            id: `bld-${b.id || insights.length}`,
            nivel: a.severity === 'critical' ? 'rojo' : a.severity === 'warning' ? 'amarillo' : 'info',
            titulo: `${b.name || b.nombre}: ${a.type || a.tipo || 'Alerta'}`,
            detalle: a.message || a.detalle || a.description,
          });
        }
      }
    }
    return insights;
  }

  // Shape 5: { results: [...] } or { data: [...] } (generic)
  const items = data.results || data.data || data.items || data.insights;
  if (Array.isArray(items)) {
    return items.slice(0, 15).map((item: any, i: number) => ({
      id: `item-${i}`,
      nivel: item.nivel || item.level || item.severity || 'info',
      titulo: item.titulo || item.title || item.name || `Item ${i + 1}`,
      detalle: item.detalle || item.detail || item.description || item.message || JSON.stringify(item),
      accion: item.accion || item.action,
    }));
  }

  // Shape 6: Single object with message
  if (data.message || data.analysis || data.summary) {
    return [{
      id: 'single',
      nivel: 'info',
      titulo: 'Análisis IA',
      detalle: data.message || data.analysis || data.summary,
    }];
  }

  return [{
    id: 'empty',
    nivel: 'info',
    titulo: 'Sin datos',
    detalle: 'No se encontraron insights para mostrar.',
  }];
}

// ============================================================================
// INSIGHT CARD COMPONENT
// ============================================================================

function InsightCard({ insight }: { insight: AiInsight }) {
  const colors = {
    rojo: 'border-red-200 bg-red-50/50',
    amarillo: 'border-amber-200 bg-amber-50/50',
    verde: 'border-green-200 bg-green-50/50',
    info: 'border-blue-200 bg-blue-50/50',
  };
  const icons = {
    rojo: <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />,
    amarillo: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
    verde: <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />,
    info: <Info className="h-4 w-4 text-blue-500 shrink-0" />,
  };

  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border ${colors[insight.nivel]}`}>
      {icons[insight.nivel]}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{insight.titulo}</p>
        <p className="text-xs text-gray-600 mt-0.5">{insight.detalle}</p>
        {insight.accion && (
          <p className="text-xs text-blue-600 mt-1 font-medium">{insight.accion}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CHAT MESSAGE COMPONENT
// ============================================================================

function ChatMessage({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
        role === 'user'
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted'
      }`}>
        {content}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AiInsightPanel({
  apiUrl,
  mode,
  title,
  icon,
  chatContext,
  insightsMethod = 'GET',
  insightsBody,
  transformResponse,
  autoLoad = true,
  accentColor = 'purple',
}: AiInsightPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Insights mode state
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Chat mode state
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  const transform = transformResponse || defaultTransformInsights;

  // ── INSIGHTS: Fetch data ──
  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const options: RequestInit = insightsMethod === 'POST'
        ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(insightsBody || {}) }
        : { method: 'GET' };

      const res = await fetch(apiUrl, options);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setInsights(transform(data));
      setLoaded(true);
    } catch (e: any) {
      setError(e.message || 'Error conectando con IA');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, insightsMethod, insightsBody, transform]);

  // ── CHAT: Send message ──
  const sendChatMessage = useCallback(async () => {
    if (!chatInput.trim() || loading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatContext ? `[Contexto: ${chatContext}] ${userMsg}` : userMsg,
          history: messages.slice(-10),
        }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const reply = data.response || data.message || data.content || data.text
        || (typeof data === 'string' ? data : JSON.stringify(data));
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      setError(e.message || 'Error comunicando con IA');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, chatInput, chatContext, messages, loading]);

  // ── Auto-load on expand ──
  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    if (newExpanded && autoLoad && mode === 'insights' && !loaded && !loading) {
      fetchInsights();
    }
  };

  // Count by severity
  const redCount = insights.filter(i => i.nivel === 'rojo').length;
  const yellowCount = insights.filter(i => i.nivel === 'amarillo').length;

  return (
    <Card className={`border-${accentColor}-200/50 overflow-hidden`}>
      {/* Header — always visible, clickable */}
      <CardHeader
        className={`cursor-pointer py-3 px-4 hover:bg-${accentColor}-50/30 transition-colors`}
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            {icon || <Brain className="h-4 w-4 text-purple-600" />}
            <Sparkles className="h-3 w-3 text-purple-400" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {loaded && mode === 'insights' && (
              <div className="flex gap-1">
                {redCount > 0 && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{redCount}</Badge>}
                {yellowCount > 0 && <Badge className="bg-amber-500 text-[10px] px-1.5 py-0">{yellowCount}</Badge>}
                {redCount === 0 && yellowCount === 0 && <Badge className="bg-green-500 text-[10px] px-1.5 py-0">OK</Badge>}
              </div>
            )}
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" />}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {/* Body — expandable */}
      {expanded && (
        <CardContent className="pt-0 pb-3 px-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
              {error}
            </div>
          )}

          {/* ── INSIGHTS MODE ── */}
          {mode === 'insights' && (
            <div className="space-y-2">
              {loading && !loaded && (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-4 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analizando con IA...
                </div>
              )}
              {loaded && insights.map(insight => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
              {loaded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-gray-500"
                  onClick={(e) => { e.stopPropagation(); fetchInsights(); }}
                  disabled={loading}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar análisis
                </Button>
              )}
            </div>
          )}

          {/* ── CHAT MODE ── */}
          {mode === 'chat' && (
            <div className="space-y-2">
              {messages.length === 0 && !loading && (
                <p className="text-xs text-gray-400 text-center py-2">
                  Pregunta lo que necesites al asistente IA
                </p>
              )}
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {messages.map((msg, i) => (
                  <ChatMessage key={i} role={msg.role} content={msg.content} />
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" /> Pensando...
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                  className="text-sm h-8"
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  disabled={loading}
                />
                <Button
                  size="sm"
                  className="h-8 px-3"
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || loading}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
