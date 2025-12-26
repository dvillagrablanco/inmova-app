import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PRESENTATIONS } from "@/lib/presentations/data";
import { Presentation, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PresentationsPage() {
  return (
    <div className="container py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Centro de Presentaciones INMOVA</h1>
        <p className="text-xl text-muted-foreground">
          Accede a todos los decks corporativos, planes de formación y material comercial.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(PRESENTATIONS).map((pres) => (
          <Card key={pres.id} className="hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Presentation size={24} />
              </div>
              <CardTitle>{pres.title}</CardTitle>
              <CardDescription>{pres.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                <span>{pres.slides.length} diapositivas</span>
              </div>
              <Link href={`/presentaciones/${pres.id}`} passHref>
                <Button className="w-full group">
                  Ver Presentación
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
