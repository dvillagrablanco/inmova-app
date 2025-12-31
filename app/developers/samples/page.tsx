import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function CodeSamplesPage() {
  const samples = [
    {
      id: 'list-properties',
      title: 'Listar Propiedades',
      description: 'Obtener lista de propiedades con filtros',
      category: 'properties',
      difficulty: 'beginner',
      javascript: `import { InmovaClient } from '@inmova/sdk';

const client = new InmovaClient({
  apiKey: 'sk_live_your_key_here',
});

async function listProperties() {
  const result = await client.properties.list({
    city: 'Madrid',
    status: 'AVAILABLE',
    minPrice: 1000,
    maxPrice: 2000,
    rooms: 3,
    limit: 20,
    page: 1,
  });

  console.log(\`Found \${result.pagination.total} properties\`);
  
  result.data.forEach(property => {
    console.log(\`- \${property.address}: €\${property.price}/mes\`);
  });
}

listProperties();`,
      python: `from inmova import InmovaClient

client = InmovaClient(api_key="sk_live_your_key_here")

def list_properties():
    result = client.properties.list(
        city="Madrid",
        status="AVAILABLE",
        min_price=1000,
        max_price=2000,
        rooms=3,
        limit=20,
        page=1
    )
    
    print(f"Found {result.pagination.total} properties")
    
    for property in result.data:
        print(f"- {property.address}: €{property.price}/mes")

list_properties()`,
      php: `use Inmova\\InmovaClient;

$client = new InmovaClient('sk_live_your_key_here');

function listProperties($client) {
    $result = $client->properties->list([
        'city' => 'Madrid',
        'status' => 'AVAILABLE',
        'minPrice' => 1000,
        'maxPrice' => 2000,
        'rooms' => 3,
        'limit' => 20,
        'page' => 1,
    ]);
    
    echo "Found " . $result['pagination']['total'] . " properties\\n";
    
    foreach ($result['data'] as $property) {
        echo "- {$property['address']}: €{$property['price']}/mes\\n";
    }
}

listProperties($client);`,
    },
    {
      id: 'create-property',
      title: 'Crear Propiedad',
      description: 'Publicar una nueva propiedad',
      category: 'properties',
      difficulty: 'beginner',
      javascript: `const property = await client.properties.create({
  address: 'Calle Gran Vía 28',
  city: 'Madrid',
  postalCode: '28013',
  country: 'ES',
  price: 1500,
  type: 'APARTMENT',
  status: 'AVAILABLE',
  rooms: 3,
  bathrooms: 2,
  squareMeters: 120,
  floor: 4,
  description: 'Piso luminoso en pleno centro de Madrid',
  features: {
    hasElevator: true,
    hasParking: false,
    hasGarden: false,
    hasPool: false,
    hasBalcony: true,
  },
});

console.log(\`Property created: \${property.id}\`);`,
      python: `property = client.properties.create(
    address="Calle Gran Vía 28",
    city="Madrid",
    postal_code="28013",
    country="ES",
    price=1500,
    type="APARTMENT",
    status="AVAILABLE",
    rooms=3,
    bathrooms=2,
    square_meters=120,
    floor=4,
    description="Piso luminoso en pleno centro de Madrid",
)

print(f"Property created: {property.id}")`,
      php: `$property = $client->properties->create([
    'address' => 'Calle Gran Vía 28',
    'city' => 'Madrid',
    'postalCode' => '28013',
    'country' => 'ES',
    'price' => 1500,
    'type' => 'APARTMENT',
    'status' => 'AVAILABLE',
    'rooms' => 3,
    'bathrooms' => 2,
    'squareMeters' => 120,
    'floor' => 4,
    'description' => 'Piso luminoso en pleno centro de Madrid',
]);

echo "Property created: {$property['id']}\\n";`,
    },
    {
      id: 'webhook-handler',
      title: 'Webhook Handler',
      description: 'Procesar eventos de webhooks',
      category: 'webhooks',
      difficulty: 'intermediate',
      javascript: `import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.raw({ type: 'application/json' }));

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-inmova-signature'];
  const payload = req.body.toString();
  const secret = process.env.WEBHOOK_SECRET;

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(payload);

  switch (event.type) {
    case 'PROPERTY_CREATED':
      console.log('New property:', event.data);
      // Send notification, update database, etc.
      break;

    case 'CONTRACT_SIGNED':
      console.log('Contract signed:', event.data);
      // Generate invoice, send welcome email, etc.
      break;

    case 'PAYMENT_RECEIVED':
      console.log('Payment received:', event.data);
      // Update accounting, send receipt, etc.
      break;
  }

  res.status(200).send('OK');
});

app.listen(3000);`,
      python: `from flask import Flask, request
import hashlib
import hmac
import json

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Inmova-Signature')
    payload = request.get_data(as_text=True)
    secret = "your_webhook_secret"
    
    # Verify signature
    expected_signature = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    if signature != expected_signature:
        return "Invalid signature", 401
    
    event = json.loads(payload)
    
    if event['type'] == 'PROPERTY_CREATED':
        print(f"New property: {event['data']}")
    elif event['type'] == 'CONTRACT_SIGNED':
        print(f"Contract signed: {event['data']}")
    elif event['type'] == 'PAYMENT_RECEIVED':
        print(f"Payment received: {event['data']}")
    
    return "OK", 200

app.run(port=3000)`,
      php: `<?php
// webhook.php
$signature = $_SERVER['HTTP_X_INMOVA_SIGNATURE'] ?? '';
$payload = file_get_contents('php://input');
$secret = getenv('WEBHOOK_SECRET');

// Verify signature
$expectedSignature = hash_hmac('sha256', $payload, $secret);

if ($signature !== $expectedSignature) {
    http_response_code(401);
    exit('Invalid signature');
}

$event = json_decode($payload, true);

switch ($event['type']) {
    case 'PROPERTY_CREATED':
        error_log('New property: ' . print_r($event['data'], true));
        break;
    case 'CONTRACT_SIGNED':
        error_log('Contract signed: ' . print_r($event['data'], true));
        break;
    case 'PAYMENT_RECEIVED':
        error_log('Payment received: ' . print_r($event['data'], true));
        break;
}

http_response_code(200);
echo 'OK';`,
    },
    {
      id: 'bulk-update',
      title: 'Actualización Masiva',
      description: 'Actualizar múltiples propiedades en lote',
      category: 'properties',
      difficulty: 'intermediate',
      javascript: `async function bulkUpdatePrices(cityName, increasePercent) {
  let page = 1;
  let totalUpdated = 0;

  while (true) {
    const result = await client.properties.list({
      city: cityName,
      status: 'AVAILABLE',
      limit: 100,
      page,
    });

    if (result.data.length === 0) break;

    for (const property of result.data) {
      const newPrice = Math.round(property.price * (1 + increasePercent / 100));
      
      await client.properties.update(property.id, {
        price: newPrice,
      });

      console.log(\`Updated \${property.address}: €\${property.price} → €\${newPrice}\`);
      totalUpdated++;
    }

    if (page >= result.pagination.pages) break;
    page++;
  }

  console.log(\`\\nTotal updated: \${totalUpdated} properties\`);
}

bulkUpdatePrices('Madrid', 5); // Increase 5%`,
      python: `def bulk_update_prices(city_name, increase_percent):
    page = 1
    total_updated = 0
    
    while True:
        result = client.properties.list(
            city=city_name,
            status="AVAILABLE",
            limit=100,
            page=page
        )
        
        if not result.data:
            break
        
        for property in result.data:
            new_price = round(property.price * (1 + increase_percent / 100))
            
            client.properties.update(
                property.id,
                price=new_price
            )
            
            print(f"Updated {property.address}: €{property.price} → €{new_price}")
            total_updated += 1
        
        if page >= result.pagination.pages:
            break
        page += 1
    
    print(f"\\nTotal updated: {total_updated} properties")

bulk_update_prices('Madrid', 5)  # Increase 5%`,
      php: `function bulkUpdatePrices($client, $cityName, $increasePercent) {
    $page = 1;
    $totalUpdated = 0;
    
    while (true) {
        $result = $client->properties->list([
            'city' => $cityName,
            'status' => 'AVAILABLE',
            'limit' => 100,
            'page' => $page,
        ]);
        
        if (empty($result['data'])) break;
        
        foreach ($result['data'] as $property) {
            $newPrice = round($property['price'] * (1 + $increasePercent / 100));
            
            $client->properties->update($property['id'], [
                'price' => $newPrice,
            ]);
            
            echo "Updated {$property['address']}: €{$property['price']} → €{$newPrice}\\n";
            $totalUpdated++;
        }
        
        if ($page >= $result['pagination']['pages']) break;
        $page++;
    }
    
    echo "\\nTotal updated: {$totalUpdated} properties\\n";
}

bulkUpdatePrices($client, 'Madrid', 5); // Increase 5%`,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Code Samples</h1>
        <p className="text-gray-600 text-lg">
          Ejemplos listos para copiar y pegar. Todos los ejemplos están probados y funcionan con la
          última versión de la API.
        </p>
      </div>

      <div className="space-y-8">
        {samples.map((sample) => (
          <Card key={sample.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{sample.title}</CardTitle>
                  <CardDescription className="text-base mt-2">{sample.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={sample.difficulty === 'beginner' ? 'default' : 'secondary'}>
                    {sample.difficulty === 'beginner' ? 'Principiante' : 'Intermedio'}
                  </Badge>
                  <Badge variant="outline">{sample.category}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="javascript">
                <TabsList className="w-full">
                  <TabsTrigger value="javascript" className="flex-1">
                    JavaScript
                  </TabsTrigger>
                  <TabsTrigger value="python" className="flex-1">
                    Python
                  </TabsTrigger>
                  <TabsTrigger value="php" className="flex-1">
                    PHP
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="javascript">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{sample.javascript}</code>
                  </pre>
                </TabsContent>

                <TabsContent value="python">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{sample.python}</code>
                  </pre>
                </TabsContent>

                <TabsContent value="php">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{sample.php}</code>
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-2">¿Necesitas más ejemplos?</h3>
        <p className="text-gray-600 mb-4">
          Consulta la{' '}
          <a href="/api-docs" className="text-blue-600 hover:underline">
            documentación completa de la API
          </a>{' '}
          o únete a nuestra comunidad de desarrolladores.
        </p>
      </div>
    </div>
  );
}
