'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DoorOpen, User, Square, Users, Euro, TrendingUp } from 'lucide-react';

interface ProrationPreviewProps {
  preview: {
    roomId: string;
    numero: string;
    tenantName: string;
    superficie: number;
    numOcupantes: number;
    costoElectricidad: number;
    costoAgua: number;
    costoGas: number;
    costoInternet: number;
    costoLimpieza: number;
    costoTotal: number;
  }[];
}

export function ProrationPreview({ preview }: ProrationPreviewProps) {
  const totalGeneral = preview.reduce((sum, room) => sum + room.costoTotal, 0);
  const promedioRoom = totalGeneral / preview.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total a Prorratear</p>
                <p className="text-2xl font-bold text-indigo-900">{totalGeneral.toFixed(2)}€</p>
              </div>
              <div className="p-3 bg-indigo-600 rounded-xl">
                <Euro className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio por Habitación</p>
                <p className="text-2xl font-bold text-green-900">{promedioRoom.toFixed(2)}€</p>
              </div>
              <div className="p-3 bg-green-600 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {preview.map((room, index) => {
          const isAboveAverage = room.costoTotal > promedioRoom;
          const diff = Math.abs(room.costoTotal - promedioRoom);
          const diffPercent = ((diff / promedioRoom) * 100).toFixed(1);

          return (
            <Card key={room.roomId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <DoorOpen className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Habitación {room.numero}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          {room.tenantName}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Square className="h-3 w-3 mr-1" />
                          {room.superficie}m²
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {room.numOcupantes} ocupante{room.numOcupantes !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {room.costoTotal.toFixed(2)}€
                    </div>
                    <div
                      className={`text-xs font-medium ${
                        isAboveAverage ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {isAboveAverage ? '+' : '-'}
                      {diffPercent}% vs promedio
                    </div>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Electricidad</p>
                    <p className="font-semibold text-gray-900">
                      {room.costoElectricidad.toFixed(2)}€
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Agua</p>
                    <p className="font-semibold text-gray-900">{room.costoAgua.toFixed(2)}€</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Gas</p>
                    <p className="font-semibold text-gray-900">{room.costoGas.toFixed(2)}€</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Internet</p>
                    <p className="font-semibold text-gray-900">{room.costoInternet.toFixed(2)}€</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Limpieza</p>
                    <p className="font-semibold text-gray-900">{room.costoLimpieza.toFixed(2)}€</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
