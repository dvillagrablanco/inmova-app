import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdvancedAnalyticsProps {
  data?: any;
}

export default function AdvancedAnalytics({ data }: AdvancedAnalyticsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analíticas Avanzadas</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Analíticas disponibles próximamente</p>
      </CardContent>
    </Card>
  );
}
