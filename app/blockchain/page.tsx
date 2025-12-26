'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Link as LinkIcon,
  Coins,
  Users,
  FileText,
  TrendingUp,
  Shield,
  Wallet,
  ArrowUpDown,
  Info,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from '@/components/ui/lazy-charts-extended';

const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981'];

export default function BlockchainPage() {
  const router = useRouter();
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  const tokenizedProperties = [
    {
      id: 'p1',
      name: 'Edificio Centro - C/ Mayor 45',
      totalValue: 2500000,
      tokenized: 1500000,
      tokensIssued: 15000,
      tokenPrice: 100,
      investors: 234,
      annualYield: 6.5,
      status: 'active',
    },
    {
      id: 'p2',
      name: 'Apartamentos Playa Mar',
      totalValue: 1800000,
      tokenized: 1800000,
      tokensIssued: 18000,
      tokenPrice: 100,
      investors: 187,
      annualYield: 7.2,
      status: 'active',
    },
    {
      id: 'p3',
      name: 'Oficinas Business Park',
      totalValue: 3500000,
      tokenized: 0,
      tokensIssued: 0,
      tokenPrice: 100,
      investors: 0,
      annualYield: 0,
      status: 'pending',
    },
  ];

  const smartContracts = [
    {
      id: 'sc1',
      name: 'Distribución Automática de Rentas',
      description: 'Reparto mensual de rentas a holders de tokens',
      propertyId: 'p1',
      status: 'active',
      lastExecution: '2025-12-01',
      totalDistributed: 45000,
    },
    {
      id: 'sc2',
      name: 'Venta Fraccionada',
      description: 'Permite compra/venta de tokens en marketplace',
      propertyId: 'p1',
      status: 'active',
      lastExecution: '2025-12-25',
      totalDistributed: 0,
    },
    {
      id: 'sc3',
      name: 'Votación Gobernanza',
      description: 'Sistema de votación para decisiones sobre la propiedad',
      propertyId: 'p2',
      status: 'active',
      lastExecution: '2025-12-15',
      totalDistributed: 0,
    },
  ];

  const transactions = [
    {
      id: 'tx1',
      type: 'purchase',
      from: '0x1234...5678',
      to: '0xabcd...efgh',
      amount: 50,
      value: 5000,
      timestamp: '2025-12-25 10:30',
      hash: '0x9876...4321',
    },
    {
      id: 'tx2',
      type: 'distribution',
      from: 'Smart Contract',
      to: '0x2345...6789',
      amount: 0,
      value: 125,
      timestamp: '2025-12-01 00:00',
      hash: '0x8765...3210',
    },
  ];

  const totalValue = tokenizedProperties.reduce((sum, p) => sum + p.tokenized, 0);
  const totalInvestors = tokenizedProperties.reduce((sum, p) => sum + p.investors, 0);
  const avgYield =
    tokenizedProperties.length > 0
      ? tokenizedProperties.reduce((sum, p) => sum + p.annualYield, 0) / tokenizedProperties.length
      : 0;

  const distributionData = tokenizedProperties
    .filter((p) => p.tokenized > 0)
    .map((p) => ({
      name: p.name,
      value: p.tokenized,
    }));

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Blockchain & Tokenización
            </h1>
            <p className="text-muted-foreground mt-2">
              Inversión fraccionada y gestión descentralizada de propiedades
            </p>
          </div>
          <Button onClick={() => router.push('/blockchain/tokenizar')}>
            <Coins className="h-4 w-4 mr-2" />
            Tokenizar Propiedad
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Valor Tokenizado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{(totalValue / 1000000).toFixed(1)}M</div>
              <p className="text-xs text-muted-foreground mt-1">
                {tokenizedProperties.filter((p) => p.status === 'active').length} propiedades
                activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Inversores Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvestors}</div>
              <p className="text-xs text-muted-foreground mt-1">Holders activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Rentabilidad Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{avgYield.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Anual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Smart Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {smartContracts.filter((sc) => sc.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Activos</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="properties" className="space-y-4">
          <TabsList>
            <TabsTrigger value="properties">Propiedades Tokenizadas</TabsTrigger>
            <TabsTrigger value="contracts">Smart Contracts</TabsTrigger>
            <TabsTrigger value="transactions">Transacciones</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tokenizedProperties.map((property) => (
                <Card key={property.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{property.name}</CardTitle>
                        <CardDescription className="mt-2">
                          Valor total: €{property.totalValue.toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge
                        className={property.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}
                      >
                        {property.status === 'active' ? 'Activo' : 'Pendiente'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {property.status === 'active' ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Tokenizado</p>
                            <p className="text-lg font-bold">
                              {((property.tokenized / property.totalValue) * 100).toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              €{property.tokenized.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Tokens</p>
                            <p className="text-lg font-bold">
                              {property.tokensIssued.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              €{property.tokenPrice}/token
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Inversores</p>
                            <p className="text-lg font-bold">{property.investors}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Rentabilidad</p>
                            <p className="text-lg font-bold text-green-600">
                              {property.annualYield}%
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => router.push(`/blockchain/propiedades/${property.id}`)}
                            >
                              <LinkIcon className="h-3 w-3 mr-1" />
                              Ver en Blockchain
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() =>
                                router.push(`/blockchain/marketplace?property=${property.id}`)
                              }
                            >
                              <Wallet className="h-3 w-3 mr-1" />
                              Comprar Tokens
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground mb-4">
                          Propiedad pendiente de tokenización
                        </p>
                        <Button
                          onClick={() =>
                            router.push(`/blockchain/tokenizar?property=${property.id}`)
                          }
                        >
                          Iniciar Tokenización
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Distribución del Capital Tokenizado</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: €${(entry.value / 1000000).toFixed(1)}M`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `€${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Smart Contracts Activos</CardTitle>
                <CardDescription>
                  Contratos inteligentes automatizando la gestión de propiedades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {smartContracts.map((contract) => (
                    <div key={contract.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{contract.name}</h4>
                          <Badge className="bg-green-500">{contract.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{contract.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {contract.lastExecution && (
                            <div>
                              <span className="text-muted-foreground">Última ejecución:</span>{' '}
                              <span className="font-medium">{contract.lastExecution}</span>
                            </div>
                          )}
                          {contract.totalDistributed > 0 && (
                            <div>
                              <span className="text-muted-foreground">Total distribuido:</span>{' '}
                              <span className="font-medium">
                                €{contract.totalDistributed.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        Ver Contrato
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-2">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-900">Tecnología Blockchain</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Todos los contratos están desplegados en Polygon (MATIC) para costes de gas
                        reducidos
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Transacciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div
                        className={`p-2 rounded-lg ${
                          tx.type === 'purchase' ? 'bg-blue-100' : 'bg-green-100'
                        }`}
                      >
                        {tx.type === 'purchase' ? (
                          <ArrowUpDown className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Coins className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={tx.type === 'purchase' ? 'default' : 'secondary'}>
                            {tx.type === 'purchase' ? 'Compra' : 'Distribución'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{tx.timestamp}</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-muted-foreground">De:</span>{' '}
                            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                              {tx.from}
                            </code>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Para:</span>{' '}
                            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{tx.to}</code>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Hash:</span>{' '}
                            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                              {tx.hash}
                            </code>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {tx.amount > 0 && <p className="font-medium">{tx.amount} tokens</p>}
                        <p className="text-lg font-bold text-green-600">
                          €{tx.value.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Marketplace de Tokens</CardTitle>
                <CardDescription>Compra y vende tokens de propiedades tokenizadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Coins className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Marketplace Secundario</h3>
                  <p className="text-muted-foreground mb-6">
                    Próximamente: marketplace peer-to-peer para trading de tokens
                  </p>
                  <Button disabled>Acceso Anticipado</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
