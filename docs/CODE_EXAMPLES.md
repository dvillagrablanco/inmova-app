# 💻 Ejemplos de Código - API de Inmova

**Fecha**: 3 de enero de 2026  
**Versión**: 1.0

---

## 📋 Tabla de Contenidos

1. [cURL](#curl)
2. [JavaScript/Node.js](#javascriptnodejs)
3. [Python](#python)
4. [PHP](#php)
5. [Ruby](#ruby)
6. [Go](#go)
7. [Java](#java)
8. [C#/.NET](#cnet)

---

## 🔧 cURL

### Listar propiedades

```bash
curl https://inmovaapp.com/api/v1/properties \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

### Crear propiedad

```bash
curl -X POST https://inmovaapp.com/api/v1/properties \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "Calle Gran Vía 45",
    "city": "Madrid",
    "price": 1200,
    "rooms": 3,
    "bathrooms": 2,
    "squareMeters": 85.5,
    "type": "APARTMENT",
    "status": "AVAILABLE"
  }'
```

### Actualizar propiedad

```bash
curl -X PUT https://inmovaapp.com/api/v1/properties/clxy123abc \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 1250,
    "status": "RENTED"
  }'
```

### Eliminar propiedad

```bash
curl -X DELETE https://inmovaapp.com/api/v1/properties/clxy123abc \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

### Crear webhook

```bash
curl -X POST https://inmovaapp.com/api/v1/webhooks \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/inmova",
    "events": ["PROPERTY_CREATED", "CONTRACT_SIGNED"],
    "maxRetries": 3
  }'
```

---

## 🟨 JavaScript/Node.js

### Setup

```bash
npm install axios dotenv
```

### Cliente completo

```javascript
// inmova-client.js
const axios = require('axios');
require('dotenv').config();

class InmovaClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://inmovaapp.com/api/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Properties
  async listProperties(params = {}) {
    try {
      const response = await this.client.get('/properties', { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getProperty(id) {
    try {
      const response = await this.client.get(`/properties/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createProperty(data) {
    try {
      const response = await this.client.post('/properties', data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateProperty(id, data) {
    try {
      const response = await this.client.put(`/properties/${id}`, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteProperty(id) {
    try {
      const response = await this.client.delete(`/properties/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Webhooks
  async createWebhook(data) {
    try {
      const response = await this.client.post('/webhooks', data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listWebhooks() {
    try {
      const response = await this.client.get('/webhooks');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Error handling
  handleError(error) {
    if (error.response) {
      // Error de la API
      const { status, data } = error.response;
      console.error(`API Error (${status}):`, data);
      
      if (status === 401) {
        throw new Error('Invalid API key');
      } else if (status === 403) {
        throw new Error('Insufficient permissions');
      } else if (status === 429) {
        throw new Error('Rate limit exceeded');
      }
      
      throw new Error(data.error || 'API request failed');
    } else if (error.request) {
      // Error de red
      throw new Error('Network error - no response received');
    } else {
      throw error;
    }
  }
}

module.exports = InmovaClient;
```

### Uso del cliente

```javascript
// index.js
const InmovaClient = require('./inmova-client');

const client = new InmovaClient(process.env.INMOVA_API_KEY);

async function main() {
  try {
    // Listar propiedades
    const properties = await client.listProperties({
      page: 1,
      limit: 20,
      city: 'Madrid',
      status: 'AVAILABLE',
    });
    console.log('Properties:', properties);

    // Crear propiedad
    const newProperty = await client.createProperty({
      address: 'Calle Gran Vía 45',
      city: 'Madrid',
      price: 1200,
      rooms: 3,
      bathrooms: 2,
      squareMeters: 85.5,
      type: 'APARTMENT',
      status: 'AVAILABLE',
    });
    console.log('Created:', newProperty);

    // Actualizar propiedad
    const updated = await client.updateProperty(newProperty.data.id, {
      price: 1250,
      status: 'RENTED',
    });
    console.log('Updated:', updated);

    // Crear webhook
    const webhook = await client.createWebhook({
      url: 'https://your-app.com/webhooks/inmova',
      events: ['PROPERTY_CREATED', 'CONTRACT_SIGNED'],
      maxRetries: 3,
    });
    console.log('Webhook created:', webhook);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

### Servidor de webhooks (Express)

```javascript
// webhook-server.js
const express = require('express');
const crypto = require('crypto');

const app = express();

// Middleware para verificar firma
function verifyInmovaWebhook(req, res, next) {
  const signature = req.headers['x-inmova-signature'];
  const secret = process.env.INMOVA_WEBHOOK_SECRET;
  
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(req.body));
  const expectedSignature = 'sha256=' + hmac.digest('hex');
  
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
}

app.use(express.json());

app.post('/webhooks/inmova', verifyInmovaWebhook, (req, res) => {
  // Responder inmediatamente
  res.status(200).send('OK');
  
  // Procesar evento
  const { event, data } = req.body;
  
  console.log(`Received ${event}:`, data);
  
  // Dispatch por tipo de evento
  switch(event) {
    case 'PROPERTY_CREATED':
      handlePropertyCreated(data);
      break;
    case 'CONTRACT_SIGNED':
      handleContractSigned(data);
      break;
    case 'PAYMENT_RECEIVED':
      handlePaymentReceived(data);
      break;
    default:
      console.log('Unknown event:', event);
  }
});

function handlePropertyCreated(data) {
  console.log('New property:', data.address);
  // Tu lógica aquí
}

function handleContractSigned(data) {
  console.log('Contract signed:', data.id);
  // Tu lógica aquí
}

function handlePaymentReceived(data) {
  console.log('Payment received:', data.amount);
  // Tu lógica aquí
}

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
```

---

## 🐍 Python

### Setup

```bash
pip install requests python-dotenv
```

### Cliente completo

```python
# inmova_client.py
import requests
import os
from dotenv import load_dotenv

load_dotenv()

class InmovaClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = 'https://inmovaapp.com/api/v1'
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        })
    
    # Properties
    def list_properties(self, **params):
        response = self.session.get(f'{self.base_url}/properties', params=params)
        return self._handle_response(response)
    
    def get_property(self, property_id):
        response = self.session.get(f'{self.base_url}/properties/{property_id}')
        return self._handle_response(response)
    
    def create_property(self, data):
        response = self.session.post(f'{self.base_url}/properties', json=data)
        return self._handle_response(response)
    
    def update_property(self, property_id, data):
        response = self.session.put(f'{self.base_url}/properties/{property_id}', json=data)
        return self._handle_response(response)
    
    def delete_property(self, property_id):
        response = self.session.delete(f'{self.base_url}/properties/{property_id}')
        return self._handle_response(response)
    
    # Webhooks
    def create_webhook(self, data):
        response = self.session.post(f'{self.base_url}/webhooks', json=data)
        return self._handle_response(response)
    
    def list_webhooks(self):
        response = self.session.get(f'{self.base_url}/webhooks')
        return self._handle_response(response)
    
    # Error handling
    def _handle_response(self, response):
        if response.status_code == 200 or response.status_code == 201:
            return response.json()
        elif response.status_code == 401:
            raise Exception('Invalid API key')
        elif response.status_code == 403:
            raise Exception('Insufficient permissions')
        elif response.status_code == 429:
            raise Exception('Rate limit exceeded')
        else:
            error_data = response.json()
            raise Exception(error_data.get('error', 'API request failed'))

if __name__ == '__main__':
    client = InmovaClient(os.getenv('INMOVA_API_KEY'))
    
    # Listar propiedades
    properties = client.list_properties(city='Madrid', status='AVAILABLE')
    print('Properties:', properties)
    
    # Crear propiedad
    new_property = client.create_property({
        'address': 'Calle Gran Vía 45',
        'city': 'Madrid',
        'price': 1200,
        'rooms': 3,
        'bathrooms': 2,
        'squareMeters': 85.5,
        'type': 'APARTMENT',
        'status': 'AVAILABLE'
    })
    print('Created:', new_property)
```

### Servidor de webhooks (Flask)

```python
# webhook_server.py
from flask import Flask, request, jsonify
import hmac
import hashlib
import os

app = Flask(__name__)

def verify_webhook_signature(payload, signature, secret):
    expected_signature = 'sha256=' + hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected_signature)

@app.route('/webhooks/inmova', methods=['POST'])
def inmova_webhook():
    signature = request.headers.get('X-Inmova-Signature')
    secret = os.environ['INMOVA_WEBHOOK_SECRET']
    
    if not signature:
        return jsonify({'error': 'Missing signature'}), 401
    
    payload = request.get_data(as_text=True)
    
    if not verify_webhook_signature(payload, signature, secret):
        return jsonify({'error': 'Invalid signature'}), 401
    
    data = request.json
    event = data['event']
    event_data = data['data']
    
    print(f'Received {event}:', event_data)
    
    # Dispatch por tipo de evento
    if event == 'PROPERTY_CREATED':
        handle_property_created(event_data)
    elif event == 'CONTRACT_SIGNED':
        handle_contract_signed(event_data)
    elif event == 'PAYMENT_RECEIVED':
        handle_payment_received(event_data)
    
    return 'OK', 200

def handle_property_created(data):
    print(f"New property: {data['address']}")
    # Tu lógica aquí

def handle_contract_signed(data):
    print(f"Contract signed: {data['id']}")
    # Tu lógica aquí

def handle_payment_received(data):
    print(f"Payment received: {data['amount']}")
    # Tu lógica aquí

if __name__ == '__main__':
    app.run(port=3000)
```

---

## 🐘 PHP

### Cliente completo

```php
<?php
// InmovaClient.php

class InmovaClient {
    private $apiKey;
    private $baseURL = 'https://inmovaapp.com/api/v1';
    
    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }
    
    // Properties
    public function listProperties($params = []) {
        return $this->request('GET', '/properties', $params);
    }
    
    public function getProperty($id) {
        return $this->request('GET', "/properties/$id");
    }
    
    public function createProperty($data) {
        return $this->request('POST', '/properties', [], $data);
    }
    
    public function updateProperty($id, $data) {
        return $this->request('PUT', "/properties/$id", [], $data);
    }
    
    public function deleteProperty($id) {
        return $this->request('DELETE', "/properties/$id");
    }
    
    // Webhooks
    public function createWebhook($data) {
        return $this->request('POST', '/webhooks', [], $data);
    }
    
    public function listWebhooks() {
        return $this->request('GET', '/webhooks');
    }
    
    // HTTP request handler
    private function request($method, $endpoint, $params = [], $data = null) {
        $url = $this->baseURL . $endpoint;
        
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }
        
        $ch = curl_init($url);
        
        $headers = [
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json'
        ];
        
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        
        if ($data !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $result = json_decode($response, true);
        
        if ($httpCode >= 400) {
            throw new Exception($result['error'] ?? 'API request failed');
        }
        
        return $result;
    }
}

// Uso
$client = new InmovaClient(getenv('INMOVA_API_KEY'));

// Listar propiedades
$properties = $client->listProperties(['city' => 'Madrid', 'status' => 'AVAILABLE']);
print_r($properties);

// Crear propiedad
$newProperty = $client->createProperty([
    'address' => 'Calle Gran Vía 45',
    'city' => 'Madrid',
    'price' => 1200,
    'rooms' => 3,
    'bathrooms' => 2,
    'squareMeters' => 85.5,
    'type' => 'APARTMENT',
    'status' => 'AVAILABLE'
]);
print_r($newProperty);
```

### Servidor de webhooks

```php
<?php
// webhook.php

function verifyWebhookSignature($payload, $signature, $secret) {
    $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);
    return hash_equals($expected, $signature);
}

$signature = $_SERVER['HTTP_X_INMOVA_SIGNATURE'] ?? null;
$secret = getenv('INMOVA_WEBHOOK_SECRET');
$payload = file_get_contents('php://input');

if (!$signature || !verifyWebhookSignature($payload, $signature, $secret)) {
    http_response_code(401);
    exit('Invalid signature');
}

$data = json_decode($payload, true);
$event = $data['event'];
$eventData = $data['data'];

error_log("Received $event: " . json_encode($eventData));

// Dispatch por tipo de evento
switch($event) {
    case 'PROPERTY_CREATED':
        handlePropertyCreated($eventData);
        break;
    case 'CONTRACT_SIGNED':
        handleContractSigned($eventData);
        break;
    case 'PAYMENT_RECEIVED':
        handlePaymentReceived($eventData);
        break;
}

http_response_code(200);
echo 'OK';

function handlePropertyCreated($data) {
    error_log("New property: " . $data['address']);
    // Tu lógica aquí
}

function handleContractSigned($data) {
    error_log("Contract signed: " . $data['id']);
    // Tu lógica aquí
}

function handlePaymentReceived($data) {
    error_log("Payment received: " . $data['amount']);
    // Tu lógica aquí
}
```

---

## 💎 Ruby

### Setup

```bash
gem install http dotenv
```

### Cliente completo

```ruby
# inmova_client.rb
require 'http'
require 'json'
require 'dotenv/load'

class InmovaClient
  def initialize(api_key)
    @api_key = api_key
    @base_url = 'https://inmovaapp.com/api/v1'
    @http = HTTP.headers(
      'Authorization' => "Bearer #{@api_key}",
      'Content-Type' => 'application/json'
    )
  end
  
  # Properties
  def list_properties(**params)
    request(:get, '/properties', params: params)
  end
  
  def get_property(id)
    request(:get, "/properties/#{id}")
  end
  
  def create_property(data)
    request(:post, '/properties', json: data)
  end
  
  def update_property(id, data)
    request(:put, "/properties/#{id}", json: data)
  end
  
  def delete_property(id)
    request(:delete, "/properties/#{id}")
  end
  
  # Webhooks
  def create_webhook(data)
    request(:post, '/webhooks', json: data)
  end
  
  def list_webhooks
    request(:get, '/webhooks')
  end
  
  private
  
  def request(method, endpoint, **options)
    url = "#{@base_url}#{endpoint}"
    response = @http.request(method, url, options)
    
    if response.status.success?
      JSON.parse(response.body.to_s)
    else
      raise "API Error (#{response.status}): #{response.body}"
    end
  end
end

# Uso
client = InmovaClient.new(ENV['INMOVA_API_KEY'])

# Listar propiedades
properties = client.list_properties(city: 'Madrid', status: 'AVAILABLE')
puts properties

# Crear propiedad
new_property = client.create_property({
  address: 'Calle Gran Vía 45',
  city: 'Madrid',
  price: 1200,
  rooms: 3,
  bathrooms: 2,
  squareMeters: 85.5,
  type: 'APARTMENT',
  status: 'AVAILABLE'
})
puts new_property
```

---

## 🔵 Go

### Cliente completo

```go
// inmova_client.go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

type InmovaClient struct {
    APIKey  string
    BaseURL string
    Client  *http.Client
}

func NewInmovaClient(apiKey string) *InmovaClient {
    return &InmovaClient{
        APIKey:  apiKey,
        BaseURL: "https://inmovaapp.com/api/v1",
        Client:  &http.Client{},
    }
}

func (c *InmovaClient) request(method, endpoint string, body interface{}) (map[string]interface{}, error) {
    url := c.BaseURL + endpoint
    
    var reqBody io.Reader
    if body != nil {
        jsonData, err := json.Marshal(body)
        if err != nil {
            return nil, err
        }
        reqBody = bytes.NewBuffer(jsonData)
    }
    
    req, err := http.NewRequest(method, url, reqBody)
    if err != nil {
        return nil, err
    }
    
    req.Header.Set("Authorization", "Bearer "+c.APIKey)
    req.Header.Set("Content-Type", "application/json")
    
    resp, err := c.Client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var result map[string]interface{}
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    
    if resp.StatusCode >= 400 {
        return nil, fmt.Errorf("API Error (%d): %v", resp.StatusCode, result["error"])
    }
    
    return result, nil
}

func (c *InmovaClient) ListProperties() (map[string]interface{}, error) {
    return c.request("GET", "/properties", nil)
}

func (c *InmovaClient) CreateProperty(data map[string]interface{}) (map[string]interface{}, error) {
    return c.request("POST", "/properties", data)
}

func main() {
    client := NewInmovaClient(os.Getenv("INMOVA_API_KEY"))
    
    // Listar propiedades
    properties, err := client.ListProperties()
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println("Properties:", properties)
    
    // Crear propiedad
    newProperty, err := client.CreateProperty(map[string]interface{}{
        "address": "Calle Gran Vía 45",
        "city": "Madrid",
        "price": 1200,
        "rooms": 3,
        "bathrooms": 2,
        "squareMeters": 85.5,
        "type": "APARTMENT",
        "status": "AVAILABLE",
    })
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println("Created:", newProperty)
}
```

---

## ☕ Java

### Setup (Maven)

```xml
<dependency>
    <groupId>com.squareup.okhttp3</groupId>
    <artifactId>okhttp</artifactId>
    <version>4.12.0</version>
</dependency>
<dependency>
    <groupId>com.google.code.gson</groupId>
    <artifactId>gson</artifactId>
    <version>2.10.1</version>
</dependency>
```

### Cliente completo

```java
// InmovaClient.java
import okhttp3.*;
import com.google.gson.Gson;
import java.io.IOException;
import java.util.Map;

public class InmovaClient {
    private final String apiKey;
    private final String baseURL = "https://inmovaapp.com/api/v1";
    private final OkHttpClient client;
    private final Gson gson;
    
    public InmovaClient(String apiKey) {
        this.apiKey = apiKey;
        this.client = new OkHttpClient();
        this.gson = new Gson();
    }
    
    private Map<String, Object> request(String method, String endpoint, Map<String, Object> data) throws IOException {
        String url = baseURL + endpoint;
        
        Request.Builder requestBuilder = new Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer " + apiKey)
            .addHeader("Content-Type", "application/json");
        
        if (data != null) {
            String json = gson.toJson(data);
            RequestBody body = RequestBody.create(json, MediaType.parse("application/json"));
            requestBuilder.method(method, body);
        } else {
            requestBuilder.method(method, null);
        }
        
        try (Response response = client.newCall(requestBuilder.build()).execute()) {
            String responseBody = response.body().string();
            return gson.fromJson(responseBody, Map.class);
        }
    }
    
    public Map<String, Object> listProperties() throws IOException {
        return request("GET", "/properties", null);
    }
    
    public Map<String, Object> createProperty(Map<String, Object> data) throws IOException {
        return request("POST", "/properties", data);
    }
    
    public static void main(String[] args) {
        String apiKey = System.getenv("INMOVA_API_KEY");
        InmovaClient client = new InmovaClient(apiKey);
        
        try {
            // Listar propiedades
            Map<String, Object> properties = client.listProperties();
            System.out.println("Properties: " + properties);
            
            // Crear propiedad
            Map<String, Object> propertyData = Map.of(
                "address", "Calle Gran Vía 45",
                "city", "Madrid",
                "price", 1200,
                "rooms", 3,
                "bathrooms", 2,
                "squareMeters", 85.5,
                "type", "APARTMENT",
                "status", "AVAILABLE"
            );
            Map<String, Object> newProperty = client.createProperty(propertyData);
            System.out.println("Created: " + newProperty);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

---

## 🔷 C#/.NET

### Setup (NuGet)

```bash
dotnet add package RestSharp
dotnet add package Newtonsoft.Json
```

### Cliente completo

```csharp
// InmovaClient.cs
using System;
using System.Collections.Generic;
using RestSharp;
using Newtonsoft.Json;

public class InmovaClient
{
    private readonly string apiKey;
    private readonly string baseURL = "https://inmovaapp.com/api/v1";
    private readonly RestClient client;
    
    public InmovaClient(string apiKey)
    {
        this.apiKey = apiKey;
        this.client = new RestClient(baseURL);
    }
    
    private RestRequest CreateRequest(string endpoint, Method method)
    {
        var request = new RestRequest(endpoint, method);
        request.AddHeader("Authorization", $"Bearer {apiKey}");
        request.AddHeader("Content-Type", "application/json");
        return request;
    }
    
    public Dictionary<string, object> ListProperties()
    {
        var request = CreateRequest("/properties", Method.Get);
        var response = client.Execute(request);
        return JsonConvert.DeserializeObject<Dictionary<string, object>>(response.Content);
    }
    
    public Dictionary<string, object> CreateProperty(Dictionary<string, object> data)
    {
        var request = CreateRequest("/properties", Method.Post);
        request.AddJsonBody(data);
        var response = client.Execute(request);
        return JsonConvert.DeserializeObject<Dictionary<string, object>>(response.Content);
    }
    
    static void Main(string[] args)
    {
        var apiKey = Environment.GetEnvironmentVariable("INMOVA_API_KEY");
        var client = new InmovaClient(apiKey);
        
        // Listar propiedades
        var properties = client.ListProperties();
        Console.WriteLine($"Properties: {JsonConvert.SerializeObject(properties)}");
        
        // Crear propiedad
        var propertyData = new Dictionary<string, object>
        {
            ["address"] = "Calle Gran Vía 45",
            ["city"] = "Madrid",
            ["price"] = 1200,
            ["rooms"] = 3,
            ["bathrooms"] = 2,
            ["squareMeters"] = 85.5,
            ["type"] = "APARTMENT",
            ["status"] = "AVAILABLE"
        };
        var newProperty = client.CreateProperty(propertyData);
        Console.WriteLine($"Created: {JsonConvert.SerializeObject(newProperty)}");
    }
}
```

---

## 📚 Recursos adicionales

- [Quick Start API](./API_QUICK_START.md)
- [Webhook Guide](./WEBHOOK_GUIDE.md)
- [API Reference](https://inmovaapp.com/docs)

---

## 🆘 Soporte

- **Email**: support@inmovaapp.com
- **Discord**: https://discord.gg/inmova
- **GitHub**: https://github.com/inmova/sdk

---

**Última actualización**: 3 de enero de 2026  
**Versión**: 1.0.0
