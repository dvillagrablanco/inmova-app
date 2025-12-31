<?php

namespace Inmova;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class InmovaClient
{
    private $client;
    private $apiKey;
    private $baseUrl;

    public $properties;
    public $apiKeys;
    public $webhooks;

    public function __construct(array $config)
    {
        $this->apiKey = $config['apiKey'];
        $this->baseUrl = $config['baseUrl'] ?? 'https://inmovaapp.com/api/v1';

        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'timeout' => $config['timeout'] ?? 30,
            'headers' => [
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
        ]);

        $this->properties = new PropertiesResource($this);
        $this->apiKeys = new ApiKeysResource($this);
        $this->webhooks = new WebhooksResource($this);
    }

    public function request(string $method, string $endpoint, array $options = [])
    {
        try {
            $response = $this->client->request($method, $endpoint, $options);
            return json_decode($response->getBody()->getContents(), true);
        } catch (RequestException $e) {
            if ($e->hasResponse()) {
                $error = json_decode($e->getResponse()->getBody()->getContents(), true);
                throw new InmovaException(
                    $error['error'] ?? 'Unknown error',
                    $e->getResponse()->getStatusCode(),
                    $error['code'] ?? null,
                    $error['details'] ?? null
                );
            }
            throw new InmovaException($e->getMessage(), 0);
        }
    }
}

class InmovaException extends \Exception
{
    public $statusCode;
    public $code;
    public $details;

    public function __construct(string $message, int $statusCode, $code = null, $details = null)
    {
        parent::__construct($message);
        $this->statusCode = $statusCode;
        $this->code = $code;
        $this->details = $details;
    }
}

class PropertiesResource
{
    private $client;

    public function __construct(InmovaClient $client)
    {
        $this->client = $client;
    }

    public function list(array $params = []): array
    {
        return $this->client->request('GET', '/properties', ['query' => $params]);
    }

    public function get(string $id): array
    {
        $response = $this->client->request('GET', "/properties/{$id}");
        return $response['data'];
    }

    public function create(array $data): array
    {
        $response = $this->client->request('POST', '/properties', ['json' => $data]);
        return $response['data'];
    }

    public function update(string $id, array $data): array
    {
        $response = $this->client->request('PUT', "/properties/{$id}", ['json' => $data]);
        return $response['data'];
    }

    public function delete(string $id): void
    {
        $this->client->request('DELETE', "/properties/{$id}");
    }
}

class ApiKeysResource
{
    private $client;

    public function __construct(InmovaClient $client)
    {
        $this->client = $client;
    }

    public function list(): array
    {
        $response = $this->client->request('GET', '/api-keys');
        return $response['data'];
    }

    public function create(array $data): array
    {
        $response = $this->client->request('POST', '/api-keys', ['json' => $data]);
        return $response['data'];
    }

    public function revoke(string $id): void
    {
        $this->client->request('DELETE', "/api-keys/{$id}");
    }
}

class WebhooksResource
{
    private $client;

    public function __construct(InmovaClient $client)
    {
        $this->client = $client;
    }

    public function list(): array
    {
        $response = $this->client->request('GET', '/webhooks');
        return $response['data'];
    }

    public function create(array $data): array
    {
        $response = $this->client->request('POST', '/webhooks', ['json' => $data]);
        return $response['data'];
    }

    public function delete(string $id): void
    {
        $this->client->request('DELETE', "/webhooks/{$id}");
    }

    public static function verifySignature(string $payload, string $signature, string $secret): bool
    {
        $expectedSignature = hash_hmac('sha256', $payload, $secret);
        return hash_equals($signature, $expectedSignature);
    }
}
