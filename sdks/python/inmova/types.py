"""Type definitions for Inmova SDK"""

from typing import List, Optional, Dict, Any, Literal
from dataclasses import dataclass
from datetime import datetime

# Type aliases
PropertyStatus = Literal["AVAILABLE", "RENTED", "MAINTENANCE", "SOLD"]
PropertyType = Literal["APARTMENT", "HOUSE", "ROOM", "STUDIO", "OFFICE", "PARKING", "STORAGE"]
ApiKeyStatus = Literal["ACTIVE", "REVOKED", "EXPIRED"]
WebhookEventType = Literal[
    "PROPERTY_CREATED",
    "PROPERTY_UPDATED",
    "PROPERTY_DELETED",
    "TENANT_CREATED",
    "TENANT_UPDATED",
    "CONTRACT_CREATED",
    "CONTRACT_SIGNED",
    "PAYMENT_CREATED",
    "PAYMENT_RECEIVED",
    "MAINTENANCE_CREATED",
    "MAINTENANCE_RESOLVED",
    "DOCUMENT_UPLOADED",
    "USER_CREATED",
]


@dataclass
class PropertyPhoto:
    """Property photo data"""

    id: str
    url: str
    order: int


@dataclass
class Property:
    """Property data"""

    id: str
    address: str
    city: str
    price: float
    status: PropertyStatus
    type: PropertyType
    company_id: str
    created_at: str
    updated_at: str
    postal_code: Optional[str] = None
    country: Optional[str] = None
    rooms: Optional[int] = None
    bathrooms: Optional[int] = None
    square_meters: Optional[float] = None
    floor: Optional[int] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    photos: Optional[List[PropertyPhoto]] = None


@dataclass
class ApiKey:
    """API Key data"""

    id: str
    company_id: str
    key: str
    key_prefix: str
    name: str
    scopes: List[str]
    status: ApiKeyStatus
    rate_limit: int
    created_at: str
    updated_at: str
    description: Optional[str] = None
    expires_at: Optional[str] = None
    last_used_at: Optional[str] = None
    last_used_ip: Optional[str] = None


@dataclass
class WebhookSubscription:
    """Webhook subscription data"""

    id: str
    company_id: str
    url: str
    events: List[WebhookEventType]
    secret: str
    active: bool
    created_at: str
    updated_at: str
    description: Optional[str] = None


@dataclass
class Pagination:
    """Pagination metadata"""

    page: int
    limit: int
    total: int
    pages: int


@dataclass
class PaginatedResponse:
    """Paginated response"""

    success: bool
    data: List[Any]
    pagination: Pagination


class InmovaError(Exception):
    """Inmova API error"""

    def __init__(
        self,
        error: str,
        status_code: int,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.error = error
        self.status_code = status_code
        self.code = code
        self.details = details
        super().__init__(error)

    def __str__(self):
        return f"InmovaError({self.status_code}): {self.error}"
