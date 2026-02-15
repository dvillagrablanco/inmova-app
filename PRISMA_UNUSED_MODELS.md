# Modelos Prisma No Usados - Candidatos a Eliminacion

Auditoria: Feb 2026

**Total modelos**: 367
**Usados en codigo**: 302
**Sin referencias en codigo**: 65

## Modelos sin uso (no referenciados en app/, lib/, components/)

Estos modelos NO se referencian en ninguna query `prisma.modelName.*` ni en tipos.
Son candidatos para eliminacion en una migracion futura.

**IMPORTANTE**: Antes de eliminar, verificar que no hay datos en las tablas correspondientes en produccion.

### Comercial / Alquiler Comercial
- CommercialInquiry
- CommercialDocument
- CommercialMaintenance

### Email Marketing
- EmailCampaign
- EmailRecipient
- ScheduledEmail

### Analytics / Prediccion
- PredictionModel
- PerformanceMetric
- ModuleUsageStats
- SocialAnalytics
- STRCompetitorAnalysis

### Finanzas
- CashFlowStatement
- ReconciliationRule
- ConciliacionManual
- ProviderInvoicePayment

### Publicacion / Portales
- PublicacionPortal

### Modulos
- ModuleDefinition

### IoT
- IoTReading
- IoTAutomation
- IoTAlert

### AR/VR
- ARVisualization

### Marketplace
- MarketplaceLoyalty
- CircularMarketplace
- CircularItem

### ESG / Sostenibilidad
- ESGReport
- GreenProvider

### Blockchain / NFT
- TokenHolder
- SmartContract
- NFTCertificate

### IA / Voz
- AICommand
- VoiceInteraction

### Inquilinos P2P
- TenantReputation
- P2PService
- P2PBooking
- Ambassador

### Seguridad / Compliance
- BiometricVerification
- GDPRConsent
- FraudAlert
- SecurityAudit
- SecurityIncident

### Construccion / Flipping
- FlippingExpense
- FlippingMilestone
- ConstructionInspection
- ConstructionSupplier

### Profesional
- ProfessionalMeeting

### Room Rental
- RoomSharedSpace

### CRM
- LeadDocument

### Propietarios
- OwnerAlert

### Notificaciones
- UserNotificationSettings
- AnnouncementConfirmation

### Partners
- PartnerPromotion

### Comunidad
- CommunityEngagementMetrics

### eWoorker
- EwoorkerHitoContrato
- EwoorkerParteTrabajo
- EwoorkerCertificacion
- EwoorkerFichaje
- EwoorkerIncidencia
- EwoorkerChangeOrder
- EwoorkerMensajeObra
- EwoorkerReview
- EwoorkerLibroSubcontratacion
- EwoorkerAsientoSubcontratacion

### OAuth
- OAuthApp
- OAuthAuthorizationCode

### Signatures
- SignatureWebhook

## Proceso de eliminacion

1. Verificar que no hay datos en tablas de produccion: `SELECT count(*) FROM "ModelName";`
2. Si hay datos, evaluar si migrar o descartar
3. Eliminar del schema.prisma
4. Crear migracion: `npx prisma migrate dev --name remove-unused-models`
5. Deploy migracion
