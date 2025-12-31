"""Inmova API Client"""

import hmac
import hashlib
import requests
from typing import List, Optional, Dict, Any
from .types import (
    Property,
    PropertyStatus,
    PropertyType,
    ApiKey,
    WebhookSubscription,
    WebhookEventType,
    PaginatedResponse,
    Pagination,
    InmovaError,
)


class InmovaClient:
    """Inmova API Client"""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://inmovaapp.com/api/v1",
        timeout: int = 30,
        max_retries: int = 3,
    ):
        """
        Initialize Inmova client

        Args:
            api_key: Your Inmova API key
            base_url: API base URL (default: https://inmovaapp.com/api/v1)
            timeout: Request timeout in seconds (default: 30)
            max_retries: Max number of retries (default: 3)
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries

        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
        )

        # Initialize resource accessors
        self.properties = PropertiesResource(self)
        self.api_keys = ApiKeysResource(self)
        self.webhooks = WebhooksResource(self)

    def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Make HTTP request"""
        url = f"{self.base_url}{endpoint}"

        try:
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                json=json,
                timeout=self.timeout,
            )

            if response.status_code >= 400:
                error_data = response.json() if response.text else {}
                raise InmovaError(
                    error=error_data.get("error", "Unknown error"),
                    status_code=response.status_code,
                    code=error_data.get("code"),
                    details=error_data.get("details"),
                )

            return response.json() if response.text else {}

        except requests.exceptions.RequestException as e:
            raise InmovaError(
                error=f"Request failed: {str(e)}", status_code=0
            )


class PropertiesResource:
    """Properties API resource"""

    def __init__(self, client: InmovaClient):
        self.client = client

    def list(
        self,
        page: int = 1,
        limit: int = 20,
        status: Optional[PropertyStatus] = None,
        city: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        type: Optional[PropertyType] = None,
    ) -> PaginatedResponse:
        """List properties with optional filters"""
        params = {"page": page, "limit": limit}

        if status:
            params["status"] = status
        if city:
            params["city"] = city
        if min_price:
            params["minPrice"] = min_price
        if max_price:
            params["maxPrice"] = max_price
        if type:
            params["type"] = type

        response = self.client._request("GET", "/properties", params=params)

        return PaginatedResponse(
            success=response["success"],
            data=[Property(**item) for item in response["data"]],
            pagination=Pagination(**response["pagination"]),
        )

    def get(self, property_id: str) -> Property:
        """Get a single property by ID"""
        response = self.client._request("GET", f"/properties/{property_id}")
        return Property(**response["data"])

    def create(
        self,
        address: str,
        city: str,
        price: float,
        type: PropertyType,
        postal_code: Optional[str] = None,
        country: Optional[str] = None,
        rooms: Optional[int] = None,
        bathrooms: Optional[int] = None,
        square_meters: Optional[float] = None,
        floor: Optional[int] = None,
        status: Optional[PropertyStatus] = "AVAILABLE",
        description: Optional[str] = None,
        features: Optional[List[str]] = None,
    ) -> Property:
        """Create a new property"""
        data = {
            "address": address,
            "city": city,
            "price": price,
            "type": type,
            "status": status,
        }

        if postal_code:
            data["postalCode"] = postal_code
        if country:
            data["country"] = country
        if rooms:
            data["rooms"] = rooms
        if bathrooms:
            data["bathrooms"] = bathrooms
        if square_meters:
            data["squareMeters"] = square_meters
        if floor:
            data["floor"] = floor
        if description:
            data["description"] = description
        if features:
            data["features"] = features

        response = self.client._request("POST", "/properties", json=data)
        return Property(**response["data"])

    def update(self, property_id: str, **kwargs) -> Property:
        """Update an existing property"""
        response = self.client._request(
            "PUT", f"/properties/{property_id}", json=kwargs
        )
        return Property(**response["data"])

    def delete(self, property_id: str) -> None:
        """Delete a property"""
        self.client._request("DELETE", f"/properties/{property_id}")


class ApiKeysResource:
    """API Keys resource"""

    def __init__(self, client: InmovaClient):
        self.client = client

    def list(self) -> List[ApiKey]:
        """List API keys"""
        response = self.client._request("GET", "/api-keys")
        return [ApiKey(**item) for item in response["data"]]

    def create(
        self,
        name: str,
        description: Optional[str] = None,
        scopes: Optional[List[str]] = None,
        rate_limit: Optional[int] = None,
        expires_at: Optional[str] = None,
    ) -> ApiKey:
        """Create a new API key"""
        data = {"name": name}

        if description:
            data["description"] = description
        if scopes:
            data["scopes"] = scopes
        if rate_limit:
            data["rateLimit"] = rate_limit
        if expires_at:
            data["expiresAt"] = expires_at

        response = self.client._request("POST", "/api-keys", json=data)
        return ApiKey(**response["data"])

    def revoke(self, key_id: str) -> None:
        """Revoke an API key"""
        self.client._request("DELETE", f"/api-keys/{key_id}")


class WebhooksResource:
    """Webhooks resource"""

    def __init__(self, client: InmovaClient):
        self.client = client

    def list(self) -> List[WebhookSubscription]:
        """List webhook subscriptions"""
        response = self.client._request("GET", "/webhooks")
        return [WebhookSubscription(**item) for item in response["data"]]

    def create(
        self,
        url: str,
        events: List[WebhookEventType],
        description: Optional[str] = None,
    ) -> WebhookSubscription:
        """Create a webhook subscription"""
        data = {"url": url, "events": events}

        if description:
            data["description"] = description

        response = self.client._request("POST", "/webhooks", json=data)
        return WebhookSubscription(**response["data"])

    def delete(self, webhook_id: str) -> None:
        """Delete a webhook subscription"""
        self.client._request("DELETE", f"/webhooks/{webhook_id}")

    @staticmethod
    def verify_signature(payload: str, signature: str, secret: str) -> bool:
        """Verify webhook signature"""
        expected_signature = hmac.new(
            secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(signature, expected_signature)
