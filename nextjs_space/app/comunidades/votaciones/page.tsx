"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function VotacionesPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/comunidades')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold capitalize">votaciones</h1>
          <p className="text-muted-foreground mt-1">
            Módulo de gestión de votaciones
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo en Desarrollo</CardTitle>
          <CardDescription>
            Este módulo está completamente funcional en el backend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            El backend para este módulo está implementado y funcional. 
            La interfaz de usuario completa se puede desarrollar según tus necesidades específicas.
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Funcionalidades disponibles:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>APIs REST completamente funcionales</li>
              <li>Servicios de backend implementados</li>
              <li>Modelos de base de datos creados</li>
              <li>Sistema de autenticación integrado</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
