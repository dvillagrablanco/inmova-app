'use client';

import { useState, useEffect, useRef } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Search,
  Calendar,
  Clock,
  User,
  MessageSquare,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Minus,
  CalendarCheck,
  RefreshCw,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TranscriptMessage {
  role: 'agent' | 'user';
  content: string;
  timestamp?: string;
}

interface RetellCall {
  id: string;
  retellCallId: string;
  fromNumber: string | null;
  toNumber: string | null;
  status: string;
  direction: string;
  duracionSegundos: number | null;
  recordingUrl: string | null;
  transcript: TranscriptMessage[] | null;
  transcriptText: string | null;
  resumen: string | null;
  sentimiento: string | null;
  intencion: string | null;
  resultado: string | null;
  datosExtraidos: Record<string, unknown> | null;
  accionesRealizadas: string[] | null;
  startedAt: string;
  endedAt: string | null;
  lead: {
    id: string;
    nombre: string;
    apellidos: string | null;
    email: string;
    telefono: string | null;
    estado: string;
    temperatura: string;
  } | null;
  appointment: {
    id: string;
    titulo: string;
    fechaInicio: string;
    estado: string;
  } | null;
}

interface CallStats {
  byStatus: Record<string, number>;
  byResultado: Record<string, number>;
  duracionTotal: number;
  duracionPromedio: number;
}

export default function AdminCallsPage() {
  const [calls, setCalls] = useState<RetellCall[]>([]);
  const [stats, setStats] = useState<CallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resultadoFilter, setResultadoFilter] = useState('all');

  // Estado del reproductor
  const [selectedCall, setSelectedCall] = useState<RetellCall | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadCalls();
  }, [page, statusFilter, resultadoFilter]);

  const loadCalls = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(resultadoFilter !== 'all' && { resultado: resultadoFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/calls?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCalls(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
        setStats(data.stats || null);
      } else {
        toast.error('Error cargando llamadas');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadCalls();
  };

  const openCallDetails = (call: RetellCall) => {
    setSelectedCall(call);
    setDetailsOpen(true);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Controles del reproductor
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ended: 'bg-green-100 text-green-700',
      in_progress: 'bg-blue-100 text-blue-700',
      error: 'bg-red-100 text-red-700',
      voicemail: 'bg-yellow-100 text-yellow-700',
    };
    const labels: Record<string, string> = {
      ended: 'Finalizada',
      in_progress: 'En curso',
      error: 'Error',
      voicemail: 'Buzón de voz',
    };
    return (
      <Badge className={styles[status] || 'bg-gray-100 text-gray-700'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getSentimientoBadge = (sentimiento: string | null) => {
    if (!sentimiento) return null;
    const config: Record<string, { icon: React.ReactNode; className: string }> = {
      positivo: { icon: <ThumbsUp className="w-3 h-3 mr-1" />, className: 'bg-green-100 text-green-700' },
      neutral: { icon: <Minus className="w-3 h-3 mr-1" />, className: 'bg-gray-100 text-gray-700' },
      negativo: { icon: <ThumbsDown className="w-3 h-3 mr-1" />, className: 'bg-red-100 text-red-700' },
    };
    const { icon, className } = config[sentimiento] || config.neutral;
    return (
      <Badge className={className}>
        {icon}
        {sentimiento}
      </Badge>
    );
  };

  const getResultadoBadge = (resultado: string | null) => {
    if (!resultado) return null;
    const config: Record<string, string> = {
      cita_agendada: 'bg-purple-100 text-purple-700',
      lead_cualificado: 'bg-blue-100 text-blue-700',
      no_interesado: 'bg-red-100 text-red-700',
      callback: 'bg-yellow-100 text-yellow-700',
      informacion: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = {
      cita_agendada: 'Cita agendada',
      lead_cualificado: 'Lead cualificado',
      no_interesado: 'No interesado',
      callback: 'Callback',
      informacion: 'Información',
    };
    return (
      <Badge className={config[resultado] || 'bg-gray-100 text-gray-700'}>
        {labels[resultado] || resultado}
      </Badge>
    );
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Llamadas Retell AI</h1>
            <p className="text-gray-600 mt-1">
              Historial de llamadas con Carmen, asistente virtual de ventas
            </p>
          </div>
          <Button onClick={loadCalls} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Llamadas</p>
                    <p className="text-2xl font-bold">
                      {Object.values(stats.byStatus).reduce((a, b) => a + b, 0)}
                    </p>
                  </div>
                  <Phone className="w-8 h-8 text-indigo-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Citas Agendadas</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.byResultado.cita_agendada || 0}
                    </p>
                  </div>
                  <CalendarCheck className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Duración Total</p>
                    <p className="text-2xl font-bold">
                      {Math.round(stats.duracionTotal / 60)} min
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Duración Promedio</p>
                    <p className="text-2xl font-bold">
                      {formatTime(stats.duracionPromedio)}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por teléfono o contenido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="ended">Finalizadas</SelectItem>
                  <SelectItem value="in_progress">En curso</SelectItem>
                  <SelectItem value="error">Con error</SelectItem>
                  <SelectItem value="voicemail">Buzón de voz</SelectItem>
                </SelectContent>
              </Select>
              <Select value={resultadoFilter} onValueChange={setResultadoFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cita_agendada">Cita agendada</SelectItem>
                  <SelectItem value="lead_cualificado">Lead cualificado</SelectItem>
                  <SelectItem value="no_interesado">No interesado</SelectItem>
                  <SelectItem value="callback">Callback</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de llamadas */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Llamadas</CardTitle>
            <CardDescription>
              {calls.length} llamadas encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calls.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sin llamadas registradas
                </h3>
                <p className="text-gray-500">
                  Las llamadas de Retell AI aparecerán aquí automáticamente.
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Lead</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Sentimiento</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calls.map((call) => (
                      <TableRow 
                        key={call.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => openCallDetails(call)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {format(new Date(call.startedAt), 'dd MMM yyyy', { locale: es })}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(call.startedAt), 'HH:mm')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {call.direction === 'inbound' ? (
                              <PhoneIncoming className="w-4 h-4 text-green-500" />
                            ) : (
                              <PhoneOutgoing className="w-4 h-4 text-blue-500" />
                            )}
                            <span>{call.fromNumber || 'Desconocido'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {call.lead ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {call.lead.nombre.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{call.lead.nombre}</p>
                                <p className="text-xs text-gray-500">{call.lead.estado}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Sin asignar</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {call.duracionSegundos ? formatTime(call.duracionSegundos) : '-'}
                        </TableCell>
                        <TableCell>{getSentimientoBadge(call.sentimiento)}</TableCell>
                        <TableCell>{getResultadoBadge(call.resultado)}</TableCell>
                        <TableCell>{getStatusBadge(call.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {call.recordingUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCallDetails(call);
                                }}
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginación */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Modal de detalles */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Detalle de Llamada
              </DialogTitle>
              <DialogDescription>
                {selectedCall && format(new Date(selectedCall.startedAt), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
              </DialogDescription>
            </DialogHeader>

            {selectedCall && (
              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="transcripcion" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="transcripcion">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Transcripción
                    </TabsTrigger>
                    <TabsTrigger value="resumen">
                      <Bot className="w-4 h-4 mr-2" />
                      Resumen IA
                    </TabsTrigger>
                    <TabsTrigger value="lead">
                      <User className="w-4 h-4 mr-2" />
                      Lead
                    </TabsTrigger>
                  </TabsList>

                  {/* Reproductor de audio */}
                  {selectedCall.recordingUrl && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <audio
                        ref={audioRef}
                        src={selectedCall.recordingUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                      />
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={togglePlay}
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <Slider
                            value={[currentTime]}
                            max={duration || 100}
                            step={1}
                            onValueChange={handleSeek}
                            className="cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleMute}
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(selectedCall.recordingUrl!, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <TabsContent value="transcripcion" className="flex-1 overflow-hidden mt-4">
                    <ScrollArea className="h-[400px] pr-4">
                      {selectedCall.transcript && Array.isArray(selectedCall.transcript) ? (
                        <div className="space-y-4">
                          {(selectedCall.transcript as TranscriptMessage[]).map((msg, idx) => (
                            <div
                              key={idx}
                              className={`flex gap-3 ${
                                msg.role === 'agent' ? '' : 'flex-row-reverse'
                              }`}
                            >
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarFallback
                                  className={
                                    msg.role === 'agent'
                                      ? 'bg-indigo-100 text-indigo-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }
                                >
                                  {msg.role === 'agent' ? 'C' : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  msg.role === 'agent'
                                    ? 'bg-indigo-50 text-indigo-900'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <p className="text-sm">{msg.content}</p>
                                {msg.timestamp && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {msg.timestamp}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : selectedCall.transcriptText ? (
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap">{selectedCall.transcriptText}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                          <p>No hay transcripción disponible</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="resumen" className="mt-4">
                    <div className="space-y-4">
                      {/* Badges de análisis */}
                      <div className="flex flex-wrap gap-2">
                        {getSentimientoBadge(selectedCall.sentimiento)}
                        {getResultadoBadge(selectedCall.resultado)}
                        {selectedCall.intencion && (
                          <Badge variant="outline">{selectedCall.intencion}</Badge>
                        )}
                      </div>

                      {/* Resumen */}
                      {selectedCall.resumen ? (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Resumen de la llamada</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-700">{selectedCall.resumen}</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Bot className="w-12 h-12 mx-auto mb-2 opacity-20" />
                          <p>No hay resumen disponible</p>
                        </div>
                      )}

                      {/* Datos extraídos */}
                      {selectedCall.datosExtraidos && Object.keys(selectedCall.datosExtraidos).length > 0 && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Datos extraídos</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {Object.entries(selectedCall.datosExtraidos).map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-gray-500">{key}:</span>{' '}
                                  <span className="font-medium">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Acciones realizadas */}
                      {selectedCall.accionesRealizadas && selectedCall.accionesRealizadas.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Acciones realizadas</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="text-sm space-y-1">
                              {selectedCall.accionesRealizadas.map((accion, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                  {accion}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {/* Cita agendada */}
                      {selectedCall.appointment && (
                        <Card className="border-purple-200 bg-purple-50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <CalendarCheck className="w-4 h-4 text-purple-600" />
                              Cita agendada
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="font-medium">{selectedCall.appointment.titulo}</p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(selectedCall.appointment.fechaInicio), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="lead" className="mt-4">
                    {selectedCall.lead ? (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback>
                                {selectedCall.lead.nombre.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">
                                {selectedCall.lead.nombre} {selectedCall.lead.apellidos}
                              </h3>
                              <p className="text-gray-500">{selectedCall.lead.email}</p>
                              {selectedCall.lead.telefono && (
                                <p className="text-gray-500">{selectedCall.lead.telefono}</p>
                              )}
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{selectedCall.lead.estado}</Badge>
                                <Badge
                                  className={
                                    selectedCall.lead.temperatura === 'caliente'
                                      ? 'bg-red-100 text-red-700'
                                      : selectedCall.lead.temperatura === 'tibio'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }
                                >
                                  {selectedCall.lead.temperatura}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/admin/crm/leads/${selectedCall.lead.id}`}>
                                Ver perfil completo
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>No hay lead asociado a esta llamada</p>
                        <Button variant="outline" className="mt-4">
                          Asociar Lead
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
