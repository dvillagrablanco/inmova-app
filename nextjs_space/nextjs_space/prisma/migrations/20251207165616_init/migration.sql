yarn run v1.22.22
warning ../../../../package.json: No license field
$ /home/ubuntu/homming_vidaro/nextjs_space/node_modules/.bin/prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'administrador', 'gestor', 'operador', 'soporte', 'community_manager');

-- CreateEnum
CREATE TYPE "BusinessVertical" AS ENUM ('alquiler_tradicional', 'str_vacacional', 'coliving', 'construccion', 'flipping', 'servicios_profesionales', 'mixto');

-- CreateEnum
CREATE TYPE "CompanyCategory" AS ENUM ('enterprise', 'pyme', 'startup', 'trial', 'premium', 'standard');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('pendiente', 'en_revision', 'resuelta', 'rechazada');

-- CreateEnum
CREATE TYPE "SuggestionPriority" AS ENUM ('baja', 'media', 'alta', 'critica');

-- CreateEnum
CREATE TYPE "BuildingType" AS ENUM ('residencial', 'mixto', 'comercial');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('vivienda', 'local', 'garaje', 'trastero');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('ocupada', 'disponible', 'en_mantenimiento');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('activo', 'vencido', 'cancelado');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('residencial', 'comercial', 'temporal');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pendiente', 'pagado', 'atrasado');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('bajo', 'medio', 'alto', 'critico');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('alta', 'media', 'baja');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('pendiente', 'en_progreso', 'programado', 'completado');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('contrato', 'dni', 'nomina', 'certificado_energetico', 'ite', 'seguro', 'factura', 'otro');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('mantenimiento', 'impuestos', 'seguros', 'servicios', 'reparaciones', 'comunidad', 'otro');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('disponible', 'ocupada', 'mantenimiento', 'reservada');

-- CreateEnum
CREATE TYPE "RoomContractStatus" AS ENUM ('activo', 'vencido', 'cancelado', 'pendiente');

-- CreateEnum
CREATE TYPE "RoomPaymentMethod" AS ENUM ('transferencia', 'efectivo', 'tarjeta', 'domiciliacion');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('pago_atrasado', 'contrato_vencimiento', 'mantenimiento_urgente', 'mantenimiento_preventivo', 'documento_vencer', 'unidad_vacante', 'inspeccion_programada', 'alerta_sistema', 'info');

-- CreateEnum
CREATE TYPE "SituacionLaboral" AS ENUM ('empleado', 'autonomo', 'estudiante', 'jubilado', 'desempleado');

-- CreateEnum
CREATE TYPE "EstadoCivil" AS ENUM ('soltero', 'casado', 'divorciado', 'viudo');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('nuevo', 'en_revision', 'preseleccionado', 'aprobado', 'rechazado');

-- CreateEnum
CREATE TYPE "IncrementoType" AS ENUM ('porcentaje', 'ipc', 'fijo');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('enviado', 'leido');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('contrato', 'email', 'recibo');

-- CreateEnum
CREATE TYPE "StripePaymentStatus" AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('mensual', 'trimestral', 'semestral', 'anual');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('baja', 'media', 'alta', 'urgente');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pendiente', 'en_progreso', 'completada', 'cancelada');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT');

-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('diario', 'diaria', 'semanal', 'quincenal', 'mensual', 'trimestral', 'anual');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('morosidad', 'ocupacion', 'ingresos', 'gastos', 'mantenimiento', 'general');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('gasto', 'mantenimiento');

-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('activa', 'cerrada', 'archivada');

-- CreateEnum
CREATE TYPE "ChatMessageStatus" AS ENUM ('enviado', 'entregado', 'leido');

-- CreateEnum
CREATE TYPE "EmailCampaignStatus" AS ENUM ('borrador', 'programada', 'enviando', 'enviada', 'cancelada');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ingreso', 'gasto');

-- CreateEnum
CREATE TYPE "AccountingCategory" AS ENUM ('ingreso_renta', 'ingreso_deposito', 'ingreso_otro', 'gasto_mantenimiento', 'gasto_impuesto', 'gasto_seguro', 'gasto_servicio', 'gasto_reparacion', 'gasto_comunidad', 'gasto_administracion', 'gasto_otro');

-- CreateEnum
CREATE TYPE "CrmLeadStatus" AS ENUM ('nuevo', 'contactado', 'calificado', 'visitado', 'propuesta_enviada', 'negociacion', 'ganado', 'perdido');

-- CreateEnum
CREATE TYPE "CrmLeadSource" AS ENUM ('web', 'referido', 'llamada', 'email', 'redes_sociales', 'anuncio', 'otro');

-- CreateEnum
CREATE TYPE "CrmActivityType" AS ENUM ('llamada', 'email', 'reunion', 'visita', 'seguimiento', 'nota');

-- CreateEnum
CREATE TYPE "LegalTemplateCategory" AS ENUM ('contrato_arrendamiento', 'anexo_contrato', 'notificacion_inquilino', 'reclamacion', 'finalizacion_contrato', 'inspeccion', 'certificado', 'otro');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('programada', 'en_progreso', 'completada', 'pendiente_accion', 'cancelada');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('entrada', 'salida', 'periodica', 'precompra', 'mantenimiento', 'emergencia');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('activa', 'por_renovar', 'vencida', 'cancelada');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('solicitada', 'en_revision', 'cotizada', 'aceptada', 'rechazada', 'expirada');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pendiente', 'en_progreso', 'completado', 'cancelado');

-- CreateEnum
CREATE TYPE "WidgetType" AS ENUM ('kpi', 'chart_line', 'chart_bar', 'chart_pie', 'chart_area', 'table', 'heatmap', 'gauge');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "EnergyType" AS ENUM ('electricidad', 'agua', 'gas', 'calefaccion');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('consumo_alto', 'consumo_bajo', 'incremento_repentino', 'fuga_posible');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('info', 'warning', 'error', 'critical');

-- CreateEnum
CREATE TYPE "ChatbotConversationStatus" AS ENUM ('activa', 'resuelta', 'escalada');

-- CreateEnum
CREATE TYPE "MorosidadRiesgo" AS ENUM ('bajo', 'medio', 'alto', 'critico');

-- CreateEnum
CREATE TYPE "SignatureStatus" AS ENUM ('pendiente', 'firmado', 'rechazado', 'cancelado', 'expirado');

-- CreateEnum
CREATE TYPE "SignerStatus" AS ENUM ('pendiente', 'visto', 'firmado', 'rechazado');

-- CreateEnum
CREATE TYPE "BankConnectionStatus" AS ENUM ('conectado', 'desconectado', 'error', 'renovacion_requerida');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pendiente_revision', 'conciliado', 'descartado');

-- CreateEnum
CREATE TYPE "ValoracionMetodo" AS ENUM ('comparables', 'renta', 'coste', 'mixto');

-- CreateEnum
CREATE TYPE "ValoracionFinalidad" AS ENUM ('venta', 'alquiler', 'seguro', 'hipoteca');

-- CreateEnum
CREATE TYPE "PortalTipo" AS ENUM ('idealista', 'fotocasa', 'habitaclia', 'pisos_com', 'yaencontre', 'custom');

-- CreateEnum
CREATE TYPE "PublicacionEstado" AS ENUM ('borrador', 'activa', 'pausada', 'expirada', 'eliminada');

-- CreateEnum
CREATE TYPE "ScreeningEstado" AS ENUM ('pendiente', 'en_revision', 'verificado', 'aprobado', 'rechazado');

-- CreateEnum
CREATE TYPE "SMSEstado" AS ENUM ('programado', 'enviado', 'fallido', 'cancelado');

-- CreateEnum
CREATE TYPE "SMSTipo" AS ENUM ('recordatorio_pago', 'confirmacion_visita', 'mantenimiento', 'bienvenida', 'alerta', 'personalizado');

-- CreateEnum
CREATE TYPE "calendar_event_types" AS ENUM ('pago', 'vencimiento', 'visita', 'mantenimiento', 'inspeccion', 'reunion', 'recordatorio', 'otro');

-- CreateEnum
CREATE TYPE "calendar_event_priorities" AS ENUM ('baja', 'media', 'alta', 'critica');

-- CreateEnum
CREATE TYPE "common_space_types" AS ENUM ('salon_fiestas', 'gimnasio', 'piscina', 'sala_reuniones', 'zona_bbq', 'cancha_deportiva', 'lavanderia', 'terraza', 'otro');

-- CreateEnum
CREATE TYPE "reservation_statuses" AS ENUM ('pendiente', 'confirmada', 'cancelada', 'completada');

-- CreateEnum
CREATE TYPE "insurance_types" AS ENUM ('incendio', 'robo', 'responsabilidad_civil', 'vida', 'hogar', 'comunidad', 'impago_alquiler', 'otro');

-- CreateEnum
CREATE TYPE "insurance_statuses" AS ENUM ('activa', 'vencida', 'cancelada', 'pendiente_renovacion');

-- CreateEnum
CREATE TYPE "claim_statuses" AS ENUM ('abierto', 'en_proceso', 'aprobado', 'rechazado', 'cerrado');

-- CreateEnum
CREATE TYPE "energy_ratings" AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'G');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('ruido', 'averia_comun', 'limpieza', 'seguridad', 'convivencia', 'mascota', 'parking', 'otro');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('abierta', 'en_proceso', 'resuelta', 'cerrada', 'rechazada');

-- CreateEnum
CREATE TYPE "IncidentPriority" AS ENUM ('baja', 'media', 'alta', 'urgente');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('decision_comunidad', 'mejora', 'gasto', 'normativa', 'otro');

-- CreateEnum
CREATE TYPE "VoteStatus" AS ENUM ('activa', 'cerrada', 'cancelada');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('pendiente', 'asignada', 'aceptada', 'en_progreso', 'pausada', 'completada', 'cancelada', 'rechazada');

-- CreateEnum
CREATE TYPE "ProviderInvoiceStatus" AS ENUM ('borrador', 'enviada', 'aprobada', 'rechazada', 'pagada', 'vencida');

-- CreateEnum
CREATE TYPE "ProviderAvailabilityStatus" AS ENUM ('disponible', 'ocupado', 'vacaciones', 'enfermedad', 'no_disponible');

-- CreateEnum
CREATE TYPE "GalleryItemType" AS ENUM ('foto', 'video', 'tour_360', 'plano');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('exterior', 'salon', 'cocina', 'dormitorio_principal', 'dormitorio', 'bano_principal', 'bano', 'terraza', 'balcon', 'jardin', 'garaje', 'trastero', 'otro');

-- CreateEnum
CREATE TYPE "WidgetSize" AS ENUM ('small', 'medium', 'large', 'full');

-- CreateEnum
CREATE TYPE "WidgetRefreshRate" AS ENUM ('manual', 'realtime', 'every_5min', 'every_15min', 'every_hour', 'daily');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('pago_vencimiento', 'contrato_expiracion', 'mantenimiento_programado', 'inspeccion_pendiente', 'documento_vencimiento', 'renovacion_seguro', 'certificacion_expiracion', 'reunion_proxima', 'custom');

-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('email', 'sms', 'notification', 'all');

-- CreateEnum
CREATE TYPE "ReminderFrequency" AS ENUM ('once', 'daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "ReviewEntityType" AS ENUM ('proveedor', 'propiedad_unidad', 'inquilino', 'propietario');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pendiente', 'publicada', 'rechazada', 'reportada');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('completo', 'incremental', 'manual');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('pendiente', 'en_progreso', 'completado', 'fallido');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('basico', 'profesional', 'empresarial', 'personalizado');

-- CreateEnum
CREATE TYPE "BusinessModel" AS ENUM ('RESIDENCIAL_LARGA', 'TURISTICO_STR', 'COLIVING_MEDIA', 'HOTEL_APARTHOT', 'HOUSE_FLIPPING', 'CONSTRUCCION', 'SERVICIOS_PROF');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('AIRBNB', 'BOOKING', 'VRBO', 'HOMEAWAY', 'WEB_PROPIA', 'EXPEDIA', 'TRIPADVISOR', 'OTROS');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'CHECK_IN', 'CHECK_OUT', 'CANCELADA', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "SeasonType" AS ENUM ('ALTA', 'MEDIA', 'BAJA', 'ESPECIAL');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PROSPECTO', 'ANALISIS', 'ADQUISICION', 'RENOVACION', 'COMERCIALIZACION', 'VENDIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "RenovationCategory" AS ENUM ('ESTRUCTURAL', 'FONTANERIA', 'ELECTRICIDAD', 'PINTURA', 'SUELOS', 'COCINA', 'BANOS', 'EXTERIORES', 'OTROS');

-- CreateEnum
CREATE TYPE "ConstructionPhase" AS ENUM ('PLANIFICACION', 'PERMISOS', 'CIMENTACION', 'ESTRUCTURA', 'CERRAMIENTOS', 'INSTALACIONES', 'ACABADOS', 'ENTREGA', 'GARANTIA');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('PROYECTO_BASICO', 'PROYECTO_EJECUCION', 'DIRECCION_OBRA', 'CERTIFICACION_ENERGETICA', 'INSPECCION_TECNICA', 'TASACION', 'CONSULTORIA');

-- CreateEnum
CREATE TYPE "ProjectProfessionalStatus" AS ENUM ('PROPUESTA', 'ACEPTADO', 'EN_CURSO', 'REVISION', 'ENTREGADO', 'CERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "ChannelSyncDirection" AS ENUM ('push', 'pull', 'bidirectional');

-- CreateEnum
CREATE TYPE "SyncEventType" AS ENUM ('price_update', 'availability_update', 'booking_new', 'booking_cancel', 'booking_modify', 'content_update', 'review_received');

-- CreateEnum
CREATE TYPE "HousekeepingStatus" AS ENUM ('pendiente', 'asignado', 'en_progreso', 'completado', 'verificado', 'incidencia');

-- CreateEnum
CREATE TYPE "TurnoverType" AS ENUM ('check_out', 'check_in', 'limpieza_profunda', 'mantenimiento', 'inspeccion');

-- CreateEnum
CREATE TYPE "SocialMediaPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'WHATSAPP_BUSINESS', 'TIKTOK');

-- CreateEnum
CREATE TYPE "SocialPostStatus" AS ENUM ('borrador', 'programado', 'publicado', 'error');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "CouponStatus" AS ENUM ('activo', 'inactivo', 'agotado', 'expirado');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDIENTE', 'PAGADA', 'VENCIDA', 'CANCELADA', 'PARCIALMENTE_PAGADA');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pendiente', 'aceptada', 'expirada', 'cancelada');

-- CreateEnum
CREATE TYPE "ServiceRatingType" AS ENUM ('mantenimiento', 'atencion_cliente', 'plataforma', 'comunicacion', 'general');

-- CreateEnum
CREATE TYPE "ActaEstado" AS ENUM ('borrador', 'aprobada', 'rechazada');

-- CreateEnum
CREATE TYPE "CuotaTipo" AS ENUM ('ordinaria', 'extraordinaria', 'derrama');

-- CreateEnum
CREATE TYPE "FondoTipo" AS ENUM ('reserva', 'obras', 'contingencia');

-- CreateEnum
CREATE TYPE "TipoMovimientoCaja" AS ENUM ('ingreso', 'gasto', 'traspaso');

-- CreateEnum
CREATE TYPE "EstadoFacturaComunidad" AS ENUM ('borrador', 'emitida', 'pagada', 'vencida', 'cancelada');

-- CreateEnum
CREATE TYPE "TipoInformeComunidad" AS ENUM ('trimestral', 'anual', 'extraordinario');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('BANCO', 'MULTIFAMILY_OFFICE', 'PLATAFORMA_MEMBRESIA', 'ASOCIACION', 'CONSULTORA', 'INMOBILIARIA', 'OTRO');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PartnerInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalesRepStatus" AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NUEVO', 'CONTACTADO', 'CALIFICADO', 'DEMO', 'PROPUESTA', 'NEGOCIACION', 'CERRADO_GANADO', 'CERRADO_PERDIDO', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "SalesCommissionType" AS ENUM ('CAPTACION', 'RECURRENTE', 'REACTIVACION', 'BONIFICACION', 'NIVEL2');

-- CreateEnum
CREATE TYPE "SalesCommissionStatus" AS ENUM ('PENDIENTE', 'APROBADA', 'PAGADA', 'CANCELADA', 'RETENIDA');

-- CreateEnum
CREATE TYPE "NPSCategory" AS ENUM ('promotor', 'pasivo', 'detractor');

-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('favorable', 'neutro', 'desfavorable');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('activa', 'notificado', 'convertida', 'cancelada', 'expirada');

-- CreateEnum
CREATE TYPE "RatingCategory" AS ENUM ('excelente', 'muy_bueno', 'bueno', 'regular', 'malo');

-- CreateEnum
CREATE TYPE "CommunityEventStatus" AS ENUM ('borrador', 'publicado', 'en_curso', 'finalizado', 'cancelado');

-- CreateEnum
CREATE TYPE "CommunityEventType" AS ENUM ('social', 'formacion', 'networking', 'asamblea', 'fiesta', 'deporte', 'cultural', 'otro');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('urgente', 'importante', 'normal', 'informativo');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('borrador', 'activo', 'programado', 'expirado', 'archivado');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'gestor',
    "companyId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "businessVertical" "BusinessVertical",
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "mfaBackupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mfaVerifiedAt" TIMESTAMP(3),
    "mfaRecoveryCodes" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "tipo" "BuildingType" NOT NULL,
    "anoConstructor" INTEGER NOT NULL,
    "numeroUnidades" INTEGER NOT NULL,
    "estadoConservacion" TEXT,
    "certificadoEnergetico" TEXT,
    "ascensor" BOOLEAN NOT NULL DEFAULT false,
    "garaje" BOOLEAN NOT NULL DEFAULT false,
    "trastero" BOOLEAN NOT NULL DEFAULT false,
    "piscina" BOOLEAN NOT NULL DEFAULT false,
    "jardin" BOOLEAN NOT NULL DEFAULT false,
    "gastosComunidad" DOUBLE PRECISION,
    "ibiAnual" DOUBLE PRECISION,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "imagenes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "etiquetas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "nacionalidad" TEXT,
    "estadoCivil" "EstadoCivil",
    "numeroOcupantes" INTEGER,
    "direccionActual" TEXT,
    "situacionLaboral" "SituacionLaboral",
    "empresa" TEXT,
    "puesto" TEXT,
    "antiguedad" INTEGER,
    "ingresosMensuales" DOUBLE PRECISION,
    "ratioRentaIngresos" DOUBLE PRECISION,
    "scoring" INTEGER NOT NULL DEFAULT 50,
    "nivelRiesgo" "RiskLevel" NOT NULL DEFAULT 'medio',
    "password" TEXT,
    "notas" TEXT,
    "contasimpleCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "tipo" "UnitType" NOT NULL,
    "estado" "UnitStatus" NOT NULL DEFAULT 'disponible',
    "superficie" DOUBLE PRECISION NOT NULL,
    "superficieUtil" DOUBLE PRECISION,
    "habitaciones" INTEGER,
    "banos" INTEGER,
    "planta" INTEGER,
    "orientacion" TEXT,
    "rentaMensual" DOUBLE PRECISION NOT NULL,
    "tenantId" TEXT,
    "aireAcondicionado" BOOLEAN NOT NULL DEFAULT false,
    "calefaccion" BOOLEAN NOT NULL DEFAULT false,
    "terraza" BOOLEAN NOT NULL DEFAULT false,
    "balcon" BOOLEAN NOT NULL DEFAULT false,
    "amueblado" BOOLEAN NOT NULL DEFAULT false,
    "imagenes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tourVirtual" TEXT,
    "planos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "rentaMensual" DOUBLE PRECISION NOT NULL,
    "diaPago" INTEGER NOT NULL DEFAULT 1,
    "deposito" DOUBLE PRECISION NOT NULL,
    "mesesFianza" INTEGER NOT NULL DEFAULT 1,
    "renovacionAutomatica" BOOLEAN NOT NULL DEFAULT false,
    "incrementoType" "IncrementoType" NOT NULL DEFAULT 'ipc',
    "incrementoValor" DOUBLE PRECISION,
    "gastosIncluidos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gastosExcluidos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clausulasAdicionales" TEXT,
    "estado" "ContractStatus" NOT NULL DEFAULT 'activo',
    "tipo" "ContractType" NOT NULL DEFAULT 'residencial',
    "contractPdfPath" TEXT,
    "legalTemplateId" TEXT,
    "contasimpleInvoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "estado" "PaymentStatus" NOT NULL DEFAULT 'pendiente',
    "metodoPago" TEXT,
    "reciboPdfPath" TEXT,
    "nivelRiesgo" "RiskLevel" NOT NULL DEFAULT 'bajo',
    "stripePaymentIntentId" TEXT,
    "stripePaymentStatus" "StripePaymentStatus",
    "stripeClientSecret" TEXT,
    "stripeFee" DOUBLE PRECISION,
    "stripeNetAmount" DOUBLE PRECISION,
    "contasimplePaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeSubscriptionId" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_subscriptions" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripePriceId" TEXT,
    "status" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stripe_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_customers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stripe_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_webhook_events" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "prioridad" "MaintenancePriority" NOT NULL DEFAULT 'media',
    "estado" "MaintenanceStatus" NOT NULL DEFAULT 'pendiente',
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaProgramada" TIMESTAMP(3),
    "fechaCompletada" TIMESTAMP(3),
    "providerId" TEXT,
    "costoEstimado" DOUBLE PRECISION,
    "costoReal" DOUBLE PRECISION,
    "fotosProblem" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fotosCompletado" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "valoracion" INTEGER,
    "comentarios" TEXT,
    "requiereAprobacion" BOOLEAN NOT NULL DEFAULT false,
    "estadoAprobacion" "ApprovalStatus" DEFAULT 'pendiente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "direccion" TEXT,
    "rating" DOUBLE PRECISION,
    "notas" TEXT,
    "password" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcceso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT,
    "unitId" TEXT,
    "providerId" TEXT,
    "concepto" TEXT NOT NULL,
    "categoria" "ExpenseCategory" NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "facturaPdfPath" TEXT,
    "notas" TEXT,
    "requiereAprobacion" BOOLEAN NOT NULL DEFAULT false,
    "estadoAprobacion" "ApprovalStatus" DEFAULT 'pendiente',
    "contasimpleExpenseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "DocumentType" NOT NULL,
    "cloudStoragePath" TEXT NOT NULL,
    "tenantId" TEXT,
    "unitId" TEXT,
    "buildingId" TEXT,
    "contractId" TEXT,
    "folderId" TEXT,
    "versionActual" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "descripcion" TEXT,
    "fechaSubida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipo" "NotificationType" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "prioridad" "RiskLevel" NOT NULL DEFAULT 'bajo',
    "fechaLimite" TIMESTAMP(3),
    "entityId" TEXT,
    "entityType" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "situacionLaboral" "SituacionLaboral",
    "ingresosMensuales" DOUBLE PRECISION,
    "scoring" INTEGER NOT NULL DEFAULT 0,
    "estado" "CandidateStatus" NOT NULL DEFAULT 'nuevo',
    "documentos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "fechaVisita" TIMESTAMP(3) NOT NULL,
    "confirmada" BOOLEAN NOT NULL DEFAULT false,
    "asistio" BOOLEAN,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "estado" "MessageStatus" NOT NULL DEFAULT 'enviado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TemplateType" NOT NULL,
    "contenido" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL DEFAULT 'INMOVA',
    "cif" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "codigoPostal" TEXT,
    "ciudad" TEXT,
    "pais" TEXT NOT NULL DEFAULT 'España',
    "iban" TEXT,
    "colorPrimario" TEXT DEFAULT '#000000',
    "colorSecundario" TEXT DEFAULT '#FFFFFF',
    "pieDocumento" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "dominioPersonalizado" TEXT,
    "estadoCliente" TEXT DEFAULT 'activo',
    "contactoPrincipal" TEXT,
    "emailContacto" TEXT,
    "telefonoContacto" TEXT,
    "notasAdmin" TEXT,
    "parentCompanyId" TEXT,
    "maxUsuarios" INTEGER DEFAULT 5,
    "maxPropiedades" INTEGER DEFAULT 10,
    "maxEdificios" INTEGER DEFAULT 5,
    "subscriptionPlanId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" "CompanyCategory" DEFAULT 'standard',
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_schedules" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "buildingId" TEXT,
    "unitId" TEXT,
    "frecuencia" "RecurrenceFrequency" NOT NULL,
    "proximaFecha" TIMESTAMP(3) NOT NULL,
    "ultimaFecha" TIMESTAMP(3),
    "diasAnticipacion" INTEGER NOT NULL DEFAULT 15,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "providerId" TEXT,
    "costoEstimado" DOUBLE PRECISION,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" "TaskStatus" NOT NULL DEFAULT 'pendiente',
    "prioridad" "TaskPriority" NOT NULL DEFAULT 'media',
    "fechaLimite" TIMESTAMP(3),
    "fechaInicio" TIMESTAMP(3),
    "fechaCompletada" TIMESTAMP(3),
    "asignadoA" TEXT,
    "creadoPor" TEXT NOT NULL,
    "recordatorioEnviado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "changes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_reports" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "ReportType" NOT NULL,
    "frecuencia" "ReportFrequency" NOT NULL,
    "destinatarios" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ultimoEnvio" TIMESTAMP(3),
    "proximoEnvio" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "incluirPdf" BOOLEAN NOT NULL DEFAULT true,
    "incluirCsv" BOOLEAN NOT NULL DEFAULT true,
    "filtros" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailPagoAtrasado" BOOLEAN NOT NULL DEFAULT true,
    "emailContratoVencimiento" BOOLEAN NOT NULL DEFAULT true,
    "emailMantenimiento" BOOLEAN NOT NULL DEFAULT true,
    "emailDocumento" BOOLEAN NOT NULL DEFAULT true,
    "pushPagoAtrasado" BOOLEAN NOT NULL DEFAULT true,
    "pushContratoVencimiento" BOOLEAN NOT NULL DEFAULT true,
    "pushMantenimiento" BOOLEAN NOT NULL DEFAULT true,
    "pushDocumento" BOOLEAN NOT NULL DEFAULT false,
    "frecuenciaResumen" TEXT NOT NULL DEFAULT 'semanal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "tipo" "ApprovalType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "expenseId" TEXT,
    "maintenanceId" TEXT,
    "solicitadoPor" TEXT NOT NULL,
    "revisadoPor" TEXT,
    "estado" "ApprovalStatus" NOT NULL DEFAULT 'pendiente',
    "monto" DOUBLE PRECISION,
    "motivo" TEXT,
    "comentarioRechazo" TEXT,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRevision" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_conversations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "asunto" TEXT NOT NULL,
    "estado" "ChatStatus" NOT NULL DEFAULT 'activa',
    "ultimoMensaje" TEXT,
    "ultimoMensajeFecha" TIMESTAMP(3),
    "cerradoPor" TEXT,
    "fechaCierre" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "estado" "ChatMessageStatus" NOT NULL DEFAULT 'enviado',
    "adjuntos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "plantillaId" TEXT,
    "estado" "EmailCampaignStatus" NOT NULL DEFAULT 'borrador',
    "programadaPara" TIMESTAMP(3),
    "enviadaEn" TIMESTAMP(3),
    "creadoPor" TEXT NOT NULL,
    "segmento" TEXT,
    "filtros" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_recipients" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tenantId" TEXT,
    "enviado" BOOLEAN NOT NULL DEFAULT false,
    "entregado" BOOLEAN NOT NULL DEFAULT false,
    "abierto" BOOLEAN NOT NULL DEFAULT false,
    "clicado" BOOLEAN NOT NULL DEFAULT false,
    "rebotado" BOOLEAN NOT NULL DEFAULT false,
    "fechaEnvio" TIMESTAMP(3),
    "fechaApertura" TIMESTAMP(3),
    "fechaClic" TIMESTAMP(3),
    "errorEnvio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_folders" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "parentFolderId" TEXT,
    "color" TEXT DEFAULT '#000000',
    "icono" TEXT DEFAULT 'Folder',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumero" INTEGER NOT NULL,
    "cloud_storage_path" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_shares" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "compartidoPor" TEXT NOT NULL,
    "puedeDescargar" BOOLEAN NOT NULL DEFAULT true,
    "puedeEditar" BOOLEAN NOT NULL DEFAULT false,
    "notificado" BOOLEAN NOT NULL DEFAULT false,
    "visto" BOOLEAN NOT NULL DEFAULT false,
    "fechaVisto" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_tags" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#000000',
    "documentos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodo" TEXT NOT NULL,
    "totalUnidades" INTEGER NOT NULL,
    "unidadesOcupadas" INTEGER NOT NULL,
    "unidadesVacantes" INTEGER NOT NULL,
    "tasaOcupacion" DOUBLE PRECISION NOT NULL,
    "ingresosMensuales" DOUBLE PRECISION NOT NULL,
    "gastosMensuales" DOUBLE PRECISION NOT NULL,
    "ingresoNeto" DOUBLE PRECISION NOT NULL,
    "morosidad" DOUBLE PRECISION NOT NULL,
    "tasaMorosidad" DOUBLE PRECISION NOT NULL,
    "contratosPorVencer" INTEGER NOT NULL,
    "mantenimientoPendiente" INTEGER NOT NULL,
    "ticketPromedio" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "building_metrics" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodo" TEXT NOT NULL,
    "totalUnidades" INTEGER NOT NULL,
    "unidadesOcupadas" INTEGER NOT NULL,
    "tasaOcupacion" DOUBLE PRECISION NOT NULL,
    "ingresosReales" DOUBLE PRECISION NOT NULL,
    "ingresosPotenciales" DOUBLE PRECISION NOT NULL,
    "gastos" DOUBLE PRECISION NOT NULL,
    "ingresoNeto" DOUBLE PRECISION NOT NULL,
    "roi" DOUBLE PRECISION NOT NULL,
    "ticketPromedio" DOUBLE PRECISION NOT NULL,
    "diasPromedioVacancia" INTEGER NOT NULL,
    "satisfaccionInquilinos" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "building_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_behaviors" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pagosATiempo" INTEGER NOT NULL DEFAULT 0,
    "pagosRetrasados" INTEGER NOT NULL DEFAULT 0,
    "promedioRetrasosDias" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ticketsMantenimiento" INTEGER NOT NULL DEFAULT 0,
    "scoreComportamiento" INTEGER NOT NULL DEFAULT 50,
    "riesgoMorosidad" TEXT NOT NULL DEFAULT 'bajo',
    "probabilidadRenovacion" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_behaviors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_models" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "parametros" TEXT NOT NULL,
    "precision" DOUBLE PRECISION,
    "ultimoEntrenamiento" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "modelId" TEXT,
    "tipo" TEXT NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT,
    "periodo" TEXT NOT NULL,
    "valorPredicho" DOUBLE PRECISION NOT NULL,
    "confianza" DOUBLE PRECISION NOT NULL,
    "factores" TEXT NOT NULL,
    "fechaPrediccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaObjetivo" TIMESTAMP(3) NOT NULL,
    "valorReal" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT,
    "impactoEstimado" DOUBLE PRECISION,
    "accionSugerida" TEXT NOT NULL,
    "aplicada" BOOLEAN NOT NULL DEFAULT false,
    "fechaAplicacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_inventory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT,
    "codigoSKU" TEXT,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "cantidadMinima" INTEGER NOT NULL DEFAULT 5,
    "unidadMedida" TEXT NOT NULL DEFAULT 'unidad',
    "costoUnitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proveedor" TEXT,
    "ubicacion" TEXT,
    "fechaUltimaCompra" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_history" (
    "id" TEXT NOT NULL,
    "maintenanceRequestId" TEXT NOT NULL,
    "unitId" TEXT,
    "buildingId" TEXT,
    "equipoSistema" TEXT NOT NULL,
    "tipoProblema" TEXT NOT NULL,
    "descripcionProblema" TEXT NOT NULL,
    "solucionAplicada" TEXT,
    "repuestosUsados" TEXT,
    "costoReparacion" DOUBLE PRECISION,
    "tiempoReparacion" INTEGER,
    "proveedorId" TEXT,
    "tecnicoAsignado" TEXT,
    "fechaDeteccion" TIMESTAMP(3) NOT NULL,
    "fechaReparacion" TIMESTAMP(3),
    "proximoMantenimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_failure_predictions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "equipoSistema" TEXT NOT NULL,
    "buildingId" TEXT,
    "unitId" TEXT,
    "probabilidadFalla" DOUBLE PRECISION NOT NULL,
    "diasEstimados" INTEGER NOT NULL,
    "factoresRiesgo" TEXT NOT NULL,
    "recomendaciones" TEXT NOT NULL,
    "historialAnalizado" INTEGER NOT NULL DEFAULT 0,
    "confianza" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "fechaPrediccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaObjetivo" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_failure_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_budgets" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "periodo" TEXT NOT NULL,
    "presupuestoTotal" DOUBLE PRECISION NOT NULL,
    "gastadoCorrectivo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gastadoPreventivo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gastadoEmergencia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ahorroPreventivo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "numeroOrdenes" INTEGER NOT NULL DEFAULT 0,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_metrics" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "periodo" TEXT NOT NULL,
    "tiempoRespuestaPromedio" DOUBLE PRECISION NOT NULL,
    "tiempoResolucionPromedio" DOUBLE PRECISION NOT NULL,
    "tasaResolucionPrimera" DOUBLE PRECISION NOT NULL,
    "satisfaccionCliente" DOUBLE PRECISION,
    "costosPreventivo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costosCorrectivo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costosEmergencia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "solicitudesCompletas" INTEGER NOT NULL DEFAULT 0,
    "solicitudesPendientes" INTEGER NOT NULL DEFAULT 0,
    "solicitudesAtrasadas" INTEGER NOT NULL DEFAULT 0,
    "disponibilidadEquipos" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_diagnostics" (
    "id" TEXT NOT NULL,
    "maintenanceRequestId" TEXT NOT NULL,
    "equipoSistema" TEXT NOT NULL,
    "sintomas" TEXT NOT NULL,
    "diagnostico" TEXT NOT NULL,
    "causaProbable" TEXT NOT NULL,
    "solucionSugerida" TEXT NOT NULL,
    "repuestosNecesarios" TEXT,
    "costoEstimado" DOUBLE PRECISION,
    "tiempoEstimado" INTEGER,
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "confianza" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_diagnostics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_transactions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "unitId" TEXT,
    "tipo" "TransactionType" NOT NULL,
    "categoria" "AccountingCategory" NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "referencia" TEXT,
    "paymentId" TEXT,
    "expenseId" TEXT,
    "documentoPath" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_flow_statements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "ingresosTotales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gastosTotales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "flujoNeto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoInicial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoFinal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ingresosRenta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ingresosDeposito" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ingresosOtros" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gastosMantenimiento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gastosImpuestos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gastosSeguros" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gastosServicios" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gastosOtros" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_flow_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "unitId" TEXT,
    "estado" "CrmLeadStatus" NOT NULL DEFAULT 'nuevo',
    "fuente" "CrmLeadSource" NOT NULL DEFAULT 'web',
    "scoring" INTEGER NOT NULL DEFAULT 0,
    "presupuesto" DOUBLE PRECISION,
    "fechaMudanza" TIMESTAMP(3),
    "necesidades" TEXT,
    "notas" TEXT,
    "asignadoA" TEXT,
    "ultimoContacto" TIMESTAMP(3),
    "proximoSeguimiento" TIMESTAMP(3),
    "probabilidadCierre" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorEstimado" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tipo" "CrmActivityType" NOT NULL,
    "asunto" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "duracion" INTEGER,
    "resultado" TEXT,
    "proximaAccion" TEXT,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "LegalTemplateCategory" NOT NULL,
    "descripcion" TEXT,
    "contenido" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "jurisdiccion" TEXT,
    "aplicableA" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimaRevision" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_inspections" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT,
    "buildingId" TEXT,
    "contractId" TEXT,
    "tenantId" TEXT,
    "tipo" "InspectionType" NOT NULL,
    "estado" "InspectionStatus" NOT NULL DEFAULT 'programada',
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "fechaRealizada" TIMESTAMP(3),
    "inspector" TEXT NOT NULL,
    "checklist" TEXT NOT NULL,
    "observaciones" TEXT,
    "fotosAntes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fotosDespues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "daniosEncontrados" TEXT,
    "costoEstimadoDanos" DOUBLE PRECISION,
    "reportePdfPath" TEXT,
    "firmaTenant" TEXT,
    "firmaInspector" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT,
    "buildingId" TEXT,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'programada',
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "fechaRealizada" TIMESTAMP(3),
    "inspector" TEXT NOT NULL,
    "descripcion" TEXT,
    "observaciones" TEXT,
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reportePdfPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_policies" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "tipoSeguro" TEXT NOT NULL,
    "numeroPoliza" TEXT NOT NULL,
    "aseguradora" TEXT NOT NULL,
    "coberturas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "montoCobertura" DOUBLE PRECISION NOT NULL,
    "primaAnual" DOUBLE PRECISION NOT NULL,
    "deducible" DOUBLE PRECISION,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "fechaRenovacion" TIMESTAMP(3),
    "estado" "PolicyStatus" NOT NULL DEFAULT 'activa',
    "agente" TEXT,
    "telefonoAgente" TEXT,
    "emailAgente" TEXT,
    "documentoPath" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_alerts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaLimite" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "entityId" TEXT,
    "entityType" TEXT,
    "accionRequerida" TEXT,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "fechaCompletada" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_quotes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "buildingId" TEXT,
    "unitId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "servicioRequerido" TEXT NOT NULL,
    "urgencia" TEXT NOT NULL DEFAULT 'media',
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRespuesta" TIMESTAMP(3),
    "estado" "QuoteStatus" NOT NULL DEFAULT 'solicitada',
    "montoCotizado" DOUBLE PRECISION,
    "tiempoEstimado" TEXT,
    "notasProveedor" TEXT,
    "validezCotizacion" TIMESTAMP(3),
    "solicitadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_jobs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "quoteId" TEXT,
    "buildingId" TEXT,
    "unitId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "estado" "JobStatus" NOT NULL DEFAULT 'pendiente',
    "montoTotal" DOUBLE PRECISION NOT NULL,
    "montoPagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "garantiaMeses" INTEGER,
    "notasTrabajo" TEXT,
    "resultadoTrabajo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_reviews" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "calificacion" INTEGER NOT NULL,
    "puntualidad" INTEGER,
    "calidad" INTEGER,
    "comunicacion" INTEGER,
    "precioJusto" INTEGER,
    "comentario" TEXT,
    "recomendaria" BOOLEAN NOT NULL DEFAULT true,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bi_widgets" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "WidgetType" NOT NULL,
    "dataSource" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "posicion" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bi_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bi_reports" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "frecuencia" "ReportFrequency" NOT NULL,
    "filtros" JSONB NOT NULL,
    "columnas" JSONB NOT NULL,
    "ultimaEjecucion" TIMESTAMP(3),
    "proximaEjecucion" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "emailDestinatarios" TEXT[],
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bi_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bi_alerts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "metrica" TEXT NOT NULL,
    "condicion" TEXT NOT NULL,
    "umbral" DOUBLE PRECISION NOT NULL,
    "severidad" "AlertSeverity" NOT NULL DEFAULT 'warning',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "ultimaActivacion" TIMESTAMP(3),
    "vecesActivada" INTEGER NOT NULL DEFAULT 0,
    "emailNotificar" BOOLEAN NOT NULL DEFAULT true,
    "destinatarios" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bi_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_segments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "criterios" JSONB NOT NULL,
    "tenantIds" TEXT[],
    "metricasPromedio" JSONB,
    "totalInquilinos" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimaActualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_readings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "unitId" TEXT,
    "tipo" "EnergyType" NOT NULL,
    "lecturaAnterior" DOUBLE PRECISION,
    "lecturaActual" DOUBLE PRECISION NOT NULL,
    "consumo" DOUBLE PRECISION NOT NULL,
    "fechaLectura" TIMESTAMP(3) NOT NULL,
    "periodo" TEXT NOT NULL,
    "costo" DOUBLE PRECISION,
    "registradoPor" TEXT NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "energy_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_alerts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "unitId" TEXT,
    "tipo" "EnergyType" NOT NULL,
    "tipoAlerta" "AlertType" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "consumoActual" DOUBLE PRECISION NOT NULL,
    "consumoPromedio" DOUBLE PRECISION,
    "desviacionPorcentaje" DOUBLE PRECISION,
    "severidad" TEXT NOT NULL DEFAULT 'media',
    "fechaDeteccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resuelta" BOOLEAN NOT NULL DEFAULT false,
    "fechaResolucion" TIMESTAMP(3),
    "accionTomada" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "energy_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'es',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Madrid',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_reports" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipoReporte" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "filtros" JSONB,
    "totalEventos" INTEGER NOT NULL DEFAULT 0,
    "eventosError" INTEGER NOT NULL DEFAULT 0,
    "eventosCriticos" INTEGER NOT NULL DEFAULT 0,
    "usuariosAfectados" INTEGER NOT NULL DEFAULT 0,
    "generadoPor" TEXT NOT NULL,
    "reportPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "severidad" "AuditSeverity" NOT NULL DEFAULT 'warning',
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "descripcion" TEXT NOT NULL,
    "detalles" JSONB,
    "resuelta" BOOLEAN NOT NULL DEFAULT false,
    "resolucionNota" TEXT,
    "resueltoPor" TEXT,
    "fechaResolucion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_conversations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "idioma" TEXT NOT NULL DEFAULT 'es',
    "estado" "ChatbotConversationStatus" NOT NULL DEFAULT 'activa',
    "tema" TEXT,
    "satisfaccion" INTEGER,
    "comentarios" TEXT,
    "escaladoMotivo" TEXT,
    "contexto" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cerradaEn" TIMESTAMP(3),

    CONSTRAINT "chatbot_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "metadata" JSONB,
    "confidence" DOUBLE PRECISION,
    "tokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_actions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tenantId" TEXT,
    "accion" TEXT NOT NULL,
    "parametros" JSONB,
    "resultado" TEXT,
    "errorDetalle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "morosidad_predicciones" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contractId" TEXT,
    "probabilidadImpago" DOUBLE PRECISION NOT NULL,
    "nivelRiesgo" "MorosidadRiesgo" NOT NULL,
    "scoring" INTEGER NOT NULL,
    "factoresRiesgo" JSONB NOT NULL,
    "variablesAnalizadas" INTEGER NOT NULL DEFAULT 40,
    "prediccion30Dias" DOUBLE PRECISION NOT NULL,
    "prediccion60Dias" DOUBLE PRECISION NOT NULL,
    "prediccion90Dias" DOUBLE PRECISION NOT NULL,
    "recomendaciones" JSONB NOT NULL,
    "accionPrioritaria" TEXT,
    "pagosATiempo" INTEGER NOT NULL DEFAULT 0,
    "pagosAtrasados" INTEGER NOT NULL DEFAULT 0,
    "diasPromedioRetraso" DOUBLE PRECISION,
    "montoPendiente" DOUBLE PRECISION,
    "ratioIngresoRenta" DOUBLE PRECISION,
    "modeloVersion" TEXT NOT NULL DEFAULT 'xgboost_v1',
    "confianzaModelo" DOUBLE PRECISION,
    "ultimoEntrenamiento" TIMESTAMP(3),
    "alertaGenerada" BOOLEAN NOT NULL DEFAULT false,
    "fechaAlerta" TIMESTAMP(3),
    "accionesTomadas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "validaHasta" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "morosidad_predicciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "morosidad_historial" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentId" TEXT,
    "evento" TEXT NOT NULL,
    "diasRetraso" INTEGER,
    "montoAfectado" DOUBLE PRECISION,
    "accionTomada" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "morosidad_historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_firma" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipoDocumento" TEXT NOT NULL,
    "contractId" TEXT,
    "tenantId" TEXT,
    "signaturitId" TEXT,
    "estado" "SignatureStatus" NOT NULL DEFAULT 'pendiente',
    "urlDocumento" TEXT,
    "urlFirmado" TEXT,
    "requiereOrden" BOOLEAN NOT NULL DEFAULT false,
    "diasExpiracion" INTEGER NOT NULL DEFAULT 30,
    "fechaExpiracion" TIMESTAMP(3) NOT NULL,
    "recordatorios" BOOLEAN NOT NULL DEFAULT true,
    "diasRecordatorio" INTEGER NOT NULL DEFAULT 3,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviadoEn" TIMESTAMP(3),
    "completadoEn" TIMESTAMP(3),
    "canceladoEn" TIMESTAMP(3),
    "canceladoPor" TEXT,
    "motivoCancelacion" TEXT,
    "metadata" JSONB,
    "certificado" TEXT,

    CONSTRAINT "documentos_firma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firmantes" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "rol" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 1,
    "signaturitId" TEXT,
    "estado" "SignerStatus" NOT NULL DEFAULT 'pendiente',
    "enviadoEn" TIMESTAMP(3),
    "vistoEn" TIMESTAMP(3),
    "firmadoEn" TIMESTAMP(3),
    "rechazadoEn" TIMESTAMP(3),
    "motivoRechazo" TEXT,
    "recordatoriosEnviados" INTEGER NOT NULL DEFAULT 0,
    "ultimoRecordatorio" TIMESTAMP(3),
    "ipFirma" TEXT,
    "geolocalizacion" TEXT,
    "dispositivo" TEXT,

    CONSTRAINT "firmantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_webhooks" (
    "id" TEXT NOT NULL,
    "signaturitId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "documentoId" TEXT,
    "payload" JSONB NOT NULL,
    "procesado" BOOLEAN NOT NULL DEFAULT false,
    "errorProceso" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "procesadoEn" TIMESTAMP(3),

    CONSTRAINT "signature_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT,
    "tenantId" TEXT,
    "proveedor" TEXT NOT NULL,
    "provider" TEXT,
    "proveedorItemId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "consentId" TEXT,
    "consentValidUntil" TIMESTAMP(3),
    "nombreBanco" TEXT,
    "tipoCuenta" TEXT,
    "ultimosDigitos" TEXT,
    "moneda" TEXT NOT NULL DEFAULT 'EUR',
    "estado" "BankConnectionStatus" NOT NULL DEFAULT 'conectado',
    "status" TEXT,
    "ultimaSync" TIMESTAMP(3),
    "proximaSync" TIMESTAMP(3),
    "errorDetalle" TEXT,
    "autoReconciliar" BOOLEAN NOT NULL DEFAULT true,
    "notificarErrores" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "desconectadaEn" TIMESTAMP(3),

    CONSTRAINT "bank_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "proveedorTxId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "fechaContable" TIMESTAMP(3),
    "descripcion" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'EUR',
    "categoria" TEXT,
    "subcategoria" TEXT,
    "beneficiario" TEXT,
    "referencia" TEXT,
    "tipoTransaccion" TEXT,
    "creditorName" TEXT,
    "creditorIban" TEXT,
    "debtorName" TEXT,
    "debtorIban" TEXT,
    "rawData" JSONB,
    "estado" "TransactionStatus" NOT NULL DEFAULT 'pendiente_revision',
    "paymentId" TEXT,
    "expenseId" TEXT,
    "matchScore" DOUBLE PRECISION,
    "matchSuggestions" JSONB,
    "conciliadoPor" TEXT,
    "conciliadoEn" TIMESTAMP(3),
    "notasConciliacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "prioridad" INTEGER NOT NULL DEFAULT 1,
    "condiciones" JSONB NOT NULL,
    "accionTipo" TEXT NOT NULL,
    "accionConfig" JSONB,
    "vecesAplicada" INTEGER NOT NULL DEFAULT 0,
    "ultimaAplicacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reconciliation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conciliaciones_manuales" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "paymentId" TEXT,
    "expenseId" TEXT,
    "diferenciaMonto" DOUBLE PRECISION,
    "motivoDiferencia" TEXT,
    "notas" TEXT,
    "conciliadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conciliaciones_manuales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valoraciones_propiedades" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT,
    "buildingId" TEXT,
    "direccion" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "codigoPostal" TEXT,
    "metrosCuadrados" DOUBLE PRECISION NOT NULL,
    "habitaciones" INTEGER,
    "banos" INTEGER,
    "garajes" INTEGER,
    "trasteros" INTEGER,
    "ascensor" BOOLEAN NOT NULL DEFAULT false,
    "terraza" BOOLEAN NOT NULL DEFAULT false,
    "jardin" BOOLEAN NOT NULL DEFAULT false,
    "piscina" BOOLEAN NOT NULL DEFAULT false,
    "anosConstruccion" INTEGER,
    "estadoConservacion" TEXT,
    "orientacion" TEXT,
    "eficienciaEnergetica" TEXT,
    "metodo" "ValoracionMetodo" NOT NULL,
    "finalidad" "ValoracionFinalidad" NOT NULL,
    "valorEstimado" DOUBLE PRECISION NOT NULL,
    "valorMinimo" DOUBLE PRECISION NOT NULL,
    "valorMaximo" DOUBLE PRECISION NOT NULL,
    "precioM2" DOUBLE PRECISION NOT NULL,
    "confianzaValoracion" DOUBLE PRECISION NOT NULL,
    "numComparables" INTEGER NOT NULL DEFAULT 0,
    "comparablesData" JSONB,
    "factoresPositivos" JSONB,
    "factoresNegativos" JSONB,
    "recomendacionPrecio" TEXT,
    "precioMedioZona" DOUBLE PRECISION,
    "demandaZona" TEXT,
    "diasPromedioVenta" INTEGER,
    "generadoPor" TEXT NOT NULL,
    "fechaValoracion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validoHasta" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "valoraciones_propiedades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publicaciones_portales" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "buildingId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "descripcionCorta" TEXT,
    "portales" JSONB NOT NULL,
    "fotosUrls" JSONB NOT NULL,
    "videoUrl" TEXT,
    "tourVirtualUrl" TEXT,
    "precioVenta" DOUBLE PRECISION,
    "precioAlquiler" DOUBLE PRECISION,
    "gastosIncluidos" BOOLEAN NOT NULL DEFAULT false,
    "fianza" DOUBLE PRECISION,
    "condicionesEspeciales" TEXT,
    "caracteristicas" JSONB NOT NULL,
    "palabrasClave" JSONB,
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "urgente" BOOLEAN NOT NULL DEFAULT false,
    "estado" "PublicacionEstado" NOT NULL DEFAULT 'borrador',
    "fechaPublicacion" TIMESTAMP(3),
    "fechaExpiracion" TIMESTAMP(3),
    "vistas" INTEGER NOT NULL DEFAULT 0,
    "contactos" INTEGER NOT NULL DEFAULT 0,
    "favoritos" INTEGER NOT NULL DEFAULT 0,
    "creadoPor" TEXT NOT NULL,
    "ultimaActualizacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publicaciones_portales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screening_candidatos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "estado" "ScreeningEstado" NOT NULL DEFAULT 'pendiente',
    "scoringTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dniVerificado" BOOLEAN NOT NULL DEFAULT false,
    "dniComentarios" TEXT,
    "dniPuntos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contratoTrabajoVerificado" BOOLEAN NOT NULL DEFAULT false,
    "nominasVerificadas" BOOLEAN NOT NULL DEFAULT false,
    "mesesNominas" INTEGER NOT NULL DEFAULT 0,
    "empresaContactada" BOOLEAN NOT NULL DEFAULT false,
    "laboralComentarios" TEXT,
    "laboralPuntos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ingresosVerificados" BOOLEAN NOT NULL DEFAULT false,
    "ratioIngresosRenta" DOUBLE PRECISION,
    "cuentaBancariaVerificada" BOOLEAN NOT NULL DEFAULT false,
    "ahorrosVerificados" BOOLEAN NOT NULL DEFAULT false,
    "economicaComentarios" TEXT,
    "economicaPuntos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referenciasPersonales" INTEGER NOT NULL DEFAULT 0,
    "referenciasLaborales" INTEGER NOT NULL DEFAULT 0,
    "referenciasPrevias" INTEGER NOT NULL DEFAULT 0,
    "referenciasContactadas" INTEGER NOT NULL DEFAULT 0,
    "referenciasPositivas" INTEGER NOT NULL DEFAULT 0,
    "referenciasComentarios" TEXT,
    "referenciasPuntos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ficherosMorosidad" BOOLEAN NOT NULL DEFAULT false,
    "impagosAnteriores" BOOLEAN NOT NULL DEFAULT false,
    "demandasPrevias" BOOLEAN NOT NULL DEFAULT false,
    "antecedentesComentarios" TEXT,
    "antecedentesPuntos" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "documentosRequeridos" JSONB NOT NULL,
    "documentosCompletos" BOOLEAN NOT NULL DEFAULT false,
    "flagsRiesgo" JSONB,
    "nivelRiesgoGlobal" "RiskLevel" NOT NULL DEFAULT 'medio',
    "entrevistaRealizada" BOOLEAN NOT NULL DEFAULT false,
    "visitaRealizada" BOOLEAN NOT NULL DEFAULT false,
    "impresionGeneral" TEXT,
    "aprobado" BOOLEAN,
    "motivoRechazo" TEXT,
    "condicionesEspeciales" TEXT,
    "revisadoPor" TEXT,
    "fechaRevision" TIMESTAMP(3),
    "fechaDecision" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "screening_candidatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "SMSTipo" NOT NULL,
    "mensaje" TEXT NOT NULL,
    "variables" JSONB,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "envioAutomatico" BOOLEAN NOT NULL DEFAULT false,
    "eventoTrigger" TEXT,
    "anticipacionDias" INTEGER,
    "horaEnvio" TEXT,
    "vecesUsada" INTEGER NOT NULL DEFAULT 0,
    "ultimoEnvio" TIMESTAMP(3),
    "creadoPor" TEXT NOT NULL,
    "ultimaModificacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "templateId" TEXT,
    "tenantId" TEXT,
    "telefono" TEXT NOT NULL,
    "nombreDestinatario" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" "SMSTipo" NOT NULL,
    "estado" "SMSEstado" NOT NULL DEFAULT 'programado',
    "fechaProgramada" TIMESTAMP(3),
    "fechaEnvio" TIMESTAMP(3),
    "proveedorSMS" TEXT,
    "idExterno" TEXT,
    "costeEstimado" DOUBLE PRECISION,
    "exitoso" BOOLEAN,
    "mensajeError" TEXT,
    "relacionadoCon" TEXT,
    "relacionadoId" TEXT,
    "enviadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "calendar_event_types" NOT NULL,
    "prioridad" "calendar_event_priorities" NOT NULL DEFAULT 'media',
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "todoElDia" BOOLEAN NOT NULL DEFAULT false,
    "ubicacion" TEXT,
    "buildingId" TEXT,
    "unitId" TEXT,
    "tenantId" TEXT,
    "contractId" TEXT,
    "paymentId" TEXT,
    "maintenanceRequestId" TEXT,
    "visitId" TEXT,
    "inspectionId" TEXT,
    "recordatorioActivo" BOOLEAN NOT NULL DEFAULT false,
    "recordatorioMinutos" INTEGER,
    "recordatorioEnviado" BOOLEAN NOT NULL DEFAULT false,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "cancelado" BOOLEAN NOT NULL DEFAULT false,
    "motivoCancelacion" TEXT,
    "esRecurrente" BOOLEAN NOT NULL DEFAULT false,
    "patronRecurrencia" TEXT,
    "participantes" JSONB,
    "color" TEXT,
    "notas" TEXT,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common_spaces" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "common_space_types" NOT NULL,
    "capacidadMaxima" INTEGER,
    "requierePago" BOOLEAN NOT NULL DEFAULT false,
    "costoPorHora" DOUBLE PRECISION,
    "horaApertura" TEXT,
    "horaCierre" TEXT,
    "duracionMaximaHoras" INTEGER NOT NULL DEFAULT 4,
    "anticipacionDias" INTEGER NOT NULL DEFAULT 30,
    "reglas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "common_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space_reservations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fechaReserva" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "estado" "reservation_statuses" NOT NULL DEFAULT 'pendiente',
    "monto" DOUBLE PRECISION,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "numeroPersonas" INTEGER,
    "proposito" TEXT,
    "observaciones" TEXT,
    "motivoCancelacion" TEXT,
    "fechaCancelacion" TIMESTAMP(3),
    "noShow" BOOLEAN NOT NULL DEFAULT false,
    "penaltyApplied" BOOLEAN NOT NULL DEFAULT false,
    "penaltyCredits" INTEGER,
    "checkInConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "horaCheckIn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurances" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "unitId" TEXT,
    "numeroPoliza" TEXT NOT NULL,
    "tipo" "insurance_types" NOT NULL,
    "aseguradora" TEXT NOT NULL,
    "nombreAsegurado" TEXT NOT NULL,
    "telefonoAseguradora" TEXT,
    "emailAseguradora" TEXT,
    "contactoAgente" TEXT,
    "cobertura" TEXT,
    "sumaAsegurada" DOUBLE PRECISION,
    "franquicia" DOUBLE PRECISION,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "primaMensual" DOUBLE PRECISION,
    "primaAnual" DOUBLE PRECISION,
    "estado" "insurance_statuses" NOT NULL DEFAULT 'activa',
    "renovacionAutomatica" BOOLEAN NOT NULL DEFAULT false,
    "urlDocumento" TEXT,
    "documentosAdjuntos" JSONB,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_claims" (
    "id" TEXT NOT NULL,
    "insuranceId" TEXT NOT NULL,
    "numeroReclamo" TEXT,
    "fechaSiniestro" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "montoReclamado" DOUBLE PRECISION,
    "montoAprobado" DOUBLE PRECISION,
    "estado" "claim_statuses" NOT NULL DEFAULT 'abierto',
    "fechaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" TIMESTAMP(3),
    "documentosAdjuntos" JSONB,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_certificates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "numeroCertificado" TEXT,
    "calificacion" "energy_ratings" NOT NULL,
    "consumoEnergetico" DOUBLE PRECISION,
    "emisionesCO2" DOUBLE PRECISION,
    "nombreTecnico" TEXT NOT NULL,
    "numeroColegiadoTecnico" TEXT,
    "empresaCertificadora" TEXT,
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "recomendaciones" TEXT,
    "ahorroEstimado" DOUBLE PRECISION,
    "urlCertificado" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "energy_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_incidents" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "reporterType" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "IncidentType" NOT NULL,
    "estado" "IncidentStatus" NOT NULL DEFAULT 'abierta',
    "prioridad" "IncidentPriority" NOT NULL DEFAULT 'media',
    "ubicacion" TEXT,
    "unitId" TEXT,
    "fotos" TEXT[],
    "asignadoA" TEXT,
    "fechaReporte" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaResolucion" TIMESTAMP(3),
    "solucion" TEXT,
    "costoEstimado" DOUBLE PRECISION,
    "costoFinal" DOUBLE PRECISION,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_votes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "VoteType" NOT NULL,
    "estado" "VoteStatus" NOT NULL DEFAULT 'activa',
    "opciones" JSONB NOT NULL,
    "requiereQuorum" BOOLEAN NOT NULL DEFAULT true,
    "quorumRequerido" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" TIMESTAMP(3) NOT NULL,
    "totalVotos" INTEGER NOT NULL DEFAULT 0,
    "totalElegibles" INTEGER NOT NULL DEFAULT 0,
    "opcionGanadora" TEXT,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vote_records" (
    "id" TEXT NOT NULL,
    "voteId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "opcionSeleccionada" TEXT NOT NULL,
    "comentario" TEXT,
    "fechaVoto" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vote_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_announcements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "importante" BOOLEAN NOT NULL DEFAULT false,
    "enviarNotificacion" BOOLEAN NOT NULL DEFAULT false,
    "fechaPublicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaExpiracion" TIMESTAMP(3),
    "adjuntos" TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "publicadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_meetings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fechaReunion" TIMESTAMP(3) NOT NULL,
    "ubicacion" TEXT,
    "ordenDel" TEXT NOT NULL,
    "acta" TEXT,
    "acuerdos" JSONB,
    "asistentes" JSONB,
    "estado" TEXT NOT NULL DEFAULT 'programada',
    "convocatoria" TEXT,
    "actaFirmada" TEXT,
    "organizadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_work_orders" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "maintenanceRequestId" TEXT,
    "buildingId" TEXT NOT NULL,
    "unitId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" "WorkOrderStatus" NOT NULL DEFAULT 'asignada',
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "fechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEstimada" TIMESTAMP(3),
    "fechaInicio" TIMESTAMP(3),
    "fechaCompletado" TIMESTAMP(3),
    "fotosAntes" TEXT[],
    "fotosDespues" TEXT[],
    "materialesUsados" JSONB,
    "horasTrabajadas" DOUBLE PRECISION,
    "presupuestoInicial" DOUBLE PRECISION,
    "costoMateriales" DOUBLE PRECISION,
    "costoManoObra" DOUBLE PRECISION,
    "costoTotal" DOUBLE PRECISION,
    "firmadoPor" TEXT,
    "firmaDigital" TEXT,
    "fechaFirma" TIMESTAMP(3),
    "valoracion" INTEGER,
    "comentarios" TEXT,
    "asignadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_galleries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "portada" TEXT,
    "orden" TEXT[],
    "urlTourVirtual" TEXT,
    "embedCode" TEXT,
    "usarMarcaAgua" BOOLEAN NOT NULL DEFAULT true,
    "visitas" INTEGER NOT NULL DEFAULT 0,
    "ultimaActualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_items" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "tipo" "GalleryItemType" NOT NULL,
    "habitacion" "RoomType" NOT NULL,
    "url" TEXT NOT NULL,
    "urlThumbnail" TEXT,
    "titulo" TEXT,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "duracion" INTEGER,
    "tipo360" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_dashboard_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "layout" TEXT NOT NULL DEFAULT 'grid',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "defaultView" TEXT NOT NULL DEFAULT 'overview',
    "activeWidgets" TEXT[],
    "widgetPositions" JSONB,
    "defaultFilters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_dashboard_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_widgets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferenceId" TEXT NOT NULL,
    "widgetType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "size" "WidgetSize" NOT NULL DEFAULT 'medium',
    "refreshRate" "WidgetRefreshRate" NOT NULL DEFAULT 'every_15min',
    "dataSource" TEXT,
    "filters" JSONB,
    "chartType" TEXT,
    "columns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "position" JSONB,
    "color" TEXT,
    "icon" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRefresh" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automatic_reminders" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "ReminderType" NOT NULL,
    "channel" "ReminderChannel" NOT NULL DEFAULT 'email',
    "frequency" "ReminderFrequency" NOT NULL DEFAULT 'once',
    "diasAnticipacion" INTEGER NOT NULL DEFAULT 7,
    "horaEnvio" TEXT NOT NULL DEFAULT '09:00',
    "enviarA" TEXT[],
    "conditions" JSONB,
    "entityType" TEXT,
    "tituloPlantilla" TEXT NOT NULL,
    "mensajePlantilla" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoEnvio" TIMESTAMP(3),
    "proximoEnvio" TIMESTAMP(3),
    "totalEnviados" INTEGER NOT NULL DEFAULT 0,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automatic_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entityType" "ReviewEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewerType" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "comentario" TEXT NOT NULL,
    "aspectos" JSONB,
    "respuesta" TEXT,
    "respondidoPor" TEXT,
    "fechaRespuesta" TIMESTAMP(3),
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "contratoId" TEXT,
    "ordenTrabajoId" TEXT,
    "estado" "ReviewStatus" NOT NULL DEFAULT 'pendiente',
    "moderadoPor" TEXT,
    "fechaModeracion" TIMESTAMP(3),
    "motivoRechazo" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "dislikes" INTEGER NOT NULL DEFAULT 0,
    "reportes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_backups" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipo" "BackupType" NOT NULL DEFAULT 'manual',
    "estado" "BackupStatus" NOT NULL DEFAULT 'pendiente',
    "registros" INTEGER NOT NULL DEFAULT 0,
    "tamano" TEXT,
    "ubicacion" TEXT,
    "inicioPor" TEXT NOT NULL,
    "errorDetalle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "system_backups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_metrics" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precioMensual" DOUBLE PRECISION NOT NULL,
    "maxUsuarios" INTEGER NOT NULL DEFAULT 5,
    "maxPropiedades" INTEGER NOT NULL DEFAULT 10,
    "modulosIncluidos" JSONB NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_modules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "moduloCodigo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "configuracion" JSONB,
    "limiteUso" INTEGER,
    "activadoPor" TEXT,
    "activadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_definitions" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "icono" TEXT,
    "ruta" TEXT NOT NULL,
    "requiereModulos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tiersIncluido" "SubscriptionTier"[],
    "esCore" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branding_configs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "appName" TEXT NOT NULL DEFAULT 'INMOVA',
    "appDescription" TEXT,
    "tagline" TEXT,
    "logoUrl" TEXT,
    "logoSmallUrl" TEXT,
    "faviconUrl" TEXT,
    "ogImageUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#000000',
    "secondaryColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "accentColor" TEXT DEFAULT '#6366f1',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "textColor" TEXT NOT NULL DEFAULT '#000000',
    "successColor" TEXT NOT NULL DEFAULT '#22c55e',
    "warningColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "errorColor" TEXT NOT NULL DEFAULT '#ef4444',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter, sans-serif',
    "headingFont" TEXT,
    "borderRadius" TEXT NOT NULL DEFAULT '0.5rem',
    "sidebarPosition" TEXT NOT NULL DEFAULT 'left',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "footerText" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "websiteUrl" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branding_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iot_devices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "unitId" TEXT,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "numeroSerie" TEXT,
    "protocolo" TEXT,
    "ubicacion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "conectado" BOOLEAN NOT NULL DEFAULT false,
    "ultimaConexion" TIMESTAMP(3),
    "bateria" INTEGER,
    "configuracion" JSONB,
    "umbrales" JSONB,
    "endpoint" TEXT,
    "apiKey" TEXT,
    "instaladoPor" TEXT,
    "fechaInstalacion" TIMESTAMP(3),
    "ultimoMantenimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iot_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iot_readings" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "metrica" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "iot_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iot_automations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "condiciones" JSONB NOT NULL,
    "acciones" JSONB NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "ultimaEjecucion" TIMESTAMP(3),
    "vecesEjecutada" INTEGER NOT NULL DEFAULT 0,
    "creadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iot_automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iot_alerts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "severidad" TEXT NOT NULL DEFAULT 'media',
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "reconocidaPor" TEXT,
    "fechaReconocida" TIMESTAMP(3),
    "fechaResuelta" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iot_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "virtual_tours" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT,
    "buildingId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "urlPrincipal" TEXT NOT NULL,
    "urlThumbnail" TEXT,
    "embedCode" TEXT,
    "escenas" JSONB,
    "hotspots" JSONB,
    "vistas" INTEGER NOT NULL DEFAULT 0,
    "tiempoPromedio" INTEGER,
    "compartido" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "publico" BOOLEAN NOT NULL DEFAULT false,
    "creadoPor" TEXT,
    "plataforma" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "virtual_tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ar_visualizations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "escenaBefore" JSONB,
    "escenaAfter" JSONB NOT NULL,
    "elementos" JSONB,
    "costoEstimado" DOUBLE PRECISION,
    "tiempoEstimado" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "compartidaCon" JSONB,
    "creadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ar_visualizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_services" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "providerId" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT,
    "tipoPrecio" TEXT NOT NULL,
    "precio" DOUBLE PRECISION,
    "unidad" TEXT,
    "comisionPorcentaje" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "horarios" JSONB,
    "duracionEstimada" INTEGER,
    "requisitos" JSONB,
    "incluye" JSONB,
    "noIncluye" JSONB,
    "rating" DOUBLE PRECISION,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "imagenes" JSONB,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_bookings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "unitId" TEXT,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaServicio" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT,
    "horaFin" TEXT,
    "precioBase" DOUBLE PRECISION NOT NULL,
    "comision" DOUBLE PRECISION NOT NULL,
    "precioTotal" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "motivoCancelacion" TEXT,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "metodoPago" TEXT,
    "stripePaymentId" TEXT,
    "rating" INTEGER,
    "comentario" TEXT,
    "fechaRating" TIMESTAMP(3),
    "notasCliente" TEXT,
    "notasInternas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_loyalty" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "nivel" TEXT NOT NULL DEFAULT 'bronce',
    "descuentoActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashbackAcumulado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "puntosGanados" INTEGER NOT NULL DEFAULT 0,
    "puntosCanjeados" INTEGER NOT NULL DEFAULT 0,
    "serviciosUsados" INTEGER NOT NULL DEFAULT 0,
    "ultimaActividad" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_loyalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_analysis" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "precioActual" DOUBLE PRECISION NOT NULL,
    "precioSugerido" DOUBLE PRECISION NOT NULL,
    "precioMinimo" DOUBLE PRECISION NOT NULL,
    "precioMaximo" DOUBLE PRECISION NOT NULL,
    "precioMercado" DOUBLE PRECISION,
    "competidores" JSONB,
    "factores" JSONB NOT NULL,
    "estacionalidad" JSONB,
    "eventosCercanos" JSONB,
    "probabilidadAlquiler" INTEGER NOT NULL,
    "diasHastaAlquiler" INTEGER,
    "demandaEstimada" TEXT,
    "estrategia" TEXT,
    "recomendacion" TEXT NOT NULL,
    "aplicado" BOOLEAN NOT NULL DEFAULT false,
    "fechaAplicacion" TIMESTAMP(3),
    "resultadoReal" TEXT,
    "validoHasta" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_data" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "zona" TEXT NOT NULL,
    "codigoPostal" TEXT,
    "precioPromedio" DOUBLE PRECISION NOT NULL,
    "precioMin" DOUBLE PRECISION NOT NULL,
    "precioMax" DOUBLE PRECISION NOT NULL,
    "diasPromedioAlquiler" INTEGER,
    "tasaOcupacion" DOUBLE PRECISION,
    "demanda" TEXT NOT NULL,
    "tipoPropiedad" TEXT,
    "numHabitaciones" INTEGER,
    "metrosCuadrados" INTEGER,
    "fuente" TEXT,
    "muestras" INTEGER NOT NULL DEFAULT 1,
    "periodo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_strategies" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "ajusteAutomatico" BOOLEAN NOT NULL DEFAULT false,
    "limitePorcentaje" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "frecuencia" TEXT NOT NULL DEFAULT 'semanal',
    "reglas" JSONB NOT NULL,
    "restricciones" JSONB,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "ultimaEjecucion" TIMESTAMP(3),
    "vecesAplicada" INTEGER NOT NULL DEFAULT 0,
    "incrementoIngresos" DOUBLE PRECISION,
    "reduccionVacancia" DOUBLE PRECISION,
    "creadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carbon_footprints" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "periodo" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "scope1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scope2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scope3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "desglose" JSONB NOT NULL,
    "periodoAnterior" DOUBLE PRECISION,
    "variacion" DOUBLE PRECISION,
    "intensidadPorM2" DOUBLE PRECISION,
    "intensidadPorPersona" DOUBLE PRECISION,
    "metodologia" TEXT NOT NULL,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "verificadoPor" TEXT,
    "calculadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carbon_footprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decarbonization_plans" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "emisionesActuales" DOUBLE PRECISION NOT NULL,
    "objetivoReduccion" DOUBLE PRECISION NOT NULL,
    "emisionesObjetivo" DOUBLE PRECISION NOT NULL,
    "añoObjetivo" INTEGER NOT NULL,
    "actuaciones" JSONB NOT NULL,
    "presupuestoTotal" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'planificado',
    "avance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ahorroAnualEstimado" DOUBLE PRECISION,
    "periodoRetorno" INTEGER,
    "subvencionesDisponibles" JSONB,
    "subvencionesObtenidas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creadoPor" TEXT,
    "aprobadoPor" TEXT,
    "fechaAprobacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decarbonization_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esg_certifications" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nivel" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'en_proceso',
    "progreso" INTEGER NOT NULL DEFAULT 0,
    "fechaSolicitud" TIMESTAMP(3),
    "fechaObtencion" TIMESTAMP(3),
    "fechaExpiracion" TIMESTAMP(3),
    "fechaRenovacion" TIMESTAMP(3),
    "requisitos" JSONB NOT NULL,
    "puntajeObtenido" INTEGER,
    "puntajeMaximo" INTEGER,
    "documentos" JSONB,
    "certificado" TEXT,
    "costoSolicitud" DOUBLE PRECISION,
    "costoMantenimiento" DOUBLE PRECISION,
    "auditor" TEXT,
    "proximaAuditoria" TIMESTAMP(3),
    "creadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esg_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esg_reports" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "añoFiscal" INTEGER NOT NULL,
    "trimestre" INTEGER,
    "datosAmbientales" JSONB NOT NULL,
    "datosSociales" JSONB NOT NULL,
    "datosGobernanza" JSONB NOT NULL,
    "emisionesTotales" DOUBLE PRECISION NOT NULL,
    "consumoEnergia" DOUBLE PRECISION NOT NULL,
    "energiaRenovable" DOUBLE PRECISION NOT NULL,
    "aguaConsumida" DOUBLE PRECISION NOT NULL,
    "residuosGenerados" DOUBLE PRECISION NOT NULL,
    "residuosReciclados" DOUBLE PRECISION NOT NULL,
    "normativa" TEXT,
    "cumple" BOOLEAN NOT NULL DEFAULT false,
    "formato" TEXT NOT NULL DEFAULT 'GRI',
    "idioma" TEXT NOT NULL DEFAULT 'es',
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "archivoUrl" TEXT,
    "generadoPor" TEXT,
    "revisadoPor" TEXT,
    "aprobadoPor" TEXT,
    "fechaPublicacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esg_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "green_providers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "web" TEXT,
    "direccion" TEXT,
    "certificaciones" JSONB,
    "oferta" JSONB NOT NULL,
    "ratingESG" DOUBLE PRECISION,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "green_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_tokens" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT,
    "buildingId" TEXT,
    "nombre" TEXT NOT NULL,
    "simbolo" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "blockchain" TEXT NOT NULL DEFAULT 'Polygon',
    "contractAddress" TEXT,
    "tokenStandard" TEXT NOT NULL DEFAULT 'ERC-20',
    "totalSupply" INTEGER NOT NULL,
    "tokensPorPropiedad" INTEGER NOT NULL,
    "precioPorToken" DOUBLE PRECISION NOT NULL,
    "valorPropiedad" DOUBLE PRECISION NOT NULL,
    "valorActual" DOUBLE PRECISION,
    "estado" TEXT NOT NULL DEFAULT 'draft',
    "fechaEmision" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "rentaDistribuida" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ultimaDistribucion" TIMESTAMP(3),
    "frecuenciaDistribucion" TEXT NOT NULL DEFAULT 'monthly',
    "documentos" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_holders" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "tenantId" TEXT,
    "walletAddress" TEXT NOT NULL,
    "email" TEXT,
    "nombre" TEXT,
    "cantidadTokens" INTEGER NOT NULL,
    "porcentajePropiedad" DOUBLE PRECISION NOT NULL,
    "valorInvertido" DOUBLE PRECISION NOT NULL,
    "rentasRecibidas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ultimaRenta" TIMESTAMP(3),
    "kycVerificado" BOOLEAN NOT NULL DEFAULT false,
    "fechaKYC" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaAdquisicion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_holders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_transactions" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "cantidadTokens" INTEGER NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "montoTotal" DOUBLE PRECISION NOT NULL,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'pending',
    "gasFee" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smart_contracts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "blockchain" TEXT NOT NULL DEFAULT 'Polygon',
    "contractAddress" TEXT NOT NULL,
    "abi" JSONB NOT NULL,
    "bytecode" TEXT,
    "deployedBy" TEXT,
    "deploymentTx" TEXT,
    "deploymentDate" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'active',
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "gasUsed" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smart_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nft_certificates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "unitId" TEXT,
    "buildingId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tokenId" TEXT,
    "contractAddress" TEXT,
    "metadataUrl" TEXT,
    "imageUrl" TEXT,
    "propietario" TEXT,
    "walletAddress" TEXT,
    "mintedAt" TIMESTAMP(3),
    "txHash" TEXT,
    "atributos" JSONB,
    "estado" TEXT NOT NULL DEFAULT 'minted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nft_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT,
    "canal" TEXT NOT NULL DEFAULT 'web',
    "idioma" TEXT NOT NULL DEFAULT 'es',
    "contexto" JSONB,
    "memoria" JSONB,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "sentimiento" TEXT,
    "satisfaccion" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "tokenUsados" INTEGER,
    "modelo" TEXT DEFAULT 'gpt-4-turbo',
    "funciones" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_commands" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "comando" TEXT NOT NULL,
    "parametros" JSONB,
    "funcion" TEXT NOT NULL,
    "resultado" JSONB,
    "exitoso" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "ejecutadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_interactions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "audioUrl" TEXT,
    "duracion" INTEGER,
    "transcripcion" TEXT,
    "idioma" TEXT NOT NULL DEFAULT 'es',
    "respuestaTexto" TEXT,
    "respuestaAudio" TEXT,
    "comando" TEXT,
    "exitoso" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circular_marketplaces" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "circular_marketplaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circular_items" (
    "id" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "tenantId" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'disponible',
    "condicion" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'intercambio',
    "precioMoneda" DOUBLE PRECISION,
    "precioPuntos" INTEGER,
    "fotos" TEXT[],
    "ubicacion" TEXT,
    "interesados" TEXT[],
    "reservadoPor" TEXT,
    "fechaReserva" TIMESTAMP(3),
    "transaccionCompletada" BOOLEAN NOT NULL DEFAULT false,
    "fechaTransaccion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "circular_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "urban_gardens" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "ubicacion" TEXT NOT NULL,
    "metrosCuadrados" DOUBLE PRECISION NOT NULL,
    "tipoCultivo" TEXT NOT NULL DEFAULT 'organico',
    "fotos" TEXT[],
    "reglas" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "urban_gardens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garden_plots" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "numeroParcela" TEXT NOT NULL,
    "metrosCuadrados" DOUBLE PRECISION NOT NULL,
    "tenantId" TEXT,
    "reservadaDesde" TIMESTAMP(3),
    "reservadaHasta" TIMESTAMP(3),
    "cultivos" JSONB,
    "calendaroSiembra" JSONB,
    "estado" TEXT NOT NULL DEFAULT 'disponible',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garden_plots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recycling_metrics" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "periodo" TEXT NOT NULL,
    "residuosGenerados" DOUBLE PRECISION NOT NULL,
    "residuosReciclados" DOUBLE PRECISION NOT NULL,
    "residuosOrganicos" DOUBLE PRECISION NOT NULL,
    "tasaReciclaje" DOUBLE PRECISION NOT NULL,
    "participantes" INTEGER,
    "puntosOtorgados" INTEGER,
    "ahorrosCO2" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recycling_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_posts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "authorId" TEXT,
    "buildingId" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'post',
    "contenido" TEXT NOT NULL,
    "multimedia" TEXT[],
    "likes" INTEGER NOT NULL DEFAULT 0,
    "likedBy" TEXT[],
    "hashtags" TEXT[],
    "visibilidad" TEXT NOT NULL DEFAULT 'building',
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "moderado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT,
    "contenido" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_reputations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "nivel" TEXT NOT NULL DEFAULT 'novato',
    "serviciosOfrecidos" INTEGER NOT NULL DEFAULT 0,
    "serviciosRecibidos" INTEGER NOT NULL DEFAULT 0,
    "valoracionPromedio" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_reputations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "reputationId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "icono" TEXT,
    "obtenidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p2p_services" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'EUR',
    "duracion" INTEGER,
    "unidadDuracion" TEXT,
    "disponibilidad" JSONB,
    "fotos" TEXT[],
    "rating" DOUBLE PRECISION,
    "numValoraciones" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "p2p_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p2p_bookings" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "fechaReserva" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT,
    "horaFin" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "comision" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fechaPago" TIMESTAMP(3),
    "metodoPago" TEXT,
    "valoracion" INTEGER,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "p2p_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_events" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT,
    "ubicacion" TEXT NOT NULL,
    "capacidadMaxima" INTEGER,
    "asistentesConfirmados" TEXT[],
    "asistentesLista" INTEGER NOT NULL DEFAULT 0,
    "precio" DOUBLE PRECISION,
    "requierePago" BOOLEAN NOT NULL DEFAULT false,
    "fotos" TEXT[],
    "estado" TEXT NOT NULL DEFAULT 'programado',
    "organizadoPor" TEXT,
    "valoraciones" JSONB,
    "ratingPromedio" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassadors" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "buildingId" TEXT,
    "fechaNombramiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referidos" INTEGER NOT NULL DEFAULT 0,
    "referidosActivos" INTEGER NOT NULL DEFAULT 0,
    "comisionGanada" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comisionPorReferido" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "capacitaciones" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambassadors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biometric_verifications" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "tipo" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "metadata" JSONB,
    "documentoVerificado" TEXT,
    "proveedor" TEXT DEFAULT 'Veriff',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "biometric_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gdpr_consents" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "consentido" BOOLEAN NOT NULL,
    "version" TEXT,
    "idioma" TEXT NOT NULL DEFAULT 'es',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "evidencia" TEXT,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "fechaRevocacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gdpr_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_alerts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "riesgo" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "razon" TEXT NOT NULL,
    "detalles" JSONB,
    "factores" TEXT[],
    "revisado" BOOLEAN NOT NULL DEFAULT false,
    "revisadoPor" TEXT,
    "fechaRevision" TIMESTAMP(3),
    "accionTomada" TEXT,
    "notas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'abierto',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_audits" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "alcance" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "auditor" TEXT,
    "herramienta" TEXT,
    "vulnerabilidades" JSONB,
    "numCriticas" INTEGER NOT NULL DEFAULT 0,
    "numAltas" INTEGER NOT NULL DEFAULT 0,
    "numMedias" INTEGER NOT NULL DEFAULT 0,
    "numBajas" INTEGER NOT NULL DEFAULT 0,
    "recomendaciones" JSONB,
    "scoreSeguridad" DOUBLE PRECISION,
    "reporteUrl" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'en_progreso',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_incidents" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "severidad" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "afectados" JSONB,
    "datosComprometidos" JSONB,
    "detectadoPor" TEXT,
    "fechaDeteccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaIncidente" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'detectado',
    "responsable" TEXT,
    "fechaAsignacion" TIMESTAMP(3),
    "accionesCorrectivas" JSONB,
    "fechaResolucion" TIMESTAMP(3),
    "notificadoGDPR" BOOLEAN NOT NULL DEFAULT false,
    "fechaNotificacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_business_models" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "businessModel" "BusinessModel" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "configuracion" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_business_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_listings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipoPropiedad" TEXT NOT NULL,
    "capacidadMaxima" INTEGER NOT NULL,
    "numDormitorios" INTEGER NOT NULL,
    "numCamas" INTEGER NOT NULL,
    "numBanos" INTEGER NOT NULL,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reglasHospedaje" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "precioPorNoche" DOUBLE PRECISION NOT NULL,
    "precioSemana" DOUBLE PRECISION,
    "precioMes" DOUBLE PRECISION,
    "tarifaLimpieza" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositoSeguridad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comisionPlataforma" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "checkInTime" TEXT NOT NULL DEFAULT '15:00',
    "checkOutTime" TEXT NOT NULL DEFAULT '11:00',
    "cancelacionFlexible" BOOLEAN NOT NULL DEFAULT true,
    "reservaInstantanea" BOOLEAN NOT NULL DEFAULT false,
    "sincronizarCanales" BOOLEAN NOT NULL DEFAULT true,
    "canalPrincipal" "ChannelType",
    "totalReservas" INTEGER NOT NULL DEFAULT 0,
    "ratingPromedio" DOUBLE PRECISION,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "tasaOcupacion" DOUBLE PRECISION,
    "pricingRules" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "str_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_bookings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "canal" "ChannelType" NOT NULL,
    "reservaExternaId" TEXT,
    "guestNombre" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestTelefono" TEXT,
    "guestPais" TEXT,
    "numHuespedes" INTEGER NOT NULL,
    "checkInDate" TIMESTAMP(3) NOT NULL,
    "checkOutDate" TIMESTAMP(3) NOT NULL,
    "numNoches" INTEGER NOT NULL,
    "precioTotal" DOUBLE PRECISION NOT NULL,
    "tarifaNocturna" DOUBLE PRECISION NOT NULL,
    "tarifaLimpieza" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tasasImpuestos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comisionCanal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ingresoNeto" DOUBLE PRECISION NOT NULL,
    "metodoPago" TEXT,
    "estadoPago" TEXT NOT NULL DEFAULT 'pendiente',
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "estado" "BookingStatus" NOT NULL DEFAULT 'PENDIENTE',
    "confirmadaEn" TIMESTAMP(3),
    "checkInRealizado" TIMESTAMP(3),
    "checkOutRealizado" TIMESTAMP(3),
    "canceladaEn" TIMESTAMP(3),
    "motivoCancelacion" TEXT,
    "notasEspeciales" TEXT,
    "requiereLimpieza" BOOLEAN NOT NULL DEFAULT true,
    "limpiezaRealizada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "str_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_calendar" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "precioPorNoche" DOUBLE PRECISION NOT NULL,
    "minimoNoches" INTEGER NOT NULL DEFAULT 1,
    "notas" TEXT,
    "sincronizado" BOOLEAN NOT NULL DEFAULT false,
    "ultimaSync" TIMESTAMP(3),

    CONSTRAINT "str_calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_channel_sync" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "canal" "ChannelType" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "url" TEXT,
    "apiKey" TEXT,
    "externalId" TEXT,
    "sincronizarPrecio" BOOLEAN NOT NULL DEFAULT true,
    "sincronizarCalendario" BOOLEAN NOT NULL DEFAULT true,
    "sincronizarReservas" BOOLEAN NOT NULL DEFAULT true,
    "ultimaSync" TIMESTAMP(3),
    "proximaSync" TIMESTAMP(3),
    "estadoSync" TEXT NOT NULL DEFAULT 'pendiente',
    "erroresSync" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "str_channel_sync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_reviews" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "bookingId" TEXT,
    "canal" "ChannelType" NOT NULL,
    "guestNombre" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "ratingLimpieza" INTEGER,
    "ratingComunicacion" INTEGER,
    "ratingUbicacion" INTEGER,
    "ratingPrecio" INTEGER,
    "respuesta" TEXT,
    "respondidoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "str_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_season_pricing" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "temporada" "SeasonType" NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaInicio" DATE NOT NULL,
    "fechaFin" DATE NOT NULL,
    "precioPorNoche" DOUBLE PRECISION NOT NULL,
    "minimoNoches" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "str_season_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_sync_history" (
    "id" TEXT NOT NULL,
    "channelSyncId" TEXT NOT NULL,
    "tipoEvento" "SyncEventType" NOT NULL,
    "direccion" "ChannelSyncDirection" NOT NULL DEFAULT 'push',
    "payload" JSONB,
    "respuesta" JSONB,
    "exitoso" BOOLEAN NOT NULL DEFAULT false,
    "mensajeError" TEXT,
    "codigoError" TEXT,
    "reintentos" INTEGER NOT NULL DEFAULT 0,
    "iniciadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadoEn" TIMESTAMP(3),
    "duracionMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "str_sync_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_channel_pricing" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "canal" "ChannelType" NOT NULL,
    "ajusteTipo" TEXT NOT NULL DEFAULT 'porcentaje',
    "ajusteValor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comisionCanal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "compensarComision" BOOLEAN NOT NULL DEFAULT false,
    "precioMinimo" DOUBLE PRECISION,
    "precioMaximo" DOUBLE PRECISION,
    "descuentoSemana" DOUBLE PRECISION,
    "descuentoMes" DOUBLE PRECISION,
    "descuentoLastMin" DOUBLE PRECISION,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "str_channel_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_dynamic_pricing_rules" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "condiciones" JSONB NOT NULL,
    "accionTipo" TEXT NOT NULL,
    "accionValor" DOUBLE PRECISION NOT NULL,
    "aplicarCanales" "ChannelType"[] DEFAULT ARRAY[]::"ChannelType"[],
    "diasSemana" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "str_dynamic_pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_competitor_analysis" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "competidorUrl" TEXT NOT NULL,
    "competidorNombre" TEXT,
    "canal" "ChannelType" NOT NULL,
    "precioCapturado" DOUBLE PRECISION NOT NULL,
    "ocupacionEstimada" DOUBLE PRECISION,
    "ratingCapturado" DOUBLE PRECISION,
    "fechaCaptura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "str_competitor_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_channel_metrics" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "canal" "ChannelType" NOT NULL,
    "periodo" DATE NOT NULL,
    "reservasRecibidas" INTEGER NOT NULL DEFAULT 0,
    "reservasCanceladas" INTEGER NOT NULL DEFAULT 0,
    "reservasModificadas" INTEGER NOT NULL DEFAULT 0,
    "nochesReservadas" INTEGER NOT NULL DEFAULT 0,
    "ingresosBrutos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comisionesCanal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ingresosNetos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tasaOcupacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewsRecibidas" INTEGER NOT NULL DEFAULT 0,
    "ratingPromedio" DOUBLE PRECISION,
    "impresiones" INTEGER,
    "clics" INTEGER,
    "conversionRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "str_channel_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_housekeeping_tasks" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "bookingId" TEXT,
    "tipo" "TurnoverType" NOT NULL DEFAULT 'check_out',
    "status" "HousekeepingStatus" NOT NULL DEFAULT 'pendiente',
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "asignadoA" TEXT,
    "asignadoNombre" TEXT,
    "notas" TEXT,
    "instruccionesEspeciales" TEXT,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "checklistCompletado" JSONB,
    "fotosAntes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fotosDespues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tiempoEstimadoMin" INTEGER,
    "tiempoRealMin" INTEGER,
    "costoMateriales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoManoObra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "ubicacionCheckIn" JSONB,
    "incidencias" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiereAtencion" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "str_housekeeping_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_housekeeping_staff" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT NOT NULL,
    "foto" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'interno',
    "empresaNombre" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "diasDisponibles" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "horaInicio" TEXT NOT NULL DEFAULT '08:00',
    "horaFin" TEXT NOT NULL DEFAULT '18:00',
    "capacidadDiaria" INTEGER NOT NULL DEFAULT 4,
    "zonasTrabajo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tarifaPorTurnover" DOUBLE PRECISION,
    "tarifaPorHora" DOUBLE PRECISION,
    "tareasCompletadas" INTEGER NOT NULL DEFAULT 0,
    "calificacionPromedio" DOUBLE PRECISION,
    "tiempoPromedioMin" INTEGER,
    "pinAcceso" TEXT,
    "appToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "str_housekeeping_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_housekeeping_inventory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "listingId" TEXT,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "sku" TEXT,
    "stockActual" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 5,
    "stockOptimo" INTEGER,
    "ubicacion" TEXT,
    "costoUnitario" DOUBLE PRECISION,
    "proveedorId" TEXT,
    "fechaUltimoConteo" TIMESTAMP(3),
    "alertaStockBajo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "str_housekeeping_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_inventory_movements" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT,
    "taskId" TEXT,
    "registradoPor" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "str_inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_housekeeping_checklists" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TurnoverType" NOT NULL DEFAULT 'check_out',
    "items" JSONB NOT NULL,
    "tiempoEstimadoMin" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "str_housekeeping_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flipping_projects" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT,
    "buildingId" TEXT,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioCompra" DOUBLE PRECISION NOT NULL,
    "gastosCompra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaCompra" TIMESTAMP(3),
    "presupuestoRenovacion" DOUBLE PRECISION NOT NULL,
    "gastosRealesRenovacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioVentaEstimado" DOUBLE PRECISION NOT NULL,
    "precioVentaReal" DOUBLE PRECISION,
    "gastosVenta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaVenta" TIMESTAMP(3),
    "financiado" BOOLEAN NOT NULL DEFAULT false,
    "montoFinanciacion" DOUBLE PRECISION,
    "interesAnual" DOUBLE PRECISION,
    "fechaInicioObra" TIMESTAMP(3),
    "fechaFinObra" TIMESTAMP(3),
    "duracionEstimada" INTEGER,
    "duracionReal" INTEGER,
    "inversionTotal" DOUBLE PRECISION,
    "beneficioNeto" DOUBLE PRECISION,
    "roiPorcentaje" DOUBLE PRECISION,
    "estado" "ProjectStatus" NOT NULL DEFAULT 'PROSPECTO',
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "fotosAntes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fotosDespues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documentos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completadoEn" TIMESTAMP(3),

    CONSTRAINT "flipping_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flipping_renovations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "categoria" "RenovationCategory" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "presupuestado" DOUBLE PRECISION NOT NULL,
    "costoReal" DOUBLE PRECISION,
    "proveedorNombre" TEXT,
    "proveedorId" TEXT,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "porcentajeAvance" INTEGER NOT NULL DEFAULT 0,
    "notas" TEXT,
    "fotosProgreso" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flipping_renovations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flipping_expenses" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "proveedor" TEXT,
    "factura" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flipping_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flipping_milestones" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaPrevista" TIMESTAMP(3) NOT NULL,
    "fechaCompletado" TIMESTAMP(3),
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flipping_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_projects" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipoProyecto" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "parcela" TEXT,
    "referenciaCatastral" TEXT,
    "numViviendas" INTEGER,
    "metrosConstruidos" DOUBLE PRECISION,
    "numPlantas" INTEGER,
    "presupuestoTotal" DOUBLE PRECISION NOT NULL,
    "gastosReales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "desviacionPresupuesto" DOUBLE PRECISION,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFinPrevista" TIMESTAMP(3) NOT NULL,
    "fechaFinReal" TIMESTAMP(3),
    "duracionMeses" INTEGER NOT NULL,
    "faseActual" "ConstructionPhase" NOT NULL DEFAULT 'PLANIFICACION',
    "porcentajeAvance" INTEGER NOT NULL DEFAULT 0,
    "licenciaObra" BOOLEAN NOT NULL DEFAULT false,
    "certificadoFinal" BOOLEAN NOT NULL DEFAULT false,
    "habitabilidad" BOOLEAN NOT NULL DEFAULT false,
    "planos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "permisos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certificaciones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fotosProgreso" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "arquitecto" TEXT,
    "aparejador" TEXT,
    "constructor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "construction_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_work_orders" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fase" "ConstructionPhase" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "subcontratista" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "presupuesto" DOUBLE PRECISION NOT NULL,
    "costoReal" DOUBLE PRECISION,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "porcentajeAvance" INTEGER NOT NULL DEFAULT 0,
    "certificadoCalidad" BOOLEAN NOT NULL DEFAULT false,
    "inspeccionada" BOOLEAN NOT NULL DEFAULT false,
    "documentos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fotosEvidencia" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "construction_work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_inspections" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fase" "ConstructionPhase" NOT NULL,
    "tipo" TEXT NOT NULL,
    "inspector" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "resultado" TEXT NOT NULL,
    "observaciones" TEXT,
    "defectosEncontrados" INTEGER NOT NULL DEFAULT 0,
    "defectosCorregidos" INTEGER NOT NULL DEFAULT 0,
    "documentacion" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "construction_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_suppliers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoSuministro" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "descripcion" TEXT NOT NULL,
    "presupuesto" DOUBLE PRECISION NOT NULL,
    "fechaEntrega" TIMESTAMP(3) NOT NULL,
    "entregado" BOOLEAN NOT NULL DEFAULT false,
    "factura" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "construction_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_projects" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "clienteEmail" TEXT NOT NULL,
    "clienteTelefono" TEXT,
    "tipo" "ProjectType" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "municipio" TEXT,
    "provincia" TEXT,
    "honorarios" DOUBLE PRECISION NOT NULL,
    "gastos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaEntrega" TIMESTAMP(3) NOT NULL,
    "estado" "ProjectProfessionalStatus" NOT NULL DEFAULT 'PROPUESTA',
    "porcentajeAvance" INTEGER NOT NULL DEFAULT 0,
    "responsable" TEXT NOT NULL,
    "colaboradores" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "planos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "informes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certificados" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_deliverables" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaLimite" TIMESTAMP(3) NOT NULL,
    "entregado" BOOLEAN NOT NULL DEFAULT false,
    "fechaEntrega" TIMESTAMP(3),
    "archivo" TEXT,
    "comentarios" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_meetings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "duracion" INTEGER NOT NULL,
    "ubicacion" TEXT,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "enlaceReunion" TEXT,
    "asistentes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "agenda" TEXT,
    "acta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "nombre" TEXT,
    "superficie" DOUBLE PRECISION NOT NULL,
    "tipoHabitacion" TEXT NOT NULL,
    "bajoPrivado" BOOLEAN NOT NULL DEFAULT false,
    "balcon" BOOLEAN NOT NULL DEFAULT false,
    "escritorio" BOOLEAN NOT NULL DEFAULT false,
    "armarioEmpotrado" BOOLEAN NOT NULL DEFAULT false,
    "aireAcondicionado" BOOLEAN NOT NULL DEFAULT false,
    "calefaccion" BOOLEAN NOT NULL DEFAULT false,
    "amueblada" BOOLEAN NOT NULL DEFAULT true,
    "cama" TEXT,
    "mesaNoche" BOOLEAN NOT NULL DEFAULT false,
    "cajonera" BOOLEAN NOT NULL DEFAULT false,
    "estanteria" BOOLEAN NOT NULL DEFAULT false,
    "silla" BOOLEAN NOT NULL DEFAULT false,
    "precioPorMes" DOUBLE PRECISION NOT NULL,
    "precioPorSemana" DOUBLE PRECISION,
    "estado" "RoomStatus" NOT NULL DEFAULT 'disponible',
    "imagenes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_contracts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "rentaMensual" DOUBLE PRECISION NOT NULL,
    "diaPago" INTEGER NOT NULL DEFAULT 1,
    "deposito" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gastosIncluidos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "normasConvivencia" TEXT,
    "horariosVisitas" TEXT,
    "permiteMascotas" BOOLEAN NOT NULL DEFAULT false,
    "permiteFumar" BOOLEAN NOT NULL DEFAULT false,
    "frecuenciaLimpieza" TEXT,
    "rotacionLimpieza" JSONB,
    "estado" "RoomContractStatus" NOT NULL DEFAULT 'activo',
    "documentoURL" TEXT,
    "firmadoFecha" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_payments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL DEFAULT 'Renta mensual',
    "mes" TIMESTAMP(3) NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "montoProrrateoLuz" DOUBLE PRECISION,
    "montoProrrateoAgua" DOUBLE PRECISION,
    "montoProrrateoGas" DOUBLE PRECISION,
    "montoProrrateoInternet" DOUBLE PRECISION,
    "montoProrrateoLimpieza" DOUBLE PRECISION,
    "estado" "PaymentStatus" NOT NULL DEFAULT 'pendiente',
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "metodoPago" "RoomPaymentMethod",
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_shared_spaces" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "superficie" DOUBLE PRECISION,
    "nevera" BOOLEAN NOT NULL DEFAULT false,
    "horno" BOOLEAN NOT NULL DEFAULT false,
    "microondas" BOOLEAN NOT NULL DEFAULT false,
    "lavadora" BOOLEAN NOT NULL DEFAULT false,
    "secadora" BOOLEAN NOT NULL DEFAULT false,
    "lavavajillas" BOOLEAN NOT NULL DEFAULT false,
    "television" BOOLEAN NOT NULL DEFAULT false,
    "sofa" BOOLEAN NOT NULL DEFAULT false,
    "mesaComedor" BOOLEAN NOT NULL DEFAULT false,
    "normasUso" TEXT,
    "horarioAcceso" TEXT,
    "capacidadMaxima" INTEGER,
    "imagenes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_shared_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_company_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "roleInCompany" "UserRole" NOT NULL DEFAULT 'gestor',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccess" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_company_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_media_accounts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "platform" "SocialMediaPlatform" NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "pageId" TEXT,
    "businessAccountId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_media_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_media_posts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "estado" "SocialPostStatus" NOT NULL DEFAULT 'borrador',
    "mensaje" TEXT NOT NULL,
    "imagenesUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoUrl" TEXT,
    "enlace" TEXT,
    "fechaProgramada" TIMESTAMP(3),
    "fechaPublicacion" TIMESTAMP(3),
    "postId" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comentarios" INTEGER NOT NULL DEFAULT 0,
    "compartidos" INTEGER NOT NULL DEFAULT 0,
    "alcance" INTEGER NOT NULL DEFAULT 0,
    "impresiones" INTEGER NOT NULL DEFAULT 0,
    "creadoPor" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_media_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_coupons" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "CouponType" NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT,
    "usosMaximos" INTEGER,
    "usosActuales" INTEGER NOT NULL DEFAULT 0,
    "usosPorUsuario" INTEGER NOT NULL DEFAULT 1,
    "montoMinimo" DOUBLE PRECISION,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaExpiracion" TIMESTAMP(3) NOT NULL,
    "aplicaATodos" BOOLEAN NOT NULL DEFAULT true,
    "unidadesPermitidas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "planesPermitidos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "estado" "CouponStatus" NOT NULL DEFAULT 'activo',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_usages" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT,
    "contractId" TEXT,
    "paymentId" TEXT,
    "montoOriginal" DOUBLE PRECISION NOT NULL,
    "montoDescuento" DOUBLE PRECISION NOT NULL,
    "montoFinal" DOUBLE PRECISION NOT NULL,
    "aplicadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2BInvoice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "numeroFactura" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "periodo" TEXT NOT NULL,
    "subscriptionPlanId" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impuestos" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "estado" "InvoiceStatus" NOT NULL DEFAULT 'PENDIENTE',
    "metodoPago" TEXT,
    "fechaPago" TIMESTAMP(3),
    "stripeInvoiceId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripePdfUrl" TEXT,
    "conceptos" JSONB NOT NULL,
    "notas" TEXT,
    "terminosPago" TEXT DEFAULT '30 días',
    "recordatoriosEnviados" INTEGER NOT NULL DEFAULT 0,
    "ultimoRecordatorio" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "B2BInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2BPaymentHistory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "monto" DOUBLE PRECISION NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referencia" TEXT,
    "stripePaymentId" TEXT,
    "stripeChargeId" TEXT,
    "stripeFee" DOUBLE PRECISION,
    "stripeNetAmount" DOUBLE PRECISION,
    "estado" TEXT NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "B2BPaymentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2BSubscriptionHistory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "planAnteriorId" TEXT,
    "planNuevoId" TEXT,
    "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "razon" TEXT,
    "costoAdicional" DOUBLE PRECISION,
    "realizadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "B2BSubscriptionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2BFinancialReport" (
    "id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "tipoReporte" TEXT NOT NULL,
    "ingresosBrutos" DOUBLE PRECISION NOT NULL,
    "descuentosTotal" DOUBLE PRECISION NOT NULL,
    "impuestosTotal" DOUBLE PRECISION NOT NULL,
    "ingresosNetos" DOUBLE PRECISION NOT NULL,
    "empresasActivas" INTEGER NOT NULL,
    "empresasNuevas" INTEGER NOT NULL,
    "empresasCanceladas" INTEGER NOT NULL,
    "tasaRetencion" DOUBLE PRECISION NOT NULL,
    "facturasEmitidas" INTEGER NOT NULL,
    "facturasPagadas" INTEGER NOT NULL,
    "facturasVencidas" INTEGER NOT NULL,
    "ticketPromedio" DOUBLE PRECISION NOT NULL,
    "crecimientoMoM" DOUBLE PRECISION,
    "crecimientoYoY" DOUBLE PRECISION,
    "detalles" JSONB NOT NULL,
    "fechaGeneracion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "B2BFinancialReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "nombreRemitente" TEXT NOT NULL,
    "emailRemitente" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "prioridad" "SuggestionPriority" NOT NULL DEFAULT 'media',
    "estado" "SuggestionStatus" NOT NULL DEFAULT 'pendiente',
    "respuesta" TEXT,
    "respondidoPor" TEXT,
    "fechaRespuesta" TIMESTAMP(3),
    "navegador" TEXT,
    "sistemaOperativo" TEXT,
    "urlOrigen" TEXT,
    "votos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "empresa" TEXT,
    "cargo" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "codigoPostal" TEXT,
    "pais" TEXT DEFAULT 'España',
    "fuente" TEXT NOT NULL,
    "origenDetalle" TEXT,
    "paginaOrigen" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'nuevo',
    "etapa" TEXT NOT NULL DEFAULT 'contacto_inicial',
    "puntuacion" INTEGER NOT NULL DEFAULT 0,
    "temperatura" TEXT NOT NULL DEFAULT 'frio',
    "tipoNegocio" TEXT,
    "verticalesInteres" TEXT[],
    "numeroUnidades" INTEGER,
    "presupuestoMensual" DOUBLE PRECISION,
    "urgencia" TEXT DEFAULT 'media',
    "notas" TEXT,
    "motivoPerdida" TEXT,
    "probabilidadCierre" DOUBLE PRECISION,
    "fechaEstimadaCierre" TIMESTAMP(3),
    "asignadoA" TEXT,
    "ultimoContacto" TIMESTAMP(3),
    "proximoSeguimiento" TIMESTAMP(3),
    "numeroContactos" INTEGER NOT NULL DEFAULT 0,
    "conversacionId" TEXT,
    "mensajeInicial" TEXT,
    "preguntasFrecuentes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "resultado" TEXT,
    "duracion" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_documents" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamano" INTEGER,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "vertical" TEXT NOT NULL DEFAULT 'residencial',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL DEFAULT 0,
    "completedSteps" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "autoResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankConsent" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "consentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "scaRedirectUrl" TEXT,
    "validUntil" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankPayment" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "debtorIban" TEXT NOT NULL,
    "creditorIban" TEXT NOT NULL,
    "creditorName" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "scaRedirectUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantInvitation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invitationCode" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pendiente',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "TenantInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRating" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" "ServiceRatingType" NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "respuestaAdmin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantOnboarding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL DEFAULT 5,
    "steps" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TenantOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_password_reset_tokens" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_availability" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "estado" "ProviderAvailabilityStatus" NOT NULL DEFAULT 'disponible',
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "motivo" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "provider_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_invoices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "numeroFactura" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "conceptos" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "iva" DOUBLE PRECISION NOT NULL DEFAULT 21.0,
    "montoIva" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "estado" "ProviderInvoiceStatus" NOT NULL DEFAULT 'borrador',
    "fechaAprobacion" TIMESTAMP(3),
    "aprobadoPor" TEXT,
    "fechaPago" TIMESTAMP(3),
    "metodoPago" TEXT,
    "referenciaago" TEXT,
    "pdfUrl" TEXT,
    "notas" TEXT,
    "motivoRechazo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_invoice_payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodoPago" TEXT NOT NULL,
    "referencia" TEXT,
    "notas" TEXT,
    "registradoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_invoice_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_quotes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "conceptos" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "iva" DOUBLE PRECISION NOT NULL DEFAULT 21.0,
    "montoIva" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "fechaVencimiento" TIMESTAMP(3),
    "archivos" TEXT[],
    "notas" TEXT,
    "motivoRechazo" TEXT,
    "fechaAprobacion" TIMESTAMP(3),
    "aprobadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_reviews" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "puntuacion" INTEGER NOT NULL,
    "puntualidad" INTEGER,
    "calidad" INTEGER,
    "comunicacion" INTEGER,
    "precio" INTEGER,
    "profesionalismo" INTEGER,
    "comentario" TEXT,
    "aspectosPositivos" TEXT[],
    "aspectosMejorar" TEXT[],
    "respuesta" TEXT,
    "fechaRespuesta" TIMESTAMP(3),
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "evaluadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_chat_conversations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "ultimoMensaje" TEXT,
    "ultimoMensajeFecha" TIMESTAMP(3),
    "noLeidosProveedor" INTEGER NOT NULL DEFAULT 0,
    "noLeidosGestor" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_chat_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "remitenteProveedor" BOOLEAN NOT NULL,
    "remitenteId" TEXT NOT NULL,
    "remitenteNombre" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "archivos" TEXT[],
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "fechaLeido" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owners" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "dni" TEXT,
    "direccion" TEXT,
    "password" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
    "notificarPagos" BOOLEAN NOT NULL DEFAULT true,
    "notificarOcupacion" BOOLEAN NOT NULL DEFAULT true,
    "notificarMantenimiento" BOOLEAN NOT NULL DEFAULT true,
    "notificarVencimientos" BOOLEAN NOT NULL DEFAULT true,
    "idioma" TEXT NOT NULL DEFAULT 'es',
    "zona" TEXT,
    "lastLogin" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockoutUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_buildings" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "porcentajePropiedad" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "verIngresos" BOOLEAN NOT NULL DEFAULT true,
    "verGastos" BOOLEAN NOT NULL DEFAULT true,
    "verOcupacion" BOOLEAN NOT NULL DEFAULT true,
    "verMantenimiento" BOOLEAN NOT NULL DEFAULT true,
    "verDocumentos" BOOLEAN NOT NULL DEFAULT false,
    "asignadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asignadoPor" TEXT,

    CONSTRAINT "owner_buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_notifications" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" "NotificationType" NOT NULL,
    "buildingId" TEXT,
    "paymentId" TEXT,
    "contractId" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fechaLeida" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owner_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_alerts" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "umbralValor" DOUBLE PRECISION,
    "umbralPorcentaje" DOUBLE PRECISION,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "ultimaActivacion" TIMESTAMP(3),
    "vecesActivada" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owner_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "plantillaId" TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerConfig" JSONB NOT NULL,
    "condiciones" JSONB,
    "acciones" JSONB NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "notificarEjecucion" BOOLEAN NOT NULL DEFAULT false,
    "vecesEjecutada" INTEGER NOT NULL DEFAULT 0,
    "ultimaEjecucion" TIMESTAMP(3),
    "proximaEjecucion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_executions" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "mensaje" TEXT,
    "detalles" JSONB,
    "duracion" INTEGER,
    "contexto" JSONB,
    "ejecutadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_templates" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "icono" TEXT,
    "plantilla" JSONB NOT NULL,
    "parametros" JSONB,
    "vertical" TEXT,
    "nivelAcceso" TEXT NOT NULL DEFAULT 'todos',
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "vecesUsada" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "tipoEvento" TEXT NOT NULL,
    "condiciones" JSONB NOT NULL,
    "diasAnticipo" INTEGER,
    "canales" JSONB NOT NULL,
    "rolesDestinatarios" TEXT[],
    "usuariosEspecificos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "templateId" TEXT,
    "asunto" TEXT,
    "mensaje" TEXT NOT NULL,
    "prioridad" "RiskLevel" NOT NULL DEFAULT 'bajo',
    "vecesEjecutada" INTEGER NOT NULL DEFAULT 0,
    "ultimaEjecucion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT NOT NULL,

    CONSTRAINT "notification_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "asuntoEmail" TEXT,
    "mensajeEmail" TEXT,
    "mensajePush" TEXT,
    "mensajeSMS" TEXT,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "esPlantillaGlobal" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "vecesUsada" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "ruleId" TEXT,
    "templateId" TEXT,
    "tipo" "NotificationType" NOT NULL,
    "canal" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "asunto" TEXT,
    "mensaje" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 1,
    "errorMsg" TEXT,
    "metadatos" JSONB,
    "costoSMS" DECIMAL(10,4),
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fechaLeida" TIMESTAMP(3),
    "accionTomada" TEXT,
    "enviadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '08:00',
    "quietDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "batchNotifications" BOOLEAN NOT NULL DEFAULT false,
    "batchInterval" INTEGER NOT NULL DEFAULT 60,
    "language" TEXT NOT NULL DEFAULT 'es',
    "customRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_interactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "intent" TEXT,
    "sentiment" TEXT,
    "urgency" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_minutes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "numeroActa" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "convocatoria" TEXT NOT NULL,
    "asistentes" JSONB NOT NULL,
    "ordenDia" JSONB NOT NULL,
    "acuerdos" JSONB NOT NULL,
    "estado" "ActaEstado" NOT NULL DEFAULT 'borrador',
    "documentos" JSONB,
    "firmasDigitales" JSONB,
    "creadoPor" TEXT NOT NULL,
    "aprobadoPor" TEXT,
    "fechaAprobacion" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_minutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_fees" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "unitId" TEXT,
    "tipo" "CuotaTipo" NOT NULL,
    "periodo" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "importeBase" DOUBLE PRECISION NOT NULL,
    "coeficiente" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "importeTotal" DOUBLE PRECISION NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "estado" "PaymentStatus" NOT NULL DEFAULT 'pendiente',
    "metodoPago" TEXT,
    "referenciaPago" TEXT,
    "gastosCorrientes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fondoReserva" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seguros" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mantenimiento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otros" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_funds" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "tipo" "FondoTipo" NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "saldoActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoObjetivo" DOUBLE PRECISION,
    "aportacionMensual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAportaciones" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalGastos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "movimientos" JSONB NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_funds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_alerts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "severidad" "RiskLevel" NOT NULL,
    "monto" DOUBLE PRECISION,
    "fechaDeteccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaResolucion" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "responsable" TEXT,
    "accionTomada" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_flow_forecasts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "mes" TEXT NOT NULL,
    "ingresosPrevistos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ingresosRecurrentes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ingresosVariables" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gastosPrevistos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gastosRecurrentes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gastosVariables" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoFinal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confianza" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "escenarioOptimista" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "escenarioPesimista" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "basadoEnDatos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_flow_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_management" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "importeFianza" DOUBLE PRECISION NOT NULL,
    "tipoFianza" TEXT NOT NULL,
    "depositadoOficialmente" BOOLEAN NOT NULL DEFAULT false,
    "entidadDeposito" TEXT,
    "numeroDeposito" TEXT,
    "fechaDeposito" TIMESTAMP(3),
    "devuelto" BOOLEAN NOT NULL DEFAULT false,
    "importeDevuelto" DOUBLE PRECISION,
    "deducciones" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "motivoDeducciones" TEXT,
    "fechaDevolucion" TIMESTAMP(3),
    "documentos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_management_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bad_debt_provisions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "montoOriginal" DOUBLE PRECISION NOT NULL,
    "diasRetraso" INTEGER NOT NULL,
    "categoriaRiesgo" "RiskLevel" NOT NULL,
    "porcentajeProvision" DOUBLE PRECISION NOT NULL,
    "montoProvision" DOUBLE PRECISION NOT NULL,
    "gestionado" BOOLEAN NOT NULL DEFAULT false,
    "recuperado" BOOLEAN NOT NULL DEFAULT false,
    "montoRecuperado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaRecuperacion" TIMESTAMP(3),
    "metodosGestion" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bad_debt_provisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habitability_certificates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "numeroCedula" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "vigenciaIndefinida" BOOLEAN NOT NULL DEFAULT false,
    "superficieUtil" DOUBLE PRECISION,
    "numeroHabitaciones" INTEGER,
    "organismoExpedidor" TEXT NOT NULL,
    "registroNumero" TEXT,
    "documentoURL" TEXT,
    "documentoStorage" TEXT,
    "alertaEnviada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habitability_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelo_347_records" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ejercicio" INTEGER NOT NULL,
    "trimestre" INTEGER,
    "nifDeclarante" TEXT NOT NULL,
    "razonSocialDeclarante" TEXT NOT NULL,
    "nifDeclarado" TEXT NOT NULL,
    "razonSocialDeclarado" TEXT NOT NULL,
    "tipoOperacion" TEXT NOT NULL,
    "importeAnual" DOUBLE PRECISION NOT NULL,
    "importeTrimestre1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "importeTrimestre2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "importeTrimestre3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "importeTrimestre4" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "generadoAutomaticamente" BOOLEAN NOT NULL DEFAULT true,
    "revisado" BOOLEAN NOT NULL DEFAULT false,
    "revisadoPor" TEXT,
    "fechaRevision" TIMESTAMP(3),
    "presentado" BOOLEAN NOT NULL DEFAULT false,
    "fechaPresentacion" TIMESTAMP(3),
    "numeroJustificante" TEXT,
    "archivoGenerado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modelo_347_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelo_180_records" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ejercicio" INTEGER NOT NULL,
    "trimestre" INTEGER NOT NULL,
    "nifArrendador" TEXT NOT NULL,
    "nombreArrendador" TEXT NOT NULL,
    "nifArrendatario" TEXT NOT NULL,
    "nombreArrendatario" TEXT NOT NULL,
    "baseImponible" DOUBLE PRECISION NOT NULL,
    "tipoRetencion" DOUBLE PRECISION NOT NULL,
    "importeRetenido" DOUBLE PRECISION NOT NULL,
    "situacionInmueble" TEXT NOT NULL,
    "referencialCatastral" TEXT,
    "incluidoDeclaracion" BOOLEAN NOT NULL DEFAULT false,
    "revisado" BOOLEAN NOT NULL DEFAULT false,
    "presentado" BOOLEAN NOT NULL DEFAULT false,
    "fechaPresentacion" TIMESTAMP(3),
    "numeroJustificante" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modelo_180_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "building_inspections" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "fechaInspeccion" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "proximaInspeccion" TIMESTAMP(3),
    "resultado" TEXT NOT NULL,
    "tecnicoNombre" TEXT NOT NULL,
    "tecnicoColegio" TEXT NOT NULL,
    "numeroRegistro" TEXT,
    "deficienciasEncontradas" JSONB,
    "accionesRequeridas" JSONB,
    "certificadoURL" TEXT,
    "documentos" JSONB,
    "alertasEnviadas" BOOLEAN NOT NULL DEFAULT false,
    "recordatorios" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "building_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_management" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "nombreComunidad" TEXT NOT NULL,
    "cif" TEXT,
    "direccion" TEXT NOT NULL,
    "codigoPostal" TEXT,
    "ciudad" TEXT,
    "provincia" TEXT,
    "honorariosFijos" DOUBLE PRECISION,
    "honorariosPorcentaje" DOUBLE PRECISION,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_management_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_invoices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "numeroFactura" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "periodo" TEXT NOT NULL,
    "honorarios" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gastosGestion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otrosConceptos" JSONB,
    "baseImponible" DOUBLE PRECISION NOT NULL,
    "iva" DOUBLE PRECISION NOT NULL,
    "totalFactura" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoFacturaComunidad" NOT NULL DEFAULT 'borrador',
    "fechaPago" TIMESTAMP(3),
    "metodoPago" TEXT,
    "documentoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_book_entries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoMovimientoCaja" NOT NULL,
    "concepto" TEXT NOT NULL,
    "descripcion" TEXT,
    "importe" DOUBLE PRECISION NOT NULL,
    "saldoAnterior" DOUBLE PRECISION NOT NULL,
    "saldoActual" DOUBLE PRECISION NOT NULL,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT,
    "facturaId" TEXT,
    "pagoId" TEXT,
    "documentoUrl" TEXT,
    "registradoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_book_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_reports" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "tipo" "TipoInformeComunidad" NOT NULL,
    "periodo" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "totalIngresos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalGastos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoInicial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoFinal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "detalleIngresos" JSONB,
    "detalleGastos" JSONB,
    "morosos" JSONB,
    "fondosReserva" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "documentoUrl" TEXT,
    "generadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColivingProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bio" TEXT,
    "intereses" JSONB NOT NULL,
    "profesion" TEXT,
    "idiomas" JSONB NOT NULL,
    "redesSociales" JSONB,
    "buscoCompañeros" BOOLEAN NOT NULL DEFAULT true,
    "interesCompartir" JSONB NOT NULL,
    "disponibilidad" JSONB NOT NULL,
    "puntosReputacion" INTEGER NOT NULL DEFAULT 0,
    "nivel" TEXT NOT NULL DEFAULT 'bronce',
    "badges" JSONB NOT NULL DEFAULT '[]',
    "perfilPublico" BOOLEAN NOT NULL DEFAULT true,
    "mostrarContacto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColivingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColivingMatch" (
    "id" TEXT NOT NULL,
    "profile1Id" TEXT NOT NULL,
    "profile2Id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "scoreCompatibilidad" INTEGER NOT NULL,
    "interesesComunes" JSONB NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'sugerido',
    "mensajeIntroduccion" TEXT,
    "fechaMatch" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAceptacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColivingMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColivingGroup" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "icono" TEXT,
    "imagen" TEXT,
    "esPublico" BOOLEAN NOT NULL DEFAULT true,
    "maxMiembros" INTEGER,
    "reglas" TEXT,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColivingGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColivingGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'miembro',
    "fechaUnion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColivingGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColivingActivityPost" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "profileId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "imagenes" JSONB,
    "hashtags" JSONB,
    "likes" JSONB NOT NULL DEFAULT '[]',
    "comentarios" JSONB NOT NULL DEFAULT '[]',
    "visibilidad" TEXT NOT NULL DEFAULT 'comunidad',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColivingActivityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColivingEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "groupId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "duracion" INTEGER NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "capacidad" INTEGER,
    "requiereInscripcion" BOOLEAN NOT NULL DEFAULT false,
    "costo" DOUBLE PRECISION DEFAULT 0,
    "organizador" TEXT NOT NULL,
    "imagen" TEXT,
    "etiquetas" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColivingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColivingEventAttendance" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'confirmado',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColivingEventAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColivingService" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "icono" TEXT,
    "precioBase" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "duracion" INTEGER,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "proveedorExterno" TEXT,
    "contactoProveedor" TEXT,
    "imagenes" JSONB,
    "requisitos" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColivingService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColivingServiceBooking" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fechaServicio" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "duracion" INTEGER NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "precioTotal" DOUBLE PRECISION NOT NULL,
    "notas" TEXT,
    "instruccionesEspeciales" TEXT,
    "valoracion" INTEGER,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColivingServiceBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColivingCheckInOut" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "roomId" TEXT,
    "tipo" TEXT NOT NULL,
    "metodo" TEXT NOT NULL,
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "fechaReal" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "documentosVerificados" BOOLEAN NOT NULL DEFAULT false,
    "firmaDigital" TEXT,
    "codigoAcceso" TEXT,
    "inventarioEntrada" JSONB,
    "inventarioSalida" JSONB,
    "fotosEntrada" JSONB,
    "fotosSalida" JSONB,
    "llaveDigitalEnviada" BOOLEAN NOT NULL DEFAULT false,
    "llaveDigitalActiva" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColivingCheckInOut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartLock" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "unitId" TEXT,
    "roomId" TEXT,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "numeroSerie" TEXT NOT NULL,
    "apiEndpoint" TEXT,
    "apiKey" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "bateria" INTEGER,
    "conectado" BOOLEAN NOT NULL DEFAULT true,
    "ultimaConexion" TIMESTAMP(3),
    "modoAcceso" TEXT NOT NULL DEFAULT 'codigo',
    "autoBloqueo" BOOLEAN NOT NULL DEFAULT true,
    "tiempoAutoBloqueo" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartLockAccess" (
    "id" TEXT NOT NULL,
    "lockId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipoAcceso" TEXT NOT NULL,
    "codigoAcceso" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "usosPermitidos" INTEGER,
    "usosRealizados" INTEGER NOT NULL DEFAULT 0,
    "ultimoAcceso" TIMESTAMP(3),
    "historialAccesos" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartLockAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColivingPackage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "numeroSeguimiento" TEXT,
    "remitente" TEXT NOT NULL,
    "empresa" TEXT,
    "fechaLlegada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRecogida" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "ubicacionAlmacen" TEXT,
    "tamano" TEXT,
    "requiereRefrigeracion" BOOLEAN NOT NULL DEFAULT false,
    "requiereFirma" BOOLEAN NOT NULL DEFAULT false,
    "fotoComprobante" TEXT,
    "notificado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColivingPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "cif" TEXT NOT NULL,
    "tipo" "PartnerType" NOT NULL DEFAULT 'BANCO',
    "contactoNombre" TEXT NOT NULL,
    "contactoEmail" TEXT NOT NULL,
    "contactoTelefono" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "logo" TEXT,
    "coloresPrimarios" JSONB,
    "dominioPersonalizado" TEXT,
    "comisionPorcentaje" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "umbralComision" INTEGER NOT NULL DEFAULT 1,
    "estado" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaActivacion" TIMESTAMP(3),
    "config" JSONB NOT NULL DEFAULT '{}',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerClient" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "fechaActivacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCancelacion" TIMESTAMP(3),
    "origenInvitacion" TEXT,
    "codigoReferido" TEXT,
    "totalComisionGenerada" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ultimaComisionFecha" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "montoBruto" DOUBLE PRECISION NOT NULL,
    "porcentaje" DOUBLE PRECISION NOT NULL,
    "montoComision" DOUBLE PRECISION NOT NULL,
    "planId" TEXT,
    "planNombre" TEXT,
    "estado" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "fechaAprobacion" TIMESTAMP(3),
    "fechaPago" TIMESTAMP(3),
    "referenciaPago" TEXT,
    "clientesActivos" INTEGER NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerInvitation" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT,
    "telefono" TEXT,
    "token" TEXT NOT NULL,
    "mensaje" TEXT,
    "estado" "PartnerInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "enviadoFecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aceptadoFecha" TIMESTAMP(3),
    "expiraFecha" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesRepresentative" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "telefonoSecundario" TEXT,
    "numeroAutonomo" TEXT,
    "iban" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "codigoPostal" TEXT,
    "pais" TEXT NOT NULL DEFAULT 'España',
    "codigoReferido" TEXT NOT NULL,
    "comisionCaptacion" DOUBLE PRECISION NOT NULL DEFAULT 150.0,
    "comisionRecurrente" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "bonificacionObjetivo" DOUBLE PRECISION NOT NULL DEFAULT 500.0,
    "objetivoLeadsMes" INTEGER NOT NULL DEFAULT 10,
    "objetivoConversionesMes" INTEGER NOT NULL DEFAULT 2,
    "password" TEXT NOT NULL,
    "ultimoAcceso" TIMESTAMP(3),
    "estado" "SalesRepStatus" NOT NULL DEFAULT 'ACTIVO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaBaja" TIMESTAMP(3),
    "motivoBaja" TEXT,
    "totalLeadsGenerados" INTEGER NOT NULL DEFAULT 0,
    "totalConversiones" INTEGER NOT NULL DEFAULT 0,
    "totalComisionGenerada" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tasaConversion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notas" TEXT,
    "documentacion" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "apiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whiteLabelEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whiteLabelConfig" JSONB,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "parentSalesRepId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL DEFAULT 'global',

    CONSTRAINT "SalesRepresentative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesLead" (
    "id" TEXT NOT NULL,
    "salesRepId" TEXT NOT NULL,
    "nombreContacto" TEXT NOT NULL,
    "emailContacto" TEXT NOT NULL,
    "telefonoContacto" TEXT,
    "nombreEmpresa" TEXT NOT NULL,
    "sector" TEXT,
    "tipoCliente" TEXT,
    "propiedadesEstimadas" INTEGER,
    "presupuestoMensual" DOUBLE PRECISION,
    "estado" "LeadStatus" NOT NULL DEFAULT 'NUEVO',
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "probabilidadCierre" INTEGER NOT NULL DEFAULT 50,
    "fechaCaptura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaPrimerContacto" TIMESTAMP(3),
    "fechaUltimoContacto" TIMESTAMP(3),
    "proximoSeguimiento" TIMESTAMP(3),
    "origenCaptura" TEXT,
    "codigoRastreo" TEXT,
    "numeroLlamadas" INTEGER NOT NULL DEFAULT 0,
    "numeroEmails" INTEGER NOT NULL DEFAULT 0,
    "numeroReuniones" INTEGER NOT NULL DEFAULT 0,
    "convertido" BOOLEAN NOT NULL DEFAULT false,
    "fechaConversion" TIMESTAMP(3),
    "companyId" TEXT,
    "planSuscrito" TEXT,
    "valorMensual" DOUBLE PRECISION,
    "notas" TEXT,
    "motivoRechazo" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCommission" (
    "id" TEXT NOT NULL,
    "salesRepId" TEXT NOT NULL,
    "leadId" TEXT,
    "companyId" TEXT,
    "tipo" "SalesCommissionType" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "periodo" TEXT,
    "montoBase" DOUBLE PRECISION NOT NULL,
    "porcentaje" DOUBLE PRECISION,
    "montoComision" DOUBLE PRECISION NOT NULL,
    "retencionIRPF" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montoNeto" DOUBLE PRECISION NOT NULL,
    "estado" "SalesCommissionStatus" NOT NULL DEFAULT 'PENDIENTE',
    "fechaGeneracion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAprobacion" TIMESTAMP(3),
    "fechaPago" TIMESTAMP(3),
    "aprobadoPor" TEXT,
    "notaAprobacion" TEXT,
    "referenciaPago" TEXT,
    "metodoPago" TEXT,
    "comprobantePago" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesTarget" (
    "id" TEXT NOT NULL,
    "salesRepId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "tipoObjetivo" TEXT NOT NULL,
    "objetivoLeads" INTEGER NOT NULL,
    "objetivoConversiones" INTEGER NOT NULL,
    "objetivoMRR" DOUBLE PRECISION NOT NULL,
    "leadsGenerados" INTEGER NOT NULL DEFAULT 0,
    "conversionesLogradas" INTEGER NOT NULL DEFAULT 0,
    "mrrGenerado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "porcentajeLeads" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "porcentajeConversiones" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "porcentajeMRR" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cumplido" BOOLEAN NOT NULL DEFAULT false,
    "bonificacionPagada" BOOLEAN NOT NULL DEFAULT false,
    "montoBonificacion" DOUBLE PRECISION,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingMaterial" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "url" TEXT,
    "contenido" TEXT,
    "tags" TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialDownload" (
    "id" TEXT NOT NULL,
    "salesRepId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "fechaDescarga" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialDownload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerCertification" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "requisitos" TEXT[],
    "beneficios" TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerCertificationAwarded" (
    "id" TEXT NOT NULL,
    "salesRepId" TEXT NOT NULL,
    "certificationId" TEXT NOT NULL,
    "fechaObtencion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certificadoNumero" TEXT NOT NULL,

    CONSTRAINT "PartnerCertificationAwarded_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coliving_analytics" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodo" TIMESTAMP(3) NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "totalColivers" INTEGER NOT NULL,
    "coliversSalieron" INTEGER NOT NULL,
    "churnRate" DOUBLE PRECISION NOT NULL,
    "promedioEstanciaMeses" DOUBLE PRECISION,
    "ltvPromedio" DOUBLE PRECISION NOT NULL,
    "ltvMinimo" DOUBLE PRECISION NOT NULL,
    "ltvMaximo" DOUBLE PRECISION NOT NULL,
    "totalEncuestas" INTEGER NOT NULL DEFAULT 0,
    "promotores" INTEGER NOT NULL DEFAULT 0,
    "pasivos" INTEGER NOT NULL DEFAULT 0,
    "detractores" INTEGER NOT NULL DEFAULT 0,
    "npsScore" DOUBLE PRECISION,
    "perfilIdealEdadMin" INTEGER,
    "perfilIdealEdadMax" INTEGER,
    "perfilIdealOcupacion" TEXT,
    "perfilIdealIngresoMin" DOUBLE PRECISION,
    "perfilIdealEstanciaMeses" INTEGER,
    "prediccionOcupacionProximoMes" DOUBLE PRECISION,
    "prediccionDisponibilidadRoomsProximoMes" INTEGER,
    "nivelConfianzaPrediccion" "PredictionStatus" NOT NULL DEFAULT 'neutro',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coliving_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nps_surveys" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "categoria" "NPSCategory" NOT NULL,
    "comentario" TEXT,
    "fechaEncuesta" TIMESTAMP(3) NOT NULL,
    "respondido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nps_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "edad" INTEGER,
    "ocupacion" TEXT,
    "ingresos" DOUBLE PRECISION,
    "idiomas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "horariosActividad" TEXT,
    "nivelSociabilidad" INTEGER DEFAULT 5,
    "estiloVida" TEXT,
    "preferenciaLimpieza" INTEGER DEFAULT 5,
    "toleranciaRuido" INTEGER DEFAULT 5,
    "frecuenciaUsoComunes" TEXT,
    "numeroConvivientes" INTEGER NOT NULL DEFAULT 0,
    "incidentesReportados" INTEGER NOT NULL DEFAULT 0,
    "puntuacionConvivencia" DOUBLE PRECISION,
    "mesesEnColiving" INTEGER NOT NULL DEFAULT 0,
    "prefiereHabitacionPrivada" BOOLEAN NOT NULL DEFAULT false,
    "prefiereEdificioCentro" BOOLEAN NOT NULL DEFAULT false,
    "interesEventos" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space_waitlist" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaDeseada" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "duracionHoras" INTEGER NOT NULL,
    "prioridad" INTEGER NOT NULL DEFAULT 1,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'activa',
    "fechaNotificado" TIMESTAMP(3),
    "notasInternas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_credits" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "creditosActuales" INTEGER NOT NULL DEFAULT 10,
    "creditosMaximos" INTEGER NOT NULL DEFAULT 10,
    "creditosUsados" INTEGER NOT NULL DEFAULT 0,
    "penalizacionesTotal" INTEGER NOT NULL DEFAULT 0,
    "ultimaRecarga" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proximaRecarga" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservation_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space_ratings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "categoria" "RatingCategory" NOT NULL,
    "comentario" TEXT,
    "aspectosPositivos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aspectosNegativos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fechaRating" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space_maintenance_predictions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "periodo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horasUsoEstimadas" DOUBLE PRECISION NOT NULL,
    "numeroReservasCompletadas" INTEGER NOT NULL,
    "promedioPersonasPorReserva" DOUBLE PRECISION NOT NULL,
    "indiceDesgaste" DOUBLE PRECISION NOT NULL,
    "mantenimientoSugerido" BOOLEAN NOT NULL DEFAULT false,
    "tipoMantenimientoSugerido" TEXT,
    "fechaSugeridaMantenimiento" TIMESTAMP(3),
    "descripcionRecomendacion" TEXT,
    "costoEstimado" DOUBLE PRECISION,
    "nivelUrgencia" "MaintenancePriority" NOT NULL DEFAULT 'baja',
    "alertaEnviada" BOOLEAN NOT NULL DEFAULT false,
    "fechaAlerta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_maintenance_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_attendees" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "tenantId" TEXT,
    "nombreExterno" TEXT,
    "emailExterno" TEXT,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "enListaEspera" BOOLEAN NOT NULL DEFAULT false,
    "fechaInscripcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asistio" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_comments" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "tenantId" TEXT,
    "autorNombre" TEXT,
    "contenido" TEXT NOT NULL,
    "moderado" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_reactions" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'like',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_confirmations" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "fechaLectura" TIMESTAMP(3),
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "fechaConfirmacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_engagement_metrics" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "buildingId" TEXT,
    "colivingId" TEXT,
    "periodo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoPerido" TEXT NOT NULL DEFAULT 'diario',
    "eventosCreados" INTEGER NOT NULL DEFAULT 0,
    "eventosRealizados" INTEGER NOT NULL DEFAULT 0,
    "asistenciaTotalEventos" INTEGER NOT NULL DEFAULT 0,
    "tasaAsistenciaPromedio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "postsCreados" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalComentarios" INTEGER NOT NULL DEFAULT 0,
    "totalCompartidos" INTEGER NOT NULL DEFAULT 0,
    "vistasTotales" INTEGER NOT NULL DEFAULT 0,
    "anunciosPublicados" INTEGER NOT NULL DEFAULT 0,
    "tasaLecturaAnuncios" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tasaConfirmacionAnuncios" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usuariosActivos" INTEGER NOT NULL DEFAULT 0,
    "nuevosParticipantes" INTEGER NOT NULL DEFAULT 0,
    "interaccionesTotal" INTEGER NOT NULL DEFAULT 0,
    "sentimientoPromedio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_engagement_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_resetToken_key" ON "users"("resetToken");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_companyId_idx" ON "users"("companyId");

-- CreateIndex
CREATE INDEX "users_role_companyId_idx" ON "users"("role", "companyId");

-- CreateIndex
CREATE INDEX "users_activo_idx" ON "users"("activo");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "buildings_companyId_idx" ON "buildings"("companyId");

-- CreateIndex
CREATE INDEX "buildings_tipo_companyId_idx" ON "buildings"("tipo", "companyId");

-- CreateIndex
CREATE INDEX "buildings_companyId_createdAt_idx" ON "buildings"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "buildings_companyId_tipo_anoConstructor_idx" ON "buildings"("companyId", "tipo", "anoConstructor");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_dni_key" ON "tenants"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_email_key" ON "tenants"("email");

-- CreateIndex
CREATE INDEX "tenants_companyId_idx" ON "tenants"("companyId");

-- CreateIndex
CREATE INDEX "tenants_email_idx" ON "tenants"("email");

-- CreateIndex
CREATE INDEX "tenants_dni_idx" ON "tenants"("dni");

-- CreateIndex
CREATE INDEX "tenants_companyId_scoring_idx" ON "tenants"("companyId", "scoring");

-- CreateIndex
CREATE INDEX "tenants_companyId_createdAt_idx" ON "tenants"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "units_buildingId_estado_idx" ON "units"("buildingId", "estado");

-- CreateIndex
CREATE INDEX "units_estado_idx" ON "units"("estado");

-- CreateIndex
CREATE INDEX "units_tenantId_idx" ON "units"("tenantId");

-- CreateIndex
CREATE INDEX "units_tipo_estado_idx" ON "units"("tipo", "estado");

-- CreateIndex
CREATE INDEX "units_buildingId_tipo_estado_idx" ON "units"("buildingId", "tipo", "estado");

-- CreateIndex
CREATE INDEX "units_rentaMensual_estado_idx" ON "units"("rentaMensual", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "units_buildingId_numero_key" ON "units"("buildingId", "numero");

-- CreateIndex
CREATE INDEX "contracts_tenantId_estado_idx" ON "contracts"("tenantId", "estado");

-- CreateIndex
CREATE INDEX "contracts_unitId_estado_idx" ON "contracts"("unitId", "estado");

-- CreateIndex
CREATE INDEX "contracts_estado_idx" ON "contracts"("estado");

-- CreateIndex
CREATE INDEX "contracts_fechaInicio_fechaFin_idx" ON "contracts"("fechaInicio", "fechaFin");

-- CreateIndex
CREATE INDEX "contracts_tenantId_fechaInicio_idx" ON "contracts"("tenantId", "fechaInicio");

-- CreateIndex
CREATE INDEX "contracts_estado_fechaFin_idx" ON "contracts"("estado", "fechaFin");

-- CreateIndex
CREATE INDEX "contracts_unitId_fechaInicio_fechaFin_idx" ON "contracts"("unitId", "fechaInicio", "fechaFin");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentIntentId_key" ON "payments"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "payments_contractId_estado_idx" ON "payments"("contractId", "estado");

-- CreateIndex
CREATE INDEX "payments_estado_idx" ON "payments"("estado");

-- CreateIndex
CREATE INDEX "payments_fechaVencimiento_idx" ON "payments"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "payments_fechaPago_idx" ON "payments"("fechaPago");

-- CreateIndex
CREATE INDEX "payments_contractId_fechaVencimiento_idx" ON "payments"("contractId", "fechaVencimiento");

-- CreateIndex
CREATE INDEX "payments_estado_fechaVencimiento_idx" ON "payments"("estado", "fechaVencimiento");

-- CreateIndex
CREATE INDEX "payments_nivelRiesgo_estado_idx" ON "payments"("nivelRiesgo", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_subscriptions_contractId_key" ON "stripe_subscriptions"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_subscriptions_stripeSubscriptionId_key" ON "stripe_subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_customers_tenantId_key" ON "stripe_customers"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_customers_stripeCustomerId_key" ON "stripe_customers"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_webhook_events_stripeEventId_key" ON "stripe_webhook_events"("stripeEventId");

-- CreateIndex
CREATE INDEX "stripe_webhook_events_processed_createdAt_idx" ON "stripe_webhook_events"("processed", "createdAt");

-- CreateIndex
CREATE INDEX "maintenance_requests_unitId_idx" ON "maintenance_requests"("unitId");

-- CreateIndex
CREATE INDEX "maintenance_requests_estado_idx" ON "maintenance_requests"("estado");

-- CreateIndex
CREATE INDEX "maintenance_requests_prioridad_idx" ON "maintenance_requests"("prioridad");

-- CreateIndex
CREATE INDEX "maintenance_requests_unitId_estado_idx" ON "maintenance_requests"("unitId", "estado");

-- CreateIndex
CREATE INDEX "maintenance_requests_estado_prioridad_idx" ON "maintenance_requests"("estado", "prioridad");

-- CreateIndex
CREATE INDEX "maintenance_requests_fechaProgramada_idx" ON "maintenance_requests"("fechaProgramada");

-- CreateIndex
CREATE INDEX "maintenance_requests_createdAt_idx" ON "maintenance_requests"("createdAt");

-- CreateIndex
CREATE INDEX "expenses_buildingId_idx" ON "expenses"("buildingId");

-- CreateIndex
CREATE INDEX "expenses_unitId_idx" ON "expenses"("unitId");

-- CreateIndex
CREATE INDEX "expenses_providerId_idx" ON "expenses"("providerId");

-- CreateIndex
CREATE INDEX "expenses_categoria_idx" ON "expenses"("categoria");

-- CreateIndex
CREATE INDEX "expenses_fecha_idx" ON "expenses"("fecha");

-- CreateIndex
CREATE INDEX "expenses_buildingId_categoria_idx" ON "expenses"("buildingId", "categoria");

-- CreateIndex
CREATE INDEX "expenses_buildingId_fecha_idx" ON "expenses"("buildingId", "fecha");

-- CreateIndex
CREATE INDEX "expenses_createdAt_idx" ON "expenses"("createdAt");

-- CreateIndex
CREATE INDEX "documents_buildingId_idx" ON "documents"("buildingId");

-- CreateIndex
CREATE INDEX "documents_unitId_idx" ON "documents"("unitId");

-- CreateIndex
CREATE INDEX "documents_tenantId_idx" ON "documents"("tenantId");

-- CreateIndex
CREATE INDEX "documents_contractId_idx" ON "documents"("contractId");

-- CreateIndex
CREATE INDEX "documents_tipo_idx" ON "documents"("tipo");

-- CreateIndex
CREATE INDEX "documents_folderId_idx" ON "documents"("folderId");

-- CreateIndex
CREATE INDEX "documents_createdAt_idx" ON "documents"("createdAt");

-- CreateIndex
CREATE INDEX "documents_fechaVencimiento_idx" ON "documents"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_leida_idx" ON "notifications"("leida");

-- CreateIndex
CREATE INDEX "notifications_userId_leida_idx" ON "notifications"("userId", "leida");

-- CreateIndex
CREATE INDEX "notifications_companyId_leida_idx" ON "notifications"("companyId", "leida");

-- CreateIndex
CREATE INDEX "notifications_companyId_createdAt_idx" ON "notifications"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_tipo_idx" ON "notifications"("tipo");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "company_dominioPersonalizado_key" ON "company"("dominioPersonalizado");

-- CreateIndex
CREATE UNIQUE INDEX "company_stripeCustomerId_key" ON "company"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "tasks_companyId_idx" ON "tasks"("companyId");

-- CreateIndex
CREATE INDEX "tasks_asignadoA_idx" ON "tasks"("asignadoA");

-- CreateIndex
CREATE INDEX "tasks_estado_idx" ON "tasks"("estado");

-- CreateIndex
CREATE INDEX "tasks_prioridad_idx" ON "tasks"("prioridad");

-- CreateIndex
CREATE INDEX "tasks_fechaLimite_idx" ON "tasks"("fechaLimite");

-- CreateIndex
CREATE INDEX "tasks_companyId_estado_idx" ON "tasks"("companyId", "estado");

-- CreateIndex
CREATE INDEX "tasks_asignadoA_estado_idx" ON "tasks"("asignadoA", "estado");

-- CreateIndex
CREATE INDEX "tasks_createdAt_idx" ON "tasks"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_companyId_createdAt_idx" ON "audit_logs"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "chat_conversations_companyId_estado_idx" ON "chat_conversations"("companyId", "estado");

-- CreateIndex
CREATE INDEX "chat_conversations_tenantId_idx" ON "chat_conversations"("tenantId");

-- CreateIndex
CREATE INDEX "chat_conversations_userId_idx" ON "chat_conversations"("userId");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_createdAt_idx" ON "chat_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "email_recipients_campaignId_idx" ON "email_recipients"("campaignId");

-- CreateIndex
CREATE INDEX "document_folders_companyId_idx" ON "document_folders"("companyId");

-- CreateIndex
CREATE INDEX "document_folders_parentFolderId_idx" ON "document_folders"("parentFolderId");

-- CreateIndex
CREATE INDEX "document_versions_documentId_idx" ON "document_versions"("documentId");

-- CreateIndex
CREATE INDEX "document_templates_companyId_idx" ON "document_templates"("companyId");

-- CreateIndex
CREATE INDEX "document_shares_documentId_idx" ON "document_shares"("documentId");

-- CreateIndex
CREATE INDEX "document_shares_tenantId_idx" ON "document_shares"("tenantId");

-- CreateIndex
CREATE INDEX "document_tags_companyId_idx" ON "document_tags"("companyId");

-- CreateIndex
CREATE INDEX "analytics_snapshots_companyId_idx" ON "analytics_snapshots"("companyId");

-- CreateIndex
CREATE INDEX "analytics_snapshots_fecha_idx" ON "analytics_snapshots"("fecha");

-- CreateIndex
CREATE INDEX "analytics_snapshots_periodo_idx" ON "analytics_snapshots"("periodo");

-- CreateIndex
CREATE INDEX "building_metrics_buildingId_idx" ON "building_metrics"("buildingId");

-- CreateIndex
CREATE INDEX "building_metrics_fecha_idx" ON "building_metrics"("fecha");

-- CreateIndex
CREATE INDEX "building_metrics_periodo_idx" ON "building_metrics"("periodo");

-- CreateIndex
CREATE INDEX "tenant_behaviors_tenantId_idx" ON "tenant_behaviors"("tenantId");

-- CreateIndex
CREATE INDEX "tenant_behaviors_fecha_idx" ON "tenant_behaviors"("fecha");

-- CreateIndex
CREATE INDEX "prediction_models_companyId_idx" ON "prediction_models"("companyId");

-- CreateIndex
CREATE INDEX "prediction_models_tipo_idx" ON "prediction_models"("tipo");

-- CreateIndex
CREATE INDEX "predictions_companyId_idx" ON "predictions"("companyId");

-- CreateIndex
CREATE INDEX "predictions_tipo_idx" ON "predictions"("tipo");

-- CreateIndex
CREATE INDEX "predictions_entityId_idx" ON "predictions"("entityId");

-- CreateIndex
CREATE INDEX "predictions_fechaObjetivo_idx" ON "predictions"("fechaObjetivo");

-- CreateIndex
CREATE INDEX "recommendations_companyId_idx" ON "recommendations"("companyId");

-- CreateIndex
CREATE INDEX "recommendations_tipo_idx" ON "recommendations"("tipo");

-- CreateIndex
CREATE INDEX "recommendations_prioridad_idx" ON "recommendations"("prioridad");

-- CreateIndex
CREATE INDEX "maintenance_inventory_companyId_idx" ON "maintenance_inventory"("companyId");

-- CreateIndex
CREATE INDEX "maintenance_inventory_buildingId_idx" ON "maintenance_inventory"("buildingId");

-- CreateIndex
CREATE INDEX "maintenance_inventory_categoria_idx" ON "maintenance_inventory"("categoria");

-- CreateIndex
CREATE INDEX "maintenance_history_equipoSistema_idx" ON "maintenance_history"("equipoSistema");

-- CreateIndex
CREATE INDEX "maintenance_history_tipoProblema_idx" ON "maintenance_history"("tipoProblema");

-- CreateIndex
CREATE INDEX "maintenance_history_unitId_idx" ON "maintenance_history"("unitId");

-- CreateIndex
CREATE INDEX "maintenance_history_buildingId_idx" ON "maintenance_history"("buildingId");

-- CreateIndex
CREATE INDEX "maintenance_history_fechaDeteccion_idx" ON "maintenance_history"("fechaDeteccion");

-- CreateIndex
CREATE INDEX "maintenance_failure_predictions_companyId_idx" ON "maintenance_failure_predictions"("companyId");

-- CreateIndex
CREATE INDEX "maintenance_failure_predictions_equipoSistema_idx" ON "maintenance_failure_predictions"("equipoSistema");

-- CreateIndex
CREATE INDEX "maintenance_failure_predictions_buildingId_idx" ON "maintenance_failure_predictions"("buildingId");

-- CreateIndex
CREATE INDEX "maintenance_failure_predictions_estado_idx" ON "maintenance_failure_predictions"("estado");

-- CreateIndex
CREATE INDEX "maintenance_failure_predictions_fechaObjetivo_idx" ON "maintenance_failure_predictions"("fechaObjetivo");

-- CreateIndex
CREATE INDEX "maintenance_budgets_companyId_idx" ON "maintenance_budgets"("companyId");

-- CreateIndex
CREATE INDEX "maintenance_budgets_buildingId_idx" ON "maintenance_budgets"("buildingId");

-- CreateIndex
CREATE INDEX "maintenance_budgets_periodo_idx" ON "maintenance_budgets"("periodo");

-- CreateIndex
CREATE INDEX "maintenance_metrics_companyId_idx" ON "maintenance_metrics"("companyId");

-- CreateIndex
CREATE INDEX "maintenance_metrics_buildingId_idx" ON "maintenance_metrics"("buildingId");

-- CreateIndex
CREATE INDEX "maintenance_metrics_periodo_idx" ON "maintenance_metrics"("periodo");

-- CreateIndex
CREATE INDEX "maintenance_diagnostics_maintenanceRequestId_idx" ON "maintenance_diagnostics"("maintenanceRequestId");

-- CreateIndex
CREATE INDEX "maintenance_diagnostics_equipoSistema_idx" ON "maintenance_diagnostics"("equipoSistema");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "accounting_transactions_companyId_idx" ON "accounting_transactions"("companyId");

-- CreateIndex
CREATE INDEX "accounting_transactions_buildingId_idx" ON "accounting_transactions"("buildingId");

-- CreateIndex
CREATE INDEX "accounting_transactions_tipo_idx" ON "accounting_transactions"("tipo");

-- CreateIndex
CREATE INDEX "accounting_transactions_categoria_idx" ON "accounting_transactions"("categoria");

-- CreateIndex
CREATE INDEX "accounting_transactions_fecha_idx" ON "accounting_transactions"("fecha");

-- CreateIndex
CREATE INDEX "cash_flow_statements_companyId_idx" ON "cash_flow_statements"("companyId");

-- CreateIndex
CREATE INDEX "cash_flow_statements_periodo_idx" ON "cash_flow_statements"("periodo");

-- CreateIndex
CREATE INDEX "crm_leads_companyId_idx" ON "crm_leads"("companyId");

-- CreateIndex
CREATE INDEX "crm_leads_estado_idx" ON "crm_leads"("estado");

-- CreateIndex
CREATE INDEX "crm_leads_asignadoA_idx" ON "crm_leads"("asignadoA");

-- CreateIndex
CREATE INDEX "crm_leads_scoring_idx" ON "crm_leads"("scoring");

-- CreateIndex
CREATE INDEX "crm_activities_leadId_idx" ON "crm_activities"("leadId");

-- CreateIndex
CREATE INDEX "crm_activities_tipo_idx" ON "crm_activities"("tipo");

-- CreateIndex
CREATE INDEX "crm_activities_fecha_idx" ON "crm_activities"("fecha");

-- CreateIndex
CREATE INDEX "legal_templates_companyId_idx" ON "legal_templates"("companyId");

-- CreateIndex
CREATE INDEX "legal_templates_categoria_idx" ON "legal_templates"("categoria");

-- CreateIndex
CREATE INDEX "legal_inspections_companyId_idx" ON "legal_inspections"("companyId");

-- CreateIndex
CREATE INDEX "legal_inspections_unitId_idx" ON "legal_inspections"("unitId");

-- CreateIndex
CREATE INDEX "legal_inspections_tipo_idx" ON "legal_inspections"("tipo");

-- CreateIndex
CREATE INDEX "legal_inspections_estado_idx" ON "legal_inspections"("estado");

-- CreateIndex
CREATE INDEX "legal_inspections_fechaProgramada_idx" ON "legal_inspections"("fechaProgramada");

-- CreateIndex
CREATE INDEX "inspections_companyId_idx" ON "inspections"("companyId");

-- CreateIndex
CREATE INDEX "inspections_unitId_idx" ON "inspections"("unitId");

-- CreateIndex
CREATE INDEX "inspections_buildingId_idx" ON "inspections"("buildingId");

-- CreateIndex
CREATE INDEX "inspections_estado_idx" ON "inspections"("estado");

-- CreateIndex
CREATE INDEX "inspections_fechaProgramada_idx" ON "inspections"("fechaProgramada");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_policies_numeroPoliza_key" ON "insurance_policies"("numeroPoliza");

-- CreateIndex
CREATE INDEX "insurance_policies_companyId_idx" ON "insurance_policies"("companyId");

-- CreateIndex
CREATE INDEX "insurance_policies_buildingId_idx" ON "insurance_policies"("buildingId");

-- CreateIndex
CREATE INDEX "insurance_policies_estado_idx" ON "insurance_policies"("estado");

-- CreateIndex
CREATE INDEX "insurance_policies_fechaVencimiento_idx" ON "insurance_policies"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "compliance_alerts_companyId_idx" ON "compliance_alerts"("companyId");

-- CreateIndex
CREATE INDEX "compliance_alerts_estado_idx" ON "compliance_alerts"("estado");

-- CreateIndex
CREATE INDEX "compliance_alerts_fechaLimite_idx" ON "compliance_alerts"("fechaLimite");

-- CreateIndex
CREATE INDEX "service_quotes_companyId_idx" ON "service_quotes"("companyId");

-- CreateIndex
CREATE INDEX "service_quotes_providerId_idx" ON "service_quotes"("providerId");

-- CreateIndex
CREATE INDEX "service_quotes_estado_idx" ON "service_quotes"("estado");

-- CreateIndex
CREATE INDEX "service_quotes_fechaSolicitud_idx" ON "service_quotes"("fechaSolicitud");

-- CreateIndex
CREATE INDEX "service_jobs_companyId_idx" ON "service_jobs"("companyId");

-- CreateIndex
CREATE INDEX "service_jobs_providerId_idx" ON "service_jobs"("providerId");

-- CreateIndex
CREATE INDEX "service_jobs_estado_idx" ON "service_jobs"("estado");

-- CreateIndex
CREATE INDEX "service_jobs_fechaInicio_idx" ON "service_jobs"("fechaInicio");

-- CreateIndex
CREATE INDEX "service_reviews_companyId_idx" ON "service_reviews"("companyId");

-- CreateIndex
CREATE INDEX "service_reviews_jobId_idx" ON "service_reviews"("jobId");

-- CreateIndex
CREATE INDEX "service_reviews_providerId_idx" ON "service_reviews"("providerId");

-- CreateIndex
CREATE INDEX "service_reviews_calificacion_idx" ON "service_reviews"("calificacion");

-- CreateIndex
CREATE INDEX "bi_widgets_companyId_idx" ON "bi_widgets"("companyId");

-- CreateIndex
CREATE INDEX "bi_widgets_activo_idx" ON "bi_widgets"("activo");

-- CreateIndex
CREATE INDEX "bi_reports_companyId_idx" ON "bi_reports"("companyId");

-- CreateIndex
CREATE INDEX "bi_reports_activo_idx" ON "bi_reports"("activo");

-- CreateIndex
CREATE INDEX "bi_reports_proximaEjecucion_idx" ON "bi_reports"("proximaEjecucion");

-- CreateIndex
CREATE INDEX "bi_alerts_companyId_idx" ON "bi_alerts"("companyId");

-- CreateIndex
CREATE INDEX "bi_alerts_activa_idx" ON "bi_alerts"("activa");

-- CreateIndex
CREATE INDEX "bi_alerts_metrica_idx" ON "bi_alerts"("metrica");

-- CreateIndex
CREATE INDEX "tenant_segments_companyId_idx" ON "tenant_segments"("companyId");

-- CreateIndex
CREATE INDEX "tenant_segments_activo_idx" ON "tenant_segments"("activo");

-- CreateIndex
CREATE INDEX "energy_readings_companyId_idx" ON "energy_readings"("companyId");

-- CreateIndex
CREATE INDEX "energy_readings_buildingId_idx" ON "energy_readings"("buildingId");

-- CreateIndex
CREATE INDEX "energy_readings_unitId_idx" ON "energy_readings"("unitId");

-- CreateIndex
CREATE INDEX "energy_readings_tipo_idx" ON "energy_readings"("tipo");

-- CreateIndex
CREATE INDEX "energy_readings_fechaLectura_idx" ON "energy_readings"("fechaLectura");

-- CreateIndex
CREATE INDEX "energy_readings_periodo_idx" ON "energy_readings"("periodo");

-- CreateIndex
CREATE INDEX "energy_alerts_companyId_idx" ON "energy_alerts"("companyId");

-- CreateIndex
CREATE INDEX "energy_alerts_buildingId_idx" ON "energy_alerts"("buildingId");

-- CreateIndex
CREATE INDEX "energy_alerts_unitId_idx" ON "energy_alerts"("unitId");

-- CreateIndex
CREATE INDEX "energy_alerts_tipo_idx" ON "energy_alerts"("tipo");

-- CreateIndex
CREATE INDEX "energy_alerts_resuelta_idx" ON "energy_alerts"("resuelta");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "audit_reports_companyId_idx" ON "audit_reports"("companyId");

-- CreateIndex
CREATE INDEX "audit_reports_tipoReporte_idx" ON "audit_reports"("tipoReporte");

-- CreateIndex
CREATE INDEX "audit_reports_createdAt_idx" ON "audit_reports"("createdAt");

-- CreateIndex
CREATE INDEX "security_events_companyId_idx" ON "security_events"("companyId");

-- CreateIndex
CREATE INDEX "security_events_tipo_idx" ON "security_events"("tipo");

-- CreateIndex
CREATE INDEX "security_events_severidad_idx" ON "security_events"("severidad");

-- CreateIndex
CREATE INDEX "security_events_resuelta_idx" ON "security_events"("resuelta");

-- CreateIndex
CREATE INDEX "security_events_createdAt_idx" ON "security_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_conversations_sessionId_key" ON "chatbot_conversations"("sessionId");

-- CreateIndex
CREATE INDEX "chatbot_conversations_companyId_idx" ON "chatbot_conversations"("companyId");

-- CreateIndex
CREATE INDEX "chatbot_conversations_tenantId_idx" ON "chatbot_conversations"("tenantId");

-- CreateIndex
CREATE INDEX "chatbot_conversations_sessionId_idx" ON "chatbot_conversations"("sessionId");

-- CreateIndex
CREATE INDEX "chatbot_conversations_estado_idx" ON "chatbot_conversations"("estado");

-- CreateIndex
CREATE INDEX "chatbot_conversations_createdAt_idx" ON "chatbot_conversations"("createdAt");

-- CreateIndex
CREATE INDEX "chatbot_messages_conversationId_idx" ON "chatbot_messages"("conversationId");

-- CreateIndex
CREATE INDEX "chatbot_messages_senderType_idx" ON "chatbot_messages"("senderType");

-- CreateIndex
CREATE INDEX "chatbot_messages_createdAt_idx" ON "chatbot_messages"("createdAt");

-- CreateIndex
CREATE INDEX "chatbot_actions_companyId_idx" ON "chatbot_actions"("companyId");

-- CreateIndex
CREATE INDEX "chatbot_actions_sessionId_idx" ON "chatbot_actions"("sessionId");

-- CreateIndex
CREATE INDEX "chatbot_actions_tenantId_idx" ON "chatbot_actions"("tenantId");

-- CreateIndex
CREATE INDEX "chatbot_actions_accion_idx" ON "chatbot_actions"("accion");

-- CreateIndex
CREATE INDEX "morosidad_predicciones_companyId_idx" ON "morosidad_predicciones"("companyId");

-- CreateIndex
CREATE INDEX "morosidad_predicciones_tenantId_idx" ON "morosidad_predicciones"("tenantId");

-- CreateIndex
CREATE INDEX "morosidad_predicciones_contractId_idx" ON "morosidad_predicciones"("contractId");

-- CreateIndex
CREATE INDEX "morosidad_predicciones_nivelRiesgo_idx" ON "morosidad_predicciones"("nivelRiesgo");

-- CreateIndex
CREATE INDEX "morosidad_predicciones_probabilidadImpago_idx" ON "morosidad_predicciones"("probabilidadImpago");

-- CreateIndex
CREATE INDEX "morosidad_predicciones_validaHasta_idx" ON "morosidad_predicciones"("validaHasta");

-- CreateIndex
CREATE INDEX "morosidad_historial_companyId_idx" ON "morosidad_historial"("companyId");

-- CreateIndex
CREATE INDEX "morosidad_historial_tenantId_idx" ON "morosidad_historial"("tenantId");

-- CreateIndex
CREATE INDEX "morosidad_historial_evento_idx" ON "morosidad_historial"("evento");

-- CreateIndex
CREATE INDEX "morosidad_historial_createdAt_idx" ON "morosidad_historial"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_firma_signaturitId_key" ON "documentos_firma"("signaturitId");

-- CreateIndex
CREATE INDEX "documentos_firma_companyId_idx" ON "documentos_firma"("companyId");

-- CreateIndex
CREATE INDEX "documentos_firma_estado_idx" ON "documentos_firma"("estado");

-- CreateIndex
CREATE INDEX "documentos_firma_contractId_idx" ON "documentos_firma"("contractId");

-- CreateIndex
CREATE INDEX "documentos_firma_tenantId_idx" ON "documentos_firma"("tenantId");

-- CreateIndex
CREATE INDEX "documentos_firma_signaturitId_idx" ON "documentos_firma"("signaturitId");

-- CreateIndex
CREATE INDEX "documentos_firma_fechaExpiracion_idx" ON "documentos_firma"("fechaExpiracion");

-- CreateIndex
CREATE INDEX "firmantes_documentoId_idx" ON "firmantes"("documentoId");

-- CreateIndex
CREATE INDEX "firmantes_email_idx" ON "firmantes"("email");

-- CreateIndex
CREATE INDEX "firmantes_estado_idx" ON "firmantes"("estado");

-- CreateIndex
CREATE INDEX "signature_webhooks_signaturitId_idx" ON "signature_webhooks"("signaturitId");

-- CreateIndex
CREATE INDEX "signature_webhooks_tipo_idx" ON "signature_webhooks"("tipo");

-- CreateIndex
CREATE INDEX "signature_webhooks_procesado_idx" ON "signature_webhooks"("procesado");

-- CreateIndex
CREATE UNIQUE INDEX "bank_connections_proveedorItemId_key" ON "bank_connections"("proveedorItemId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_connections_consentId_key" ON "bank_connections"("consentId");

-- CreateIndex
CREATE INDEX "bank_connections_userId_idx" ON "bank_connections"("userId");

-- CreateIndex
CREATE INDEX "bank_connections_companyId_idx" ON "bank_connections"("companyId");

-- CreateIndex
CREATE INDEX "bank_connections_tenantId_idx" ON "bank_connections"("tenantId");

-- CreateIndex
CREATE INDEX "bank_connections_estado_idx" ON "bank_connections"("estado");

-- CreateIndex
CREATE INDEX "bank_connections_proveedorItemId_idx" ON "bank_connections"("proveedorItemId");

-- CreateIndex
CREATE INDEX "bank_connections_consentId_idx" ON "bank_connections"("consentId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_transactions_proveedorTxId_key" ON "bank_transactions"("proveedorTxId");

-- CreateIndex
CREATE INDEX "bank_transactions_companyId_idx" ON "bank_transactions"("companyId");

-- CreateIndex
CREATE INDEX "bank_transactions_connectionId_idx" ON "bank_transactions"("connectionId");

-- CreateIndex
CREATE INDEX "bank_transactions_estado_idx" ON "bank_transactions"("estado");

-- CreateIndex
CREATE INDEX "bank_transactions_fecha_idx" ON "bank_transactions"("fecha");

-- CreateIndex
CREATE INDEX "bank_transactions_proveedorTxId_idx" ON "bank_transactions"("proveedorTxId");

-- CreateIndex
CREATE INDEX "reconciliation_rules_companyId_idx" ON "reconciliation_rules"("companyId");

-- CreateIndex
CREATE INDEX "reconciliation_rules_activa_idx" ON "reconciliation_rules"("activa");

-- CreateIndex
CREATE INDEX "reconciliation_rules_prioridad_idx" ON "reconciliation_rules"("prioridad");

-- CreateIndex
CREATE UNIQUE INDEX "conciliaciones_manuales_transactionId_key" ON "conciliaciones_manuales"("transactionId");

-- CreateIndex
CREATE INDEX "conciliaciones_manuales_companyId_idx" ON "conciliaciones_manuales"("companyId");

-- CreateIndex
CREATE INDEX "conciliaciones_manuales_transactionId_idx" ON "conciliaciones_manuales"("transactionId");

-- CreateIndex
CREATE INDEX "valoraciones_propiedades_companyId_idx" ON "valoraciones_propiedades"("companyId");

-- CreateIndex
CREATE INDEX "valoraciones_propiedades_unitId_idx" ON "valoraciones_propiedades"("unitId");

-- CreateIndex
CREATE INDEX "valoraciones_propiedades_buildingId_idx" ON "valoraciones_propiedades"("buildingId");

-- CreateIndex
CREATE INDEX "valoraciones_propiedades_municipio_idx" ON "valoraciones_propiedades"("municipio");

-- CreateIndex
CREATE INDEX "valoraciones_propiedades_fechaValoracion_idx" ON "valoraciones_propiedades"("fechaValoracion");

-- CreateIndex
CREATE INDEX "valoraciones_propiedades_finalidad_idx" ON "valoraciones_propiedades"("finalidad");

-- CreateIndex
CREATE INDEX "publicaciones_portales_companyId_idx" ON "publicaciones_portales"("companyId");

-- CreateIndex
CREATE INDEX "publicaciones_portales_unitId_idx" ON "publicaciones_portales"("unitId");

-- CreateIndex
CREATE INDEX "publicaciones_portales_estado_idx" ON "publicaciones_portales"("estado");

-- CreateIndex
CREATE INDEX "publicaciones_portales_fechaPublicacion_idx" ON "publicaciones_portales"("fechaPublicacion");

-- CreateIndex
CREATE UNIQUE INDEX "screening_candidatos_candidateId_key" ON "screening_candidatos"("candidateId");

-- CreateIndex
CREATE INDEX "screening_candidatos_companyId_idx" ON "screening_candidatos"("companyId");

-- CreateIndex
CREATE INDEX "screening_candidatos_candidateId_idx" ON "screening_candidatos"("candidateId");

-- CreateIndex
CREATE INDEX "screening_candidatos_estado_idx" ON "screening_candidatos"("estado");

-- CreateIndex
CREATE INDEX "screening_candidatos_scoringTotal_idx" ON "screening_candidatos"("scoringTotal");

-- CreateIndex
CREATE INDEX "screening_candidatos_nivelRiesgoGlobal_idx" ON "screening_candidatos"("nivelRiesgoGlobal");

-- CreateIndex
CREATE INDEX "sms_templates_companyId_idx" ON "sms_templates"("companyId");

-- CreateIndex
CREATE INDEX "sms_templates_tipo_idx" ON "sms_templates"("tipo");

-- CreateIndex
CREATE INDEX "sms_templates_activa_idx" ON "sms_templates"("activa");

-- CreateIndex
CREATE INDEX "sms_logs_companyId_idx" ON "sms_logs"("companyId");

-- CreateIndex
CREATE INDEX "sms_logs_templateId_idx" ON "sms_logs"("templateId");

-- CreateIndex
CREATE INDEX "sms_logs_tenantId_idx" ON "sms_logs"("tenantId");

-- CreateIndex
CREATE INDEX "sms_logs_estado_idx" ON "sms_logs"("estado");

-- CreateIndex
CREATE INDEX "sms_logs_fechaProgramada_idx" ON "sms_logs"("fechaProgramada");

-- CreateIndex
CREATE INDEX "sms_logs_fechaEnvio_idx" ON "sms_logs"("fechaEnvio");

-- CreateIndex
CREATE INDEX "calendar_events_companyId_idx" ON "calendar_events"("companyId");

-- CreateIndex
CREATE INDEX "calendar_events_tipo_idx" ON "calendar_events"("tipo");

-- CreateIndex
CREATE INDEX "calendar_events_fechaInicio_idx" ON "calendar_events"("fechaInicio");

-- CreateIndex
CREATE INDEX "calendar_events_fechaFin_idx" ON "calendar_events"("fechaFin");

-- CreateIndex
CREATE INDEX "calendar_events_buildingId_idx" ON "calendar_events"("buildingId");

-- CreateIndex
CREATE INDEX "calendar_events_unitId_idx" ON "calendar_events"("unitId");

-- CreateIndex
CREATE INDEX "calendar_events_tenantId_idx" ON "calendar_events"("tenantId");

-- CreateIndex
CREATE INDEX "calendar_events_completado_idx" ON "calendar_events"("completado");

-- CreateIndex
CREATE INDEX "calendar_events_cancelado_idx" ON "calendar_events"("cancelado");

-- CreateIndex
CREATE INDEX "common_spaces_companyId_idx" ON "common_spaces"("companyId");

-- CreateIndex
CREATE INDEX "common_spaces_buildingId_idx" ON "common_spaces"("buildingId");

-- CreateIndex
CREATE INDEX "common_spaces_tipo_idx" ON "common_spaces"("tipo");

-- CreateIndex
CREATE INDEX "common_spaces_activo_idx" ON "common_spaces"("activo");

-- CreateIndex
CREATE INDEX "space_reservations_companyId_idx" ON "space_reservations"("companyId");

-- CreateIndex
CREATE INDEX "space_reservations_spaceId_idx" ON "space_reservations"("spaceId");

-- CreateIndex
CREATE INDEX "space_reservations_tenantId_idx" ON "space_reservations"("tenantId");

-- CreateIndex
CREATE INDEX "space_reservations_fechaReserva_idx" ON "space_reservations"("fechaReserva");

-- CreateIndex
CREATE INDEX "space_reservations_estado_idx" ON "space_reservations"("estado");

-- CreateIndex
CREATE INDEX "space_reservations_noShow_idx" ON "space_reservations"("noShow");

-- CreateIndex
CREATE INDEX "insurances_companyId_idx" ON "insurances"("companyId");

-- CreateIndex
CREATE INDEX "insurances_buildingId_idx" ON "insurances"("buildingId");

-- CreateIndex
CREATE INDEX "insurances_unitId_idx" ON "insurances"("unitId");

-- CreateIndex
CREATE INDEX "insurances_tipo_idx" ON "insurances"("tipo");

-- CreateIndex
CREATE INDEX "insurances_estado_idx" ON "insurances"("estado");

-- CreateIndex
CREATE INDEX "insurances_fechaVencimiento_idx" ON "insurances"("fechaVencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "insurances_companyId_numeroPoliza_key" ON "insurances"("companyId", "numeroPoliza");

-- CreateIndex
CREATE INDEX "insurance_claims_insuranceId_idx" ON "insurance_claims"("insuranceId");

-- CreateIndex
CREATE INDEX "insurance_claims_estado_idx" ON "insurance_claims"("estado");

-- CreateIndex
CREATE INDEX "insurance_claims_fechaSiniestro_idx" ON "insurance_claims"("fechaSiniestro");

-- CreateIndex
CREATE INDEX "energy_certificates_companyId_idx" ON "energy_certificates"("companyId");

-- CreateIndex
CREATE INDEX "energy_certificates_unitId_idx" ON "energy_certificates"("unitId");

-- CreateIndex
CREATE INDEX "energy_certificates_calificacion_idx" ON "energy_certificates"("calificacion");

-- CreateIndex
CREATE INDEX "energy_certificates_vigente_idx" ON "energy_certificates"("vigente");

-- CreateIndex
CREATE INDEX "energy_certificates_fechaVencimiento_idx" ON "energy_certificates"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "community_incidents_companyId_idx" ON "community_incidents"("companyId");

-- CreateIndex
CREATE INDEX "community_incidents_buildingId_idx" ON "community_incidents"("buildingId");

-- CreateIndex
CREATE INDEX "community_incidents_estado_idx" ON "community_incidents"("estado");

-- CreateIndex
CREATE INDEX "community_incidents_tipo_idx" ON "community_incidents"("tipo");

-- CreateIndex
CREATE INDEX "community_incidents_prioridad_idx" ON "community_incidents"("prioridad");

-- CreateIndex
CREATE INDEX "community_votes_companyId_idx" ON "community_votes"("companyId");

-- CreateIndex
CREATE INDEX "community_votes_buildingId_idx" ON "community_votes"("buildingId");

-- CreateIndex
CREATE INDEX "community_votes_estado_idx" ON "community_votes"("estado");

-- CreateIndex
CREATE INDEX "community_votes_fechaCierre_idx" ON "community_votes"("fechaCierre");

-- CreateIndex
CREATE INDEX "vote_records_voteId_idx" ON "vote_records"("voteId");

-- CreateIndex
CREATE UNIQUE INDEX "vote_records_voteId_tenantId_key" ON "vote_records"("voteId", "tenantId");

-- CreateIndex
CREATE INDEX "community_announcements_companyId_idx" ON "community_announcements"("companyId");

-- CreateIndex
CREATE INDEX "community_announcements_buildingId_idx" ON "community_announcements"("buildingId");

-- CreateIndex
CREATE INDEX "community_announcements_activo_idx" ON "community_announcements"("activo");

-- CreateIndex
CREATE INDEX "community_announcements_fechaPublicacion_idx" ON "community_announcements"("fechaPublicacion");

-- CreateIndex
CREATE INDEX "community_meetings_companyId_idx" ON "community_meetings"("companyId");

-- CreateIndex
CREATE INDEX "community_meetings_buildingId_idx" ON "community_meetings"("buildingId");

-- CreateIndex
CREATE INDEX "community_meetings_fechaReunion_idx" ON "community_meetings"("fechaReunion");

-- CreateIndex
CREATE INDEX "community_meetings_estado_idx" ON "community_meetings"("estado");

-- CreateIndex
CREATE INDEX "provider_work_orders_companyId_idx" ON "provider_work_orders"("companyId");

-- CreateIndex
CREATE INDEX "provider_work_orders_providerId_idx" ON "provider_work_orders"("providerId");

-- CreateIndex
CREATE INDEX "provider_work_orders_buildingId_idx" ON "provider_work_orders"("buildingId");

-- CreateIndex
CREATE INDEX "provider_work_orders_estado_idx" ON "provider_work_orders"("estado");

-- CreateIndex
CREATE INDEX "provider_work_orders_fechaAsignacion_idx" ON "provider_work_orders"("fechaAsignacion");

-- CreateIndex
CREATE UNIQUE INDEX "property_galleries_unitId_key" ON "property_galleries"("unitId");

-- CreateIndex
CREATE INDEX "property_galleries_companyId_idx" ON "property_galleries"("companyId");

-- CreateIndex
CREATE INDEX "property_galleries_unitId_idx" ON "property_galleries"("unitId");

-- CreateIndex
CREATE INDEX "gallery_items_galleryId_idx" ON "gallery_items"("galleryId");

-- CreateIndex
CREATE INDEX "gallery_items_tipo_idx" ON "gallery_items"("tipo");

-- CreateIndex
CREATE INDEX "gallery_items_habitacion_idx" ON "gallery_items"("habitacion");

-- CreateIndex
CREATE UNIQUE INDEX "user_dashboard_preferences_userId_key" ON "user_dashboard_preferences"("userId");

-- CreateIndex
CREATE INDEX "dashboard_widgets_userId_idx" ON "dashboard_widgets"("userId");

-- CreateIndex
CREATE INDEX "dashboard_widgets_preferenceId_idx" ON "dashboard_widgets"("preferenceId");

-- CreateIndex
CREATE INDEX "automatic_reminders_companyId_idx" ON "automatic_reminders"("companyId");

-- CreateIndex
CREATE INDEX "automatic_reminders_tipo_idx" ON "automatic_reminders"("tipo");

-- CreateIndex
CREATE INDEX "automatic_reminders_activo_idx" ON "automatic_reminders"("activo");

-- CreateIndex
CREATE INDEX "automatic_reminders_proximoEnvio_idx" ON "automatic_reminders"("proximoEnvio");

-- CreateIndex
CREATE INDEX "reviews_companyId_idx" ON "reviews"("companyId");

-- CreateIndex
CREATE INDEX "reviews_entityType_entityId_idx" ON "reviews"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "reviews_reviewerId_idx" ON "reviews"("reviewerId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "reviews_estado_idx" ON "reviews"("estado");

-- CreateIndex
CREATE INDEX "search_history_userId_idx" ON "search_history"("userId");

-- CreateIndex
CREATE INDEX "search_history_companyId_idx" ON "search_history"("companyId");

-- CreateIndex
CREATE INDEX "search_history_createdAt_idx" ON "search_history"("createdAt");

-- CreateIndex
CREATE INDEX "saved_searches_userId_idx" ON "saved_searches"("userId");

-- CreateIndex
CREATE INDEX "saved_searches_companyId_idx" ON "saved_searches"("companyId");

-- CreateIndex
CREATE INDEX "system_backups_companyId_idx" ON "system_backups"("companyId");

-- CreateIndex
CREATE INDEX "system_backups_estado_idx" ON "system_backups"("estado");

-- CreateIndex
CREATE INDEX "system_backups_createdAt_idx" ON "system_backups"("createdAt");

-- CreateIndex
CREATE INDEX "performance_metrics_companyId_idx" ON "performance_metrics"("companyId");

-- CreateIndex
CREATE INDEX "performance_metrics_metricType_idx" ON "performance_metrics"("metricType");

-- CreateIndex
CREATE INDEX "performance_metrics_createdAt_idx" ON "performance_metrics"("createdAt");

-- CreateIndex
CREATE INDEX "company_modules_companyId_idx" ON "company_modules"("companyId");

-- CreateIndex
CREATE INDEX "company_modules_moduloCodigo_idx" ON "company_modules"("moduloCodigo");

-- CreateIndex
CREATE UNIQUE INDEX "company_modules_companyId_moduloCodigo_key" ON "company_modules"("companyId", "moduloCodigo");

-- CreateIndex
CREATE UNIQUE INDEX "module_definitions_codigo_key" ON "module_definitions"("codigo");

-- CreateIndex
CREATE INDEX "module_definitions_categoria_idx" ON "module_definitions"("categoria");

-- CreateIndex
CREATE INDEX "module_definitions_codigo_idx" ON "module_definitions"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "branding_configs_companyId_key" ON "branding_configs"("companyId");

-- CreateIndex
CREATE INDEX "branding_configs_companyId_idx" ON "branding_configs"("companyId");

-- CreateIndex
CREATE INDEX "iot_devices_companyId_idx" ON "iot_devices"("companyId");

-- CreateIndex
CREATE INDEX "iot_devices_buildingId_idx" ON "iot_devices"("buildingId");

-- CreateIndex
CREATE INDEX "iot_readings_deviceId_timestamp_idx" ON "iot_readings"("deviceId", "timestamp");

-- CreateIndex
CREATE INDEX "iot_automations_companyId_idx" ON "iot_automations"("companyId");

-- CreateIndex
CREATE INDEX "iot_alerts_companyId_estado_idx" ON "iot_alerts"("companyId", "estado");

-- CreateIndex
CREATE INDEX "virtual_tours_companyId_estado_idx" ON "virtual_tours"("companyId", "estado");

-- CreateIndex
CREATE INDEX "ar_visualizations_companyId_idx" ON "ar_visualizations"("companyId");

-- CreateIndex
CREATE INDEX "marketplace_services_companyId_categoria_activo_idx" ON "marketplace_services"("companyId", "categoria", "activo");

-- CreateIndex
CREATE INDEX "marketplace_bookings_companyId_tenantId_estado_idx" ON "marketplace_bookings"("companyId", "tenantId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_loyalty_tenantId_key" ON "marketplace_loyalty"("tenantId");

-- CreateIndex
CREATE INDEX "pricing_analysis_companyId_unitId_createdAt_idx" ON "pricing_analysis"("companyId", "unitId", "createdAt");

-- CreateIndex
CREATE INDEX "market_data_companyId_zona_periodo_idx" ON "market_data"("companyId", "zona", "periodo");

-- CreateIndex
CREATE INDEX "pricing_strategies_companyId_activa_idx" ON "pricing_strategies"("companyId", "activa");

-- CreateIndex
CREATE INDEX "carbon_footprints_companyId_periodo_idx" ON "carbon_footprints"("companyId", "periodo");

-- CreateIndex
CREATE INDEX "decarbonization_plans_companyId_estado_idx" ON "decarbonization_plans"("companyId", "estado");

-- CreateIndex
CREATE INDEX "esg_certifications_companyId_tipo_estado_idx" ON "esg_certifications"("companyId", "tipo", "estado");

-- CreateIndex
CREATE INDEX "esg_reports_companyId_periodo_idx" ON "esg_reports"("companyId", "periodo");

-- CreateIndex
CREATE INDEX "green_providers_companyId_tipo_idx" ON "green_providers"("companyId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "property_tokens_contractAddress_key" ON "property_tokens"("contractAddress");

-- CreateIndex
CREATE INDEX "property_tokens_companyId_estado_idx" ON "property_tokens"("companyId", "estado");

-- CreateIndex
CREATE INDEX "property_tokens_contractAddress_idx" ON "property_tokens"("contractAddress");

-- CreateIndex
CREATE INDEX "token_holders_tokenId_walletAddress_idx" ON "token_holders"("tokenId", "walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "token_transactions_txHash_key" ON "token_transactions"("txHash");

-- CreateIndex
CREATE INDEX "token_transactions_tokenId_tipo_idx" ON "token_transactions"("tokenId", "tipo");

-- CreateIndex
CREATE INDEX "token_transactions_txHash_idx" ON "token_transactions"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "smart_contracts_contractAddress_key" ON "smart_contracts"("contractAddress");

-- CreateIndex
CREATE INDEX "smart_contracts_companyId_tipo_idx" ON "smart_contracts"("companyId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "nft_certificates_tokenId_key" ON "nft_certificates"("tokenId");

-- CreateIndex
CREATE INDEX "nft_certificates_companyId_tipo_idx" ON "nft_certificates"("companyId", "tipo");

-- CreateIndex
CREATE INDEX "ai_conversations_companyId_estado_idx" ON "ai_conversations"("companyId", "estado");

-- CreateIndex
CREATE INDEX "ai_messages_conversationId_idx" ON "ai_messages"("conversationId");

-- CreateIndex
CREATE INDEX "ai_commands_conversationId_idx" ON "ai_commands"("conversationId");

-- CreateIndex
CREATE INDEX "voice_interactions_companyId_idx" ON "voice_interactions"("companyId");

-- CreateIndex
CREATE INDEX "circular_items_marketplaceId_estado_idx" ON "circular_items"("marketplaceId", "estado");

-- CreateIndex
CREATE INDEX "urban_gardens_companyId_buildingId_idx" ON "urban_gardens"("companyId", "buildingId");

-- CreateIndex
CREATE INDEX "garden_plots_gardenId_estado_idx" ON "garden_plots"("gardenId", "estado");

-- CreateIndex
CREATE INDEX "recycling_metrics_companyId_periodo_idx" ON "recycling_metrics"("companyId", "periodo");

-- CreateIndex
CREATE INDEX "social_posts_companyId_buildingId_idx" ON "social_posts"("companyId", "buildingId");

-- CreateIndex
CREATE INDEX "social_posts_authorId_idx" ON "social_posts"("authorId");

-- CreateIndex
CREATE INDEX "social_comments_postId_idx" ON "social_comments"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_reputations_tenantId_key" ON "tenant_reputations"("tenantId");

-- CreateIndex
CREATE INDEX "badges_reputationId_idx" ON "badges"("reputationId");

-- CreateIndex
CREATE INDEX "p2p_services_companyId_categoria_idx" ON "p2p_services"("companyId", "categoria");

-- CreateIndex
CREATE INDEX "p2p_services_providerId_idx" ON "p2p_services"("providerId");

-- CreateIndex
CREATE INDEX "p2p_bookings_serviceId_estado_idx" ON "p2p_bookings"("serviceId", "estado");

-- CreateIndex
CREATE INDEX "p2p_bookings_clientId_idx" ON "p2p_bookings"("clientId");

-- CreateIndex
CREATE INDEX "community_events_companyId_estado_idx" ON "community_events"("companyId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "ambassadors_tenantId_key" ON "ambassadors"("tenantId");

-- CreateIndex
CREATE INDEX "ambassadors_companyId_estado_idx" ON "ambassadors"("companyId", "estado");

-- CreateIndex
CREATE INDEX "biometric_verifications_companyId_tipo_idx" ON "biometric_verifications"("companyId", "tipo");

-- CreateIndex
CREATE INDEX "gdpr_consents_companyId_userId_idx" ON "gdpr_consents"("companyId", "userId");

-- CreateIndex
CREATE INDEX "gdpr_consents_companyId_tenantId_idx" ON "gdpr_consents"("companyId", "tenantId");

-- CreateIndex
CREATE INDEX "fraud_alerts_companyId_estado_idx" ON "fraud_alerts"("companyId", "estado");

-- CreateIndex
CREATE INDEX "fraud_alerts_entityType_entityId_idx" ON "fraud_alerts"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "security_audits_companyId_tipo_idx" ON "security_audits"("companyId", "tipo");

-- CreateIndex
CREATE INDEX "security_incidents_companyId_estado_idx" ON "security_incidents"("companyId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "company_business_models_companyId_businessModel_key" ON "company_business_models"("companyId", "businessModel");

-- CreateIndex
CREATE UNIQUE INDEX "str_calendar_listingId_fecha_key" ON "str_calendar"("listingId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "str_channel_sync_listingId_canal_key" ON "str_channel_sync"("listingId", "canal");

-- CreateIndex
CREATE INDEX "str_sync_history_channelSyncId_idx" ON "str_sync_history"("channelSyncId");

-- CreateIndex
CREATE INDEX "str_sync_history_tipoEvento_idx" ON "str_sync_history"("tipoEvento");

-- CreateIndex
CREATE INDEX "str_sync_history_exitoso_idx" ON "str_sync_history"("exitoso");

-- CreateIndex
CREATE INDEX "str_sync_history_iniciadoEn_idx" ON "str_sync_history"("iniciadoEn");

-- CreateIndex
CREATE INDEX "str_channel_pricing_listingId_idx" ON "str_channel_pricing"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "str_channel_pricing_listingId_canal_key" ON "str_channel_pricing"("listingId", "canal");

-- CreateIndex
CREATE INDEX "str_dynamic_pricing_rules_listingId_idx" ON "str_dynamic_pricing_rules"("listingId");

-- CreateIndex
CREATE INDEX "str_dynamic_pricing_rules_activo_idx" ON "str_dynamic_pricing_rules"("activo");

-- CreateIndex
CREATE INDEX "str_competitor_analysis_listingId_idx" ON "str_competitor_analysis"("listingId");

-- CreateIndex
CREATE INDEX "str_competitor_analysis_fechaCaptura_idx" ON "str_competitor_analysis"("fechaCaptura");

-- CreateIndex
CREATE INDEX "str_channel_metrics_listingId_idx" ON "str_channel_metrics"("listingId");

-- CreateIndex
CREATE INDEX "str_channel_metrics_canal_idx" ON "str_channel_metrics"("canal");

-- CreateIndex
CREATE INDEX "str_channel_metrics_periodo_idx" ON "str_channel_metrics"("periodo");

-- CreateIndex
CREATE UNIQUE INDEX "str_channel_metrics_listingId_canal_periodo_key" ON "str_channel_metrics"("listingId", "canal", "periodo");

-- CreateIndex
CREATE INDEX "str_housekeeping_tasks_companyId_idx" ON "str_housekeeping_tasks"("companyId");

-- CreateIndex
CREATE INDEX "str_housekeeping_tasks_listingId_idx" ON "str_housekeeping_tasks"("listingId");

-- CreateIndex
CREATE INDEX "str_housekeeping_tasks_fechaProgramada_idx" ON "str_housekeeping_tasks"("fechaProgramada");

-- CreateIndex
CREATE INDEX "str_housekeeping_tasks_status_idx" ON "str_housekeeping_tasks"("status");

-- CreateIndex
CREATE INDEX "str_housekeeping_tasks_asignadoA_idx" ON "str_housekeeping_tasks"("asignadoA");

-- CreateIndex
CREATE INDEX "str_housekeeping_staff_companyId_idx" ON "str_housekeeping_staff"("companyId");

-- CreateIndex
CREATE INDEX "str_housekeeping_staff_activo_idx" ON "str_housekeeping_staff"("activo");

-- CreateIndex
CREATE INDEX "str_housekeeping_inventory_companyId_idx" ON "str_housekeeping_inventory"("companyId");

-- CreateIndex
CREATE INDEX "str_housekeeping_inventory_listingId_idx" ON "str_housekeeping_inventory"("listingId");

-- CreateIndex
CREATE INDEX "str_housekeeping_inventory_categoria_idx" ON "str_housekeeping_inventory"("categoria");

-- CreateIndex
CREATE INDEX "str_housekeeping_inventory_alertaStockBajo_idx" ON "str_housekeeping_inventory"("alertaStockBajo");

-- CreateIndex
CREATE INDEX "str_inventory_movements_inventoryId_idx" ON "str_inventory_movements"("inventoryId");

-- CreateIndex
CREATE INDEX "str_inventory_movements_fecha_idx" ON "str_inventory_movements"("fecha");

-- CreateIndex
CREATE INDEX "str_housekeeping_checklists_companyId_idx" ON "str_housekeeping_checklists"("companyId");

-- CreateIndex
CREATE INDEX "str_housekeeping_checklists_tipo_idx" ON "str_housekeeping_checklists"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_unitId_numero_key" ON "rooms"("unitId", "numero");

-- CreateIndex
CREATE INDEX "user_company_access_userId_idx" ON "user_company_access"("userId");

-- CreateIndex
CREATE INDEX "user_company_access_companyId_idx" ON "user_company_access"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "user_company_access_userId_companyId_key" ON "user_company_access"("userId", "companyId");

-- CreateIndex
CREATE INDEX "social_media_accounts_companyId_idx" ON "social_media_accounts"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "social_media_accounts_companyId_platform_accountId_key" ON "social_media_accounts"("companyId", "platform", "accountId");

-- CreateIndex
CREATE INDEX "social_media_posts_companyId_idx" ON "social_media_posts"("companyId");

-- CreateIndex
CREATE INDEX "social_media_posts_accountId_idx" ON "social_media_posts"("accountId");

-- CreateIndex
CREATE INDEX "social_media_posts_estado_idx" ON "social_media_posts"("estado");

-- CreateIndex
CREATE INDEX "discount_coupons_companyId_idx" ON "discount_coupons"("companyId");

-- CreateIndex
CREATE INDEX "discount_coupons_codigo_idx" ON "discount_coupons"("codigo");

-- CreateIndex
CREATE INDEX "discount_coupons_estado_idx" ON "discount_coupons"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "discount_coupons_companyId_codigo_key" ON "discount_coupons"("companyId", "codigo");

-- CreateIndex
CREATE INDEX "coupon_usages_couponId_idx" ON "coupon_usages"("couponId");

-- CreateIndex
CREATE INDEX "coupon_usages_userId_idx" ON "coupon_usages"("userId");

-- CreateIndex
CREATE INDEX "coupon_usages_tenantId_idx" ON "coupon_usages"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "B2BInvoice_numeroFactura_key" ON "B2BInvoice"("numeroFactura");

-- CreateIndex
CREATE UNIQUE INDEX "B2BInvoice_stripeInvoiceId_key" ON "B2BInvoice"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "B2BInvoice_companyId_idx" ON "B2BInvoice"("companyId");

-- CreateIndex
CREATE INDEX "B2BInvoice_fechaEmision_idx" ON "B2BInvoice"("fechaEmision");

-- CreateIndex
CREATE INDEX "B2BInvoice_estado_idx" ON "B2BInvoice"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "B2BPaymentHistory_stripePaymentId_key" ON "B2BPaymentHistory"("stripePaymentId");

-- CreateIndex
CREATE INDEX "B2BPaymentHistory_companyId_idx" ON "B2BPaymentHistory"("companyId");

-- CreateIndex
CREATE INDEX "B2BPaymentHistory_invoiceId_idx" ON "B2BPaymentHistory"("invoiceId");

-- CreateIndex
CREATE INDEX "B2BPaymentHistory_fechaPago_idx" ON "B2BPaymentHistory"("fechaPago");

-- CreateIndex
CREATE INDEX "B2BSubscriptionHistory_companyId_idx" ON "B2BSubscriptionHistory"("companyId");

-- CreateIndex
CREATE INDEX "B2BSubscriptionHistory_fechaCambio_idx" ON "B2BSubscriptionHistory"("fechaCambio");

-- CreateIndex
CREATE UNIQUE INDEX "B2BFinancialReport_periodo_key" ON "B2BFinancialReport"("periodo");

-- CreateIndex
CREATE INDEX "B2BFinancialReport_periodo_idx" ON "B2BFinancialReport"("periodo");

-- CreateIndex
CREATE INDEX "B2BFinancialReport_tipoReporte_idx" ON "B2BFinancialReport"("tipoReporte");

-- CreateIndex
CREATE INDEX "suggestions_companyId_idx" ON "suggestions"("companyId");

-- CreateIndex
CREATE INDEX "suggestions_estado_idx" ON "suggestions"("estado");

-- CreateIndex
CREATE INDEX "suggestions_prioridad_idx" ON "suggestions"("prioridad");

-- CreateIndex
CREATE INDEX "suggestions_categoria_idx" ON "suggestions"("categoria");

-- CreateIndex
CREATE INDEX "suggestions_createdAt_idx" ON "suggestions"("createdAt");

-- CreateIndex
CREATE INDEX "leads_companyId_idx" ON "leads"("companyId");

-- CreateIndex
CREATE INDEX "leads_estado_idx" ON "leads"("estado");

-- CreateIndex
CREATE INDEX "leads_etapa_idx" ON "leads"("etapa");

-- CreateIndex
CREATE INDEX "leads_fuente_idx" ON "leads"("fuente");

-- CreateIndex
CREATE INDEX "leads_temperatura_idx" ON "leads"("temperatura");

-- CreateIndex
CREATE INDEX "leads_asignadoA_idx" ON "leads"("asignadoA");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_createdAt_idx" ON "leads"("createdAt");

-- CreateIndex
CREATE INDEX "lead_activities_leadId_idx" ON "lead_activities"("leadId");

-- CreateIndex
CREATE INDEX "lead_activities_tipo_idx" ON "lead_activities"("tipo");

-- CreateIndex
CREATE INDEX "lead_activities_fecha_idx" ON "lead_activities"("fecha");

-- CreateIndex
CREATE INDEX "lead_documents_leadId_idx" ON "lead_documents"("leadId");

-- CreateIndex
CREATE INDEX "OnboardingProgress_userId_idx" ON "OnboardingProgress"("userId");

-- CreateIndex
CREATE INDEX "OnboardingProgress_companyId_idx" ON "OnboardingProgress"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProgress_userId_companyId_key" ON "OnboardingProgress"("userId", "companyId");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_companyId_idx" ON "SupportTicket"("companyId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_category_idx" ON "SupportTicket"("category");

-- CreateIndex
CREATE INDEX "SupportTicket_priority_idx" ON "SupportTicket"("priority");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_idx" ON "TicketMessage"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "BankConsent_consentId_key" ON "BankConsent"("consentId");

-- CreateIndex
CREATE INDEX "BankConsent_connectionId_idx" ON "BankConsent"("connectionId");

-- CreateIndex
CREATE INDEX "BankConsent_status_idx" ON "BankConsent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BankPayment_paymentId_key" ON "BankPayment"("paymentId");

-- CreateIndex
CREATE INDEX "BankPayment_connectionId_idx" ON "BankPayment"("connectionId");

-- CreateIndex
CREATE INDEX "BankPayment_status_idx" ON "BankPayment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TenantInvitation_tenantId_key" ON "TenantInvitation"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantInvitation_invitationCode_key" ON "TenantInvitation"("invitationCode");

-- CreateIndex
CREATE INDEX "TenantInvitation_companyId_idx" ON "TenantInvitation"("companyId");

-- CreateIndex
CREATE INDEX "TenantInvitation_tenantId_idx" ON "TenantInvitation"("tenantId");

-- CreateIndex
CREATE INDEX "TenantInvitation_invitationCode_idx" ON "TenantInvitation"("invitationCode");

-- CreateIndex
CREATE INDEX "TenantInvitation_email_idx" ON "TenantInvitation"("email");

-- CreateIndex
CREATE INDEX "TenantInvitation_status_idx" ON "TenantInvitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_tenantId_idx" ON "PasswordResetToken"("tenantId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "ServiceRating_companyId_idx" ON "ServiceRating"("companyId");

-- CreateIndex
CREATE INDEX "ServiceRating_tenantId_idx" ON "ServiceRating"("tenantId");

-- CreateIndex
CREATE INDEX "ServiceRating_tipo_idx" ON "ServiceRating"("tipo");

-- CreateIndex
CREATE INDEX "ServiceRating_puntuacion_idx" ON "ServiceRating"("puntuacion");

-- CreateIndex
CREATE UNIQUE INDEX "TenantOnboarding_tenantId_key" ON "TenantOnboarding"("tenantId");

-- CreateIndex
CREATE INDEX "TenantOnboarding_tenantId_idx" ON "TenantOnboarding"("tenantId");

-- CreateIndex
CREATE INDEX "TenantOnboarding_completed_idx" ON "TenantOnboarding"("completed");

-- CreateIndex
CREATE UNIQUE INDEX "provider_password_reset_tokens_token_key" ON "provider_password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "provider_password_reset_tokens_providerId_idx" ON "provider_password_reset_tokens"("providerId");

-- CreateIndex
CREATE INDEX "provider_password_reset_tokens_token_idx" ON "provider_password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "provider_password_reset_tokens_expiresAt_idx" ON "provider_password_reset_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "provider_availability_providerId_idx" ON "provider_availability"("providerId");

-- CreateIndex
CREATE INDEX "provider_availability_companyId_idx" ON "provider_availability"("companyId");

-- CreateIndex
CREATE INDEX "provider_availability_estado_idx" ON "provider_availability"("estado");

-- CreateIndex
CREATE INDEX "provider_availability_fechaInicio_idx" ON "provider_availability"("fechaInicio");

-- CreateIndex
CREATE INDEX "provider_availability_fechaFin_idx" ON "provider_availability"("fechaFin");

-- CreateIndex
CREATE INDEX "provider_invoices_companyId_idx" ON "provider_invoices"("companyId");

-- CreateIndex
CREATE INDEX "provider_invoices_providerId_idx" ON "provider_invoices"("providerId");

-- CreateIndex
CREATE INDEX "provider_invoices_workOrderId_idx" ON "provider_invoices"("workOrderId");

-- CreateIndex
CREATE INDEX "provider_invoices_estado_idx" ON "provider_invoices"("estado");

-- CreateIndex
CREATE INDEX "provider_invoices_fechaVencimiento_idx" ON "provider_invoices"("fechaVencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "provider_invoices_companyId_numeroFactura_key" ON "provider_invoices"("companyId", "numeroFactura");

-- CreateIndex
CREATE INDEX "provider_invoice_payments_invoiceId_idx" ON "provider_invoice_payments"("invoiceId");

-- CreateIndex
CREATE INDEX "provider_invoice_payments_companyId_idx" ON "provider_invoice_payments"("companyId");

-- CreateIndex
CREATE INDEX "provider_invoice_payments_fechaPago_idx" ON "provider_invoice_payments"("fechaPago");

-- CreateIndex
CREATE INDEX "provider_quotes_companyId_idx" ON "provider_quotes"("companyId");

-- CreateIndex
CREATE INDEX "provider_quotes_providerId_idx" ON "provider_quotes"("providerId");

-- CreateIndex
CREATE INDEX "provider_quotes_workOrderId_idx" ON "provider_quotes"("workOrderId");

-- CreateIndex
CREATE INDEX "provider_quotes_estado_idx" ON "provider_quotes"("estado");

-- CreateIndex
CREATE INDEX "provider_reviews_companyId_idx" ON "provider_reviews"("companyId");

-- CreateIndex
CREATE INDEX "provider_reviews_providerId_idx" ON "provider_reviews"("providerId");

-- CreateIndex
CREATE INDEX "provider_reviews_workOrderId_idx" ON "provider_reviews"("workOrderId");

-- CreateIndex
CREATE INDEX "provider_reviews_puntuacion_idx" ON "provider_reviews"("puntuacion");

-- CreateIndex
CREATE INDEX "provider_reviews_visible_idx" ON "provider_reviews"("visible");

-- CreateIndex
CREATE INDEX "provider_chat_conversations_companyId_idx" ON "provider_chat_conversations"("companyId");

-- CreateIndex
CREATE INDEX "provider_chat_conversations_providerId_idx" ON "provider_chat_conversations"("providerId");

-- CreateIndex
CREATE INDEX "provider_chat_conversations_estado_idx" ON "provider_chat_conversations"("estado");

-- CreateIndex
CREATE INDEX "provider_chat_conversations_ultimoMensajeFecha_idx" ON "provider_chat_conversations"("ultimoMensajeFecha");

-- CreateIndex
CREATE INDEX "provider_chat_messages_conversationId_idx" ON "provider_chat_messages"("conversationId");

-- CreateIndex
CREATE INDEX "provider_chat_messages_companyId_idx" ON "provider_chat_messages"("companyId");

-- CreateIndex
CREATE INDEX "provider_chat_messages_leido_idx" ON "provider_chat_messages"("leido");

-- CreateIndex
CREATE INDEX "provider_chat_messages_createdAt_idx" ON "provider_chat_messages"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "owners_email_key" ON "owners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "owners_dni_key" ON "owners"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "owners_resetToken_key" ON "owners"("resetToken");

-- CreateIndex
CREATE INDEX "owners_companyId_idx" ON "owners"("companyId");

-- CreateIndex
CREATE INDEX "owners_email_idx" ON "owners"("email");

-- CreateIndex
CREATE INDEX "owners_activo_idx" ON "owners"("activo");

-- CreateIndex
CREATE INDEX "owners_companyId_activo_idx" ON "owners"("companyId", "activo");

-- CreateIndex
CREATE INDEX "owner_buildings_ownerId_idx" ON "owner_buildings"("ownerId");

-- CreateIndex
CREATE INDEX "owner_buildings_buildingId_idx" ON "owner_buildings"("buildingId");

-- CreateIndex
CREATE INDEX "owner_buildings_companyId_idx" ON "owner_buildings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "owner_buildings_ownerId_buildingId_key" ON "owner_buildings"("ownerId", "buildingId");

-- CreateIndex
CREATE INDEX "owner_notifications_ownerId_leida_idx" ON "owner_notifications"("ownerId", "leida");

-- CreateIndex
CREATE INDEX "owner_notifications_companyId_idx" ON "owner_notifications"("companyId");

-- CreateIndex
CREATE INDEX "owner_notifications_createdAt_idx" ON "owner_notifications"("createdAt");

-- CreateIndex
CREATE INDEX "owner_alerts_ownerId_activa_idx" ON "owner_alerts"("ownerId", "activa");

-- CreateIndex
CREATE INDEX "owner_alerts_companyId_idx" ON "owner_alerts"("companyId");

-- CreateIndex
CREATE INDEX "owner_alerts_buildingId_idx" ON "owner_alerts"("buildingId");

-- CreateIndex
CREATE INDEX "automations_companyId_activa_idx" ON "automations"("companyId", "activa");

-- CreateIndex
CREATE INDEX "automations_userId_idx" ON "automations"("userId");

-- CreateIndex
CREATE INDEX "automations_proximaEjecucion_idx" ON "automations"("proximaEjecucion");

-- CreateIndex
CREATE INDEX "automations_tipo_idx" ON "automations"("tipo");

-- CreateIndex
CREATE INDEX "automation_executions_automationId_idx" ON "automation_executions"("automationId");

-- CreateIndex
CREATE INDEX "automation_executions_companyId_ejecutadaEn_idx" ON "automation_executions"("companyId", "ejecutadaEn");

-- CreateIndex
CREATE INDEX "automation_executions_estado_idx" ON "automation_executions"("estado");

-- CreateIndex
CREATE INDEX "automation_templates_categoria_idx" ON "automation_templates"("categoria");

-- CreateIndex
CREATE INDEX "automation_templates_popular_idx" ON "automation_templates"("popular");

-- CreateIndex
CREATE INDEX "automation_templates_vertical_idx" ON "automation_templates"("vertical");

-- CreateIndex
CREATE INDEX "notification_rules_companyId_activa_idx" ON "notification_rules"("companyId", "activa");

-- CreateIndex
CREATE INDEX "notification_rules_tipoEvento_idx" ON "notification_rules"("tipoEvento");

-- CreateIndex
CREATE INDEX "notification_templates_companyId_idx" ON "notification_templates"("companyId");

-- CreateIndex
CREATE INDEX "notification_templates_categoria_idx" ON "notification_templates"("categoria");

-- CreateIndex
CREATE INDEX "notification_logs_companyId_enviadoEn_idx" ON "notification_logs"("companyId", "enviadoEn");

-- CreateIndex
CREATE INDEX "notification_logs_userId_leida_idx" ON "notification_logs"("userId", "leida");

-- CreateIndex
CREATE INDEX "notification_logs_estado_idx" ON "notification_logs"("estado");

-- CreateIndex
CREATE INDEX "notification_logs_canal_idx" ON "notification_logs"("canal");

-- CreateIndex
CREATE INDEX "notification_logs_tipo_idx" ON "notification_logs"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_settings_userId_key" ON "user_notification_settings"("userId");

-- CreateIndex
CREATE INDEX "support_interactions_userId_createdAt_idx" ON "support_interactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "support_interactions_type_idx" ON "support_interactions"("type");

-- CreateIndex
CREATE INDEX "support_interactions_sentiment_idx" ON "support_interactions"("sentiment");

-- CreateIndex
CREATE INDEX "support_interactions_urgency_idx" ON "support_interactions"("urgency");

-- CreateIndex
CREATE INDEX "community_minutes_companyId_buildingId_idx" ON "community_minutes"("companyId", "buildingId");

-- CreateIndex
CREATE INDEX "community_minutes_fecha_idx" ON "community_minutes"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "community_minutes_companyId_buildingId_numeroActa_key" ON "community_minutes"("companyId", "buildingId", "numeroActa");

-- CreateIndex
CREATE INDEX "community_fees_companyId_buildingId_idx" ON "community_fees"("companyId", "buildingId");

-- CreateIndex
CREATE INDEX "community_fees_unitId_idx" ON "community_fees"("unitId");

-- CreateIndex
CREATE INDEX "community_fees_periodo_estado_idx" ON "community_fees"("periodo", "estado");

-- CreateIndex
CREATE INDEX "community_funds_companyId_buildingId_idx" ON "community_funds"("companyId", "buildingId");

-- CreateIndex
CREATE INDEX "community_funds_tipo_activo_idx" ON "community_funds"("tipo", "activo");

-- CreateIndex
CREATE INDEX "financial_alerts_companyId_tipo_estado_idx" ON "financial_alerts"("companyId", "tipo", "estado");

-- CreateIndex
CREATE INDEX "financial_alerts_severidad_fechaDeteccion_idx" ON "financial_alerts"("severidad", "fechaDeteccion");

-- CreateIndex
CREATE INDEX "cash_flow_forecasts_companyId_mes_idx" ON "cash_flow_forecasts"("companyId", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "cash_flow_forecasts_companyId_buildingId_mes_key" ON "cash_flow_forecasts"("companyId", "buildingId", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_management_contractId_key" ON "deposit_management"("contractId");

-- CreateIndex
CREATE INDEX "deposit_management_companyId_idx" ON "deposit_management"("companyId");

-- CreateIndex
CREATE INDEX "deposit_management_depositadoOficialmente_devuelto_idx" ON "deposit_management"("depositadoOficialmente", "devuelto");

-- CreateIndex
CREATE UNIQUE INDEX "bad_debt_provisions_paymentId_key" ON "bad_debt_provisions"("paymentId");

-- CreateIndex
CREATE INDEX "bad_debt_provisions_companyId_categoriaRiesgo_idx" ON "bad_debt_provisions"("companyId", "categoriaRiesgo");

-- CreateIndex
CREATE INDEX "bad_debt_provisions_gestionado_recuperado_idx" ON "bad_debt_provisions"("gestionado", "recuperado");

-- CreateIndex
CREATE INDEX "habitability_certificates_companyId_estado_idx" ON "habitability_certificates"("companyId", "estado");

-- CreateIndex
CREATE INDEX "habitability_certificates_fechaVencimiento_alertaEnviada_idx" ON "habitability_certificates"("fechaVencimiento", "alertaEnviada");

-- CreateIndex
CREATE UNIQUE INDEX "habitability_certificates_unitId_numeroCedula_key" ON "habitability_certificates"("unitId", "numeroCedula");

-- CreateIndex
CREATE INDEX "modelo_347_records_companyId_ejercicio_idx" ON "modelo_347_records"("companyId", "ejercicio");

-- CreateIndex
CREATE INDEX "modelo_347_records_presentado_idx" ON "modelo_347_records"("presentado");

-- CreateIndex
CREATE UNIQUE INDEX "modelo_347_records_companyId_ejercicio_nifDeclarado_key" ON "modelo_347_records"("companyId", "ejercicio", "nifDeclarado");

-- CreateIndex
CREATE INDEX "modelo_180_records_companyId_ejercicio_trimestre_idx" ON "modelo_180_records"("companyId", "ejercicio", "trimestre");

-- CreateIndex
CREATE INDEX "modelo_180_records_presentado_idx" ON "modelo_180_records"("presentado");

-- CreateIndex
CREATE UNIQUE INDEX "modelo_180_records_companyId_ejercicio_trimestre_nifArrenda_key" ON "modelo_180_records"("companyId", "ejercicio", "trimestre", "nifArrendatario");

-- CreateIndex
CREATE INDEX "building_inspections_companyId_buildingId_idx" ON "building_inspections"("companyId", "buildingId");

-- CreateIndex
CREATE INDEX "building_inspections_fechaVencimiento_estado_idx" ON "building_inspections"("fechaVencimiento", "estado");

-- CreateIndex
CREATE INDEX "building_inspections_alertasEnviadas_idx" ON "building_inspections"("alertasEnviadas");

-- CreateIndex
CREATE UNIQUE INDEX "community_management_buildingId_key" ON "community_management"("buildingId");

-- CreateIndex
CREATE INDEX "community_management_companyId_idx" ON "community_management"("companyId");

-- CreateIndex
CREATE INDEX "community_management_buildingId_idx" ON "community_management"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "community_invoices_numeroFactura_key" ON "community_invoices"("numeroFactura");

-- CreateIndex
CREATE INDEX "community_invoices_companyId_idx" ON "community_invoices"("companyId");

-- CreateIndex
CREATE INDEX "community_invoices_communityId_idx" ON "community_invoices"("communityId");

-- CreateIndex
CREATE INDEX "community_invoices_numeroFactura_idx" ON "community_invoices"("numeroFactura");

-- CreateIndex
CREATE INDEX "community_invoices_estado_idx" ON "community_invoices"("estado");

-- CreateIndex
CREATE INDEX "cash_book_entries_companyId_idx" ON "cash_book_entries"("companyId");

-- CreateIndex
CREATE INDEX "cash_book_entries_communityId_idx" ON "cash_book_entries"("communityId");

-- CreateIndex
CREATE INDEX "cash_book_entries_fecha_idx" ON "cash_book_entries"("fecha");

-- CreateIndex
CREATE INDEX "cash_book_entries_tipo_idx" ON "cash_book_entries"("tipo");

-- CreateIndex
CREATE INDEX "cash_book_entries_categoria_idx" ON "cash_book_entries"("categoria");

-- CreateIndex
CREATE INDEX "community_reports_companyId_idx" ON "community_reports"("companyId");

-- CreateIndex
CREATE INDEX "community_reports_communityId_idx" ON "community_reports"("communityId");

-- CreateIndex
CREATE INDEX "community_reports_tipo_idx" ON "community_reports"("tipo");

-- CreateIndex
CREATE INDEX "community_reports_periodo_idx" ON "community_reports"("periodo");

-- CreateIndex
CREATE UNIQUE INDEX "ColivingProfile_tenantId_key" ON "ColivingProfile"("tenantId");

-- CreateIndex
CREATE INDEX "ColivingProfile_companyId_idx" ON "ColivingProfile"("companyId");

-- CreateIndex
CREATE INDEX "ColivingProfile_tenantId_idx" ON "ColivingProfile"("tenantId");

-- CreateIndex
CREATE INDEX "ColivingMatch_profile1Id_idx" ON "ColivingMatch"("profile1Id");

-- CreateIndex
CREATE INDEX "ColivingMatch_companyId_idx" ON "ColivingMatch"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ColivingMatch_profile1Id_profile2Id_key" ON "ColivingMatch"("profile1Id", "profile2Id");

-- CreateIndex
CREATE INDEX "ColivingGroup_companyId_idx" ON "ColivingGroup"("companyId");

-- CreateIndex
CREATE INDEX "ColivingGroup_buildingId_idx" ON "ColivingGroup"("buildingId");

-- CreateIndex
CREATE INDEX "ColivingGroupMember_groupId_idx" ON "ColivingGroupMember"("groupId");

-- CreateIndex
CREATE INDEX "ColivingGroupMember_profileId_idx" ON "ColivingGroupMember"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "ColivingGroupMember_groupId_profileId_key" ON "ColivingGroupMember"("groupId", "profileId");

-- CreateIndex
CREATE INDEX "ColivingActivityPost_companyId_idx" ON "ColivingActivityPost"("companyId");

-- CreateIndex
CREATE INDEX "ColivingActivityPost_buildingId_idx" ON "ColivingActivityPost"("buildingId");

-- CreateIndex
CREATE INDEX "ColivingActivityPost_profileId_idx" ON "ColivingActivityPost"("profileId");

-- CreateIndex
CREATE INDEX "ColivingEvent_companyId_idx" ON "ColivingEvent"("companyId");

-- CreateIndex
CREATE INDEX "ColivingEvent_buildingId_idx" ON "ColivingEvent"("buildingId");

-- CreateIndex
CREATE INDEX "ColivingEvent_groupId_idx" ON "ColivingEvent"("groupId");

-- CreateIndex
CREATE INDEX "ColivingEventAttendance_eventId_idx" ON "ColivingEventAttendance"("eventId");

-- CreateIndex
CREATE INDEX "ColivingEventAttendance_profileId_idx" ON "ColivingEventAttendance"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "ColivingEventAttendance_eventId_profileId_key" ON "ColivingEventAttendance"("eventId", "profileId");

-- CreateIndex
CREATE INDEX "ColivingService_companyId_idx" ON "ColivingService"("companyId");

-- CreateIndex
CREATE INDEX "ColivingService_categoria_idx" ON "ColivingService"("categoria");

-- CreateIndex
CREATE INDEX "ColivingServiceBooking_serviceId_idx" ON "ColivingServiceBooking"("serviceId");

-- CreateIndex
CREATE INDEX "ColivingServiceBooking_tenantId_idx" ON "ColivingServiceBooking"("tenantId");

-- CreateIndex
CREATE INDEX "ColivingServiceBooking_companyId_idx" ON "ColivingServiceBooking"("companyId");

-- CreateIndex
CREATE INDEX "ColivingServiceBooking_fechaServicio_idx" ON "ColivingServiceBooking"("fechaServicio");

-- CreateIndex
CREATE INDEX "ColivingCheckInOut_tenantId_idx" ON "ColivingCheckInOut"("tenantId");

-- CreateIndex
CREATE INDEX "ColivingCheckInOut_companyId_idx" ON "ColivingCheckInOut"("companyId");

-- CreateIndex
CREATE INDEX "ColivingCheckInOut_unitId_idx" ON "ColivingCheckInOut"("unitId");

-- CreateIndex
CREATE INDEX "ColivingCheckInOut_roomId_idx" ON "ColivingCheckInOut"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "SmartLock_numeroSerie_key" ON "SmartLock"("numeroSerie");

-- CreateIndex
CREATE INDEX "SmartLock_companyId_idx" ON "SmartLock"("companyId");

-- CreateIndex
CREATE INDEX "SmartLock_buildingId_idx" ON "SmartLock"("buildingId");

-- CreateIndex
CREATE INDEX "SmartLock_unitId_idx" ON "SmartLock"("unitId");

-- CreateIndex
CREATE INDEX "SmartLock_roomId_idx" ON "SmartLock"("roomId");

-- CreateIndex
CREATE INDEX "SmartLockAccess_lockId_idx" ON "SmartLockAccess"("lockId");

-- CreateIndex
CREATE INDEX "SmartLockAccess_tenantId_idx" ON "SmartLockAccess"("tenantId");

-- CreateIndex
CREATE INDEX "ColivingPackage_tenantId_idx" ON "ColivingPackage"("tenantId");

-- CreateIndex
CREATE INDEX "ColivingPackage_companyId_idx" ON "ColivingPackage"("companyId");

-- CreateIndex
CREATE INDEX "ColivingPackage_buildingId_idx" ON "ColivingPackage"("buildingId");

-- CreateIndex
CREATE INDEX "ColivingPackage_estado_idx" ON "ColivingPackage"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_cif_key" ON "Partner"("cif");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_contactoEmail_key" ON "Partner"("contactoEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_email_key" ON "Partner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_dominioPersonalizado_key" ON "Partner"("dominioPersonalizado");

-- CreateIndex
CREATE INDEX "Partner_email_idx" ON "Partner"("email");

-- CreateIndex
CREATE INDEX "Partner_estado_idx" ON "Partner"("estado");

-- CreateIndex
CREATE INDEX "Partner_tipo_idx" ON "Partner"("tipo");

-- CreateIndex
CREATE INDEX "PartnerClient_partnerId_idx" ON "PartnerClient"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerClient_companyId_idx" ON "PartnerClient"("companyId");

-- CreateIndex
CREATE INDEX "PartnerClient_estado_idx" ON "PartnerClient"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerClient_partnerId_companyId_key" ON "PartnerClient"("partnerId", "companyId");

-- CreateIndex
CREATE INDEX "Commission_partnerId_idx" ON "Commission"("partnerId");

-- CreateIndex
CREATE INDEX "Commission_companyId_idx" ON "Commission"("companyId");

-- CreateIndex
CREATE INDEX "Commission_periodo_idx" ON "Commission"("periodo");

-- CreateIndex
CREATE INDEX "Commission_estado_idx" ON "Commission"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Commission_partnerId_companyId_periodo_key" ON "Commission"("partnerId", "companyId", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerInvitation_token_key" ON "PartnerInvitation"("token");

-- CreateIndex
CREATE INDEX "PartnerInvitation_partnerId_idx" ON "PartnerInvitation"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerInvitation_email_idx" ON "PartnerInvitation"("email");

-- CreateIndex
CREATE INDEX "PartnerInvitation_token_idx" ON "PartnerInvitation"("token");

-- CreateIndex
CREATE INDEX "PartnerInvitation_estado_idx" ON "PartnerInvitation"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "SalesRepresentative_dni_key" ON "SalesRepresentative"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "SalesRepresentative_email_key" ON "SalesRepresentative"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SalesRepresentative_codigoReferido_key" ON "SalesRepresentative"("codigoReferido");

-- CreateIndex
CREATE UNIQUE INDEX "SalesRepresentative_apiKey_key" ON "SalesRepresentative"("apiKey");

-- CreateIndex
CREATE INDEX "SalesRepresentative_email_idx" ON "SalesRepresentative"("email");

-- CreateIndex
CREATE INDEX "SalesRepresentative_estado_idx" ON "SalesRepresentative"("estado");

-- CreateIndex
CREATE INDEX "SalesRepresentative_codigoReferido_idx" ON "SalesRepresentative"("codigoReferido");

-- CreateIndex
CREATE INDEX "SalesRepresentative_activo_idx" ON "SalesRepresentative"("activo");

-- CreateIndex
CREATE INDEX "SalesRepresentative_apiKey_idx" ON "SalesRepresentative"("apiKey");

-- CreateIndex
CREATE INDEX "SalesRepresentative_parentSalesRepId_idx" ON "SalesRepresentative"("parentSalesRepId");

-- CreateIndex
CREATE INDEX "SalesLead_salesRepId_idx" ON "SalesLead"("salesRepId");

-- CreateIndex
CREATE INDEX "SalesLead_estado_idx" ON "SalesLead"("estado");

-- CreateIndex
CREATE INDEX "SalesLead_convertido_idx" ON "SalesLead"("convertido");

-- CreateIndex
CREATE INDEX "SalesLead_companyId_idx" ON "SalesLead"("companyId");

-- CreateIndex
CREATE INDEX "SalesLead_fechaCaptura_idx" ON "SalesLead"("fechaCaptura");

-- CreateIndex
CREATE INDEX "SalesCommission_salesRepId_idx" ON "SalesCommission"("salesRepId");

-- CreateIndex
CREATE INDEX "SalesCommission_leadId_idx" ON "SalesCommission"("leadId");

-- CreateIndex
CREATE INDEX "SalesCommission_estado_idx" ON "SalesCommission"("estado");

-- CreateIndex
CREATE INDEX "SalesCommission_periodo_idx" ON "SalesCommission"("periodo");

-- CreateIndex
CREATE INDEX "SalesCommission_fechaGeneracion_idx" ON "SalesCommission"("fechaGeneracion");

-- CreateIndex
CREATE INDEX "SalesTarget_salesRepId_idx" ON "SalesTarget"("salesRepId");

-- CreateIndex
CREATE INDEX "SalesTarget_periodo_idx" ON "SalesTarget"("periodo");

-- CreateIndex
CREATE INDEX "SalesTarget_cumplido_idx" ON "SalesTarget"("cumplido");

-- CreateIndex
CREATE UNIQUE INDEX "SalesTarget_salesRepId_periodo_key" ON "SalesTarget"("salesRepId", "periodo");

-- CreateIndex
CREATE INDEX "MarketingMaterial_tipo_idx" ON "MarketingMaterial"("tipo");

-- CreateIndex
CREATE INDEX "MarketingMaterial_activo_idx" ON "MarketingMaterial"("activo");

-- CreateIndex
CREATE INDEX "MaterialDownload_salesRepId_idx" ON "MaterialDownload"("salesRepId");

-- CreateIndex
CREATE INDEX "MaterialDownload_materialId_idx" ON "MaterialDownload"("materialId");

-- CreateIndex
CREATE INDEX "PartnerCertification_nivel_idx" ON "PartnerCertification"("nivel");

-- CreateIndex
CREATE INDEX "PartnerCertification_activo_idx" ON "PartnerCertification"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerCertificationAwarded_certificadoNumero_key" ON "PartnerCertificationAwarded"("certificadoNumero");

-- CreateIndex
CREATE INDEX "PartnerCertificationAwarded_salesRepId_idx" ON "PartnerCertificationAwarded"("salesRepId");

-- CreateIndex
CREATE INDEX "PartnerCertificationAwarded_certificationId_idx" ON "PartnerCertificationAwarded"("certificationId");

-- CreateIndex
CREATE INDEX "coliving_analytics_companyId_idx" ON "coliving_analytics"("companyId");

-- CreateIndex
CREATE INDEX "coliving_analytics_periodo_idx" ON "coliving_analytics"("periodo");

-- CreateIndex
CREATE UNIQUE INDEX "coliving_analytics_companyId_periodo_key" ON "coliving_analytics"("companyId", "periodo");

-- CreateIndex
CREATE INDEX "nps_surveys_companyId_idx" ON "nps_surveys"("companyId");

-- CreateIndex
CREATE INDEX "nps_surveys_tenantId_idx" ON "nps_surveys"("tenantId");

-- CreateIndex
CREATE INDEX "nps_surveys_fechaEncuesta_idx" ON "nps_surveys"("fechaEncuesta");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_profiles_tenantId_key" ON "tenant_profiles"("tenantId");

-- CreateIndex
CREATE INDEX "space_waitlist_companyId_idx" ON "space_waitlist"("companyId");

-- CreateIndex
CREATE INDEX "space_waitlist_spaceId_idx" ON "space_waitlist"("spaceId");

-- CreateIndex
CREATE INDEX "space_waitlist_tenantId_idx" ON "space_waitlist"("tenantId");

-- CreateIndex
CREATE INDEX "space_waitlist_status_idx" ON "space_waitlist"("status");

-- CreateIndex
CREATE INDEX "space_waitlist_fechaDeseada_idx" ON "space_waitlist"("fechaDeseada");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_credits_tenantId_key" ON "reservation_credits"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "space_ratings_reservationId_key" ON "space_ratings"("reservationId");

-- CreateIndex
CREATE INDEX "space_ratings_companyId_idx" ON "space_ratings"("companyId");

-- CreateIndex
CREATE INDEX "space_ratings_spaceId_idx" ON "space_ratings"("spaceId");

-- CreateIndex
CREATE INDEX "space_ratings_tenantId_idx" ON "space_ratings"("tenantId");

-- CreateIndex
CREATE INDEX "space_ratings_puntuacion_idx" ON "space_ratings"("puntuacion");

-- CreateIndex
CREATE INDEX "space_maintenance_predictions_companyId_idx" ON "space_maintenance_predictions"("companyId");

-- CreateIndex
CREATE INDEX "space_maintenance_predictions_spaceId_idx" ON "space_maintenance_predictions"("spaceId");

-- CreateIndex
CREATE INDEX "space_maintenance_predictions_periodo_idx" ON "space_maintenance_predictions"("periodo");

-- CreateIndex
CREATE INDEX "space_maintenance_predictions_mantenimientoSugerido_idx" ON "space_maintenance_predictions"("mantenimientoSugerido");

-- CreateIndex
CREATE INDEX "event_attendees_eventId_idx" ON "event_attendees"("eventId");

-- CreateIndex
CREATE INDEX "event_attendees_tenantId_idx" ON "event_attendees"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendees_eventId_tenantId_key" ON "event_attendees"("eventId", "tenantId");

-- CreateIndex
CREATE INDEX "event_comments_eventId_idx" ON "event_comments"("eventId");

-- CreateIndex
CREATE INDEX "event_comments_tenantId_idx" ON "event_comments"("tenantId");

-- CreateIndex
CREATE INDEX "post_reactions_postId_idx" ON "post_reactions"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "post_reactions_postId_tenantId_key" ON "post_reactions"("postId", "tenantId");

-- CreateIndex
CREATE INDEX "announcement_confirmations_announcementId_idx" ON "announcement_confirmations"("announcementId");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_confirmations_announcementId_tenantId_key" ON "announcement_confirmations"("announcementId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_confirmations_announcementId_userId_key" ON "announcement_confirmations"("announcementId", "userId");

-- CreateIndex
CREATE INDEX "community_engagement_metrics_companyId_idx" ON "community_engagement_metrics"("companyId");

-- CreateIndex
CREATE INDEX "community_engagement_metrics_buildingId_idx" ON "community_engagement_metrics"("buildingId");

-- CreateIndex
CREATE INDEX "community_engagement_metrics_colivingId_idx" ON "community_engagement_metrics"("colivingId");

-- CreateIndex
CREATE INDEX "community_engagement_metrics_periodo_idx" ON "community_engagement_metrics"("periodo");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_legalTemplateId_fkey" FOREIGN KEY ("legalTemplateId") REFERENCES "legal_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_stripeSubscriptionId_fkey" FOREIGN KEY ("stripeSubscriptionId") REFERENCES "stripe_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stripe_subscriptions" ADD CONSTRAINT "stripe_subscriptions_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stripe_customers" ADD CONSTRAINT "stripe_customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "document_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_parentCompanyId_fkey" FOREIGN KEY ("parentCompanyId") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_asignadoA_fkey" FOREIGN KEY ("asignadoA") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "maintenance_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_recipients" ADD CONSTRAINT "email_recipients_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "document_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_quotes" ADD CONSTRAINT "service_quotes_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_quotes" ADD CONSTRAINT "service_quotes_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_quotes" ADD CONSTRAINT "service_quotes_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_jobs" ADD CONSTRAINT "service_jobs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_jobs" ADD CONSTRAINT "service_jobs_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "service_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_jobs" ADD CONSTRAINT "service_jobs_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_jobs" ADD CONSTRAINT "service_jobs_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "service_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_readings" ADD CONSTRAINT "energy_readings_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_readings" ADD CONSTRAINT "energy_readings_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_alerts" ADD CONSTRAINT "energy_alerts_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_alerts" ADD CONSTRAINT "energy_alerts_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_conversations" ADD CONSTRAINT "chatbot_conversations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_conversations" ADD CONSTRAINT "chatbot_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_messages" ADD CONSTRAINT "chatbot_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chatbot_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "morosidad_predicciones" ADD CONSTRAINT "morosidad_predicciones_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "morosidad_predicciones" ADD CONSTRAINT "morosidad_predicciones_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "morosidad_historial" ADD CONSTRAINT "morosidad_historial_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "morosidad_historial" ADD CONSTRAINT "morosidad_historial_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_firma" ADD CONSTRAINT "documentos_firma_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_firma" ADD CONSTRAINT "documentos_firma_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_firma" ADD CONSTRAINT "documentos_firma_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_firma" ADD CONSTRAINT "documentos_firma_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firmantes" ADD CONSTRAINT "firmantes_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos_firma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "bank_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliaciones_manuales" ADD CONSTRAINT "conciliaciones_manuales_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliaciones_manuales" ADD CONSTRAINT "conciliaciones_manuales_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valoraciones_propiedades" ADD CONSTRAINT "valoraciones_propiedades_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valoraciones_propiedades" ADD CONSTRAINT "valoraciones_propiedades_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valoraciones_propiedades" ADD CONSTRAINT "valoraciones_propiedades_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicaciones_portales" ADD CONSTRAINT "publicaciones_portales_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicaciones_portales" ADD CONSTRAINT "publicaciones_portales_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicaciones_portales" ADD CONSTRAINT "publicaciones_portales_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screening_candidatos" ADD CONSTRAINT "screening_candidatos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screening_candidatos" ADD CONSTRAINT "screening_candidatos_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_templates" ADD CONSTRAINT "sms_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "sms_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_maintenanceRequestId_fkey" FOREIGN KEY ("maintenanceRequestId") REFERENCES "maintenance_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common_spaces" ADD CONSTRAINT "common_spaces_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common_spaces" ADD CONSTRAINT "common_spaces_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_reservations" ADD CONSTRAINT "space_reservations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_reservations" ADD CONSTRAINT "space_reservations_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "common_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_reservations" ADD CONSTRAINT "space_reservations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurances" ADD CONSTRAINT "insurances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurances" ADD CONSTRAINT "insurances_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurances" ADD CONSTRAINT "insurances_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "insurances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_certificates" ADD CONSTRAINT "energy_certificates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_certificates" ADD CONSTRAINT "energy_certificates_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_incidents" ADD CONSTRAINT "community_incidents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_incidents" ADD CONSTRAINT "community_incidents_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_incidents" ADD CONSTRAINT "community_incidents_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_votes" ADD CONSTRAINT "community_votes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_votes" ADD CONSTRAINT "community_votes_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_records" ADD CONSTRAINT "vote_records_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "community_votes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_announcements" ADD CONSTRAINT "community_announcements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_announcements" ADD CONSTRAINT "community_announcements_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_meetings" ADD CONSTRAINT "community_meetings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_meetings" ADD CONSTRAINT "community_meetings_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_work_orders" ADD CONSTRAINT "provider_work_orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_work_orders" ADD CONSTRAINT "provider_work_orders_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_work_orders" ADD CONSTRAINT "provider_work_orders_maintenanceRequestId_fkey" FOREIGN KEY ("maintenanceRequestId") REFERENCES "maintenance_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_work_orders" ADD CONSTRAINT "provider_work_orders_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_work_orders" ADD CONSTRAINT "provider_work_orders_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_galleries" ADD CONSTRAINT "property_galleries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_galleries" ADD CONSTRAINT "property_galleries_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "property_galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dashboard_preferences" ADD CONSTRAINT "user_dashboard_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "user_dashboard_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automatic_reminders" ADD CONSTRAINT "automatic_reminders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_backups" ADD CONSTRAINT "system_backups_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_modules" ADD CONSTRAINT "company_modules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branding_configs" ADD CONSTRAINT "branding_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_readings" ADD CONSTRAINT "iot_readings_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "iot_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_automations" ADD CONSTRAINT "iot_automations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_automations" ADD CONSTRAINT "iot_automations_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "iot_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_alerts" ADD CONSTRAINT "iot_alerts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_alerts" ADD CONSTRAINT "iot_alerts_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "iot_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_tours" ADD CONSTRAINT "virtual_tours_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_tours" ADD CONSTRAINT "virtual_tours_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_tours" ADD CONSTRAINT "virtual_tours_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_visualizations" ADD CONSTRAINT "ar_visualizations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_visualizations" ADD CONSTRAINT "ar_visualizations_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_services" ADD CONSTRAINT "marketplace_services_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_services" ADD CONSTRAINT "marketplace_services_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_bookings" ADD CONSTRAINT "marketplace_bookings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_bookings" ADD CONSTRAINT "marketplace_bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "marketplace_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_bookings" ADD CONSTRAINT "marketplace_bookings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_bookings" ADD CONSTRAINT "marketplace_bookings_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_loyalty" ADD CONSTRAINT "marketplace_loyalty_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_loyalty" ADD CONSTRAINT "marketplace_loyalty_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_analysis" ADD CONSTRAINT "pricing_analysis_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_analysis" ADD CONSTRAINT "pricing_analysis_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_data" ADD CONSTRAINT "market_data_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_strategies" ADD CONSTRAINT "pricing_strategies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_strategies" ADD CONSTRAINT "pricing_strategies_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carbon_footprints" ADD CONSTRAINT "carbon_footprints_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carbon_footprints" ADD CONSTRAINT "carbon_footprints_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decarbonization_plans" ADD CONSTRAINT "decarbonization_plans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decarbonization_plans" ADD CONSTRAINT "decarbonization_plans_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esg_certifications" ADD CONSTRAINT "esg_certifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esg_certifications" ADD CONSTRAINT "esg_certifications_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esg_reports" ADD CONSTRAINT "esg_reports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "green_providers" ADD CONSTRAINT "green_providers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_tokens" ADD CONSTRAINT "property_tokens_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_tokens" ADD CONSTRAINT "property_tokens_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_tokens" ADD CONSTRAINT "property_tokens_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_holders" ADD CONSTRAINT "token_holders_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "property_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_holders" ADD CONSTRAINT "token_holders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_transactions" ADD CONSTRAINT "token_transactions_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "property_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smart_contracts" ADD CONSTRAINT "smart_contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_certificates" ADD CONSTRAINT "nft_certificates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_certificates" ADD CONSTRAINT "nft_certificates_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_certificates" ADD CONSTRAINT "nft_certificates_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_commands" ADD CONSTRAINT "ai_commands_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_interactions" ADD CONSTRAINT "voice_interactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_interactions" ADD CONSTRAINT "voice_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circular_marketplaces" ADD CONSTRAINT "circular_marketplaces_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circular_items" ADD CONSTRAINT "circular_items_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "circular_marketplaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circular_items" ADD CONSTRAINT "circular_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "urban_gardens" ADD CONSTRAINT "urban_gardens_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "urban_gardens" ADD CONSTRAINT "urban_gardens_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garden_plots" ADD CONSTRAINT "garden_plots_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "urban_gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garden_plots" ADD CONSTRAINT "garden_plots_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recycling_metrics" ADD CONSTRAINT "recycling_metrics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recycling_metrics" ADD CONSTRAINT "recycling_metrics_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_comments" ADD CONSTRAINT "social_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_comments" ADD CONSTRAINT "social_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_reputations" ADD CONSTRAINT "tenant_reputations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_reputationId_fkey" FOREIGN KEY ("reputationId") REFERENCES "tenant_reputations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p2p_services" ADD CONSTRAINT "p2p_services_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p2p_services" ADD CONSTRAINT "p2p_services_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p2p_bookings" ADD CONSTRAINT "p2p_bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "p2p_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p2p_bookings" ADD CONSTRAINT "p2p_bookings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_events" ADD CONSTRAINT "community_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_events" ADD CONSTRAINT "community_events_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassadors" ADD CONSTRAINT "ambassadors_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassadors" ADD CONSTRAINT "ambassadors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassadors" ADD CONSTRAINT "ambassadors_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_verifications" ADD CONSTRAINT "biometric_verifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_verifications" ADD CONSTRAINT "biometric_verifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_verifications" ADD CONSTRAINT "biometric_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gdpr_consents" ADD CONSTRAINT "gdpr_consents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gdpr_consents" ADD CONSTRAINT "gdpr_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gdpr_consents" ADD CONSTRAINT "gdpr_consents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_audits" ADD CONSTRAINT "security_audits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_incidents" ADD CONSTRAINT "security_incidents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_business_models" ADD CONSTRAINT "company_business_models_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_listings" ADD CONSTRAINT "str_listings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_listings" ADD CONSTRAINT "str_listings_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_bookings" ADD CONSTRAINT "str_bookings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_bookings" ADD CONSTRAINT "str_bookings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "str_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_calendar" ADD CONSTRAINT "str_calendar_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "str_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_channel_sync" ADD CONSTRAINT "str_channel_sync_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_channel_sync" ADD CONSTRAINT "str_channel_sync_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "str_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_reviews" ADD CONSTRAINT "str_reviews_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "str_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_season_pricing" ADD CONSTRAINT "str_season_pricing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "str_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_channel_pricing" ADD CONSTRAINT "str_channel_pricing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "str_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_dynamic_pricing_rules" ADD CONSTRAINT "str_dynamic_pricing_rules_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "str_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_competitor_analysis" ADD CONSTRAINT "str_competitor_analysis_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "str_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_channel_metrics" ADD CONSTRAINT "str_channel_metrics_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "str_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_housekeeping_tasks" ADD CONSTRAINT "str_housekeeping_tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_housekeeping_tasks" ADD CONSTRAINT "str_housekeeping_tasks_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "str_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_housekeeping_tasks" ADD CONSTRAINT "str_housekeeping_tasks_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "str_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_housekeeping_tasks" ADD CONSTRAINT "str_housekeeping_tasks_asignadoA_fkey" FOREIGN KEY ("asignadoA") REFERENCES "str_housekeeping_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_housekeeping_staff" ADD CONSTRAINT "str_housekeeping_staff_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_housekeeping_inventory" ADD CONSTRAINT "str_housekeeping_inventory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_inventory_movements" ADD CONSTRAINT "str_inventory_movements_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "str_housekeeping_inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_housekeeping_checklists" ADD CONSTRAINT "str_housekeeping_checklists_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flipping_projects" ADD CONSTRAINT "flipping_projects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flipping_projects" ADD CONSTRAINT "flipping_projects_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flipping_projects" ADD CONSTRAINT "flipping_projects_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flipping_renovations" ADD CONSTRAINT "flipping_renovations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "flipping_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flipping_expenses" ADD CONSTRAINT "flipping_expenses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "flipping_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flipping_milestones" ADD CONSTRAINT "flipping_milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "flipping_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_projects" ADD CONSTRAINT "construction_projects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_projects" ADD CONSTRAINT "construction_projects_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_work_orders" ADD CONSTRAINT "construction_work_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "construction_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_inspections" ADD CONSTRAINT "construction_inspections_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "construction_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_suppliers" ADD CONSTRAINT "construction_suppliers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "construction_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_projects" ADD CONSTRAINT "professional_projects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_deliverables" ADD CONSTRAINT "professional_deliverables_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "professional_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_meetings" ADD CONSTRAINT "professional_meetings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "professional_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_contracts" ADD CONSTRAINT "room_contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_contracts" ADD CONSTRAINT "room_contracts_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_contracts" ADD CONSTRAINT "room_contracts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_payments" ADD CONSTRAINT "room_payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_payments" ADD CONSTRAINT "room_payments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "room_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_shared_spaces" ADD CONSTRAINT "room_shared_spaces_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_shared_spaces" ADD CONSTRAINT "room_shared_spaces_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_access" ADD CONSTRAINT "user_company_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_access" ADD CONSTRAINT "user_company_access_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_accounts" ADD CONSTRAINT "social_media_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "social_media_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_coupons" ADD CONSTRAINT "discount_coupons_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "discount_coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2BInvoice" ADD CONSTRAINT "B2BInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2BInvoice" ADD CONSTRAINT "B2BInvoice_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2BPaymentHistory" ADD CONSTRAINT "B2BPaymentHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2BSubscriptionHistory" ADD CONSTRAINT "B2BSubscriptionHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_asignadoA_fkey" FOREIGN KEY ("asignadoA") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_documents" ADD CONSTRAINT "lead_documents_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_documents" ADD CONSTRAINT "lead_documents_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankConsent" ADD CONSTRAINT "BankConsent_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "bank_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankPayment" ADD CONSTRAINT "BankPayment_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "bank_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvitation" ADD CONSTRAINT "TenantInvitation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvitation" ADD CONSTRAINT "TenantInvitation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvitation" ADD CONSTRAINT "TenantInvitation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRating" ADD CONSTRAINT "ServiceRating_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRating" ADD CONSTRAINT "ServiceRating_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantOnboarding" ADD CONSTRAINT "TenantOnboarding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_password_reset_tokens" ADD CONSTRAINT "provider_password_reset_tokens_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_invoices" ADD CONSTRAINT "provider_invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_invoices" ADD CONSTRAINT "provider_invoices_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_invoices" ADD CONSTRAINT "provider_invoices_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "provider_work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_invoice_payments" ADD CONSTRAINT "provider_invoice_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "provider_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_invoice_payments" ADD CONSTRAINT "provider_invoice_payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_quotes" ADD CONSTRAINT "provider_quotes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_quotes" ADD CONSTRAINT "provider_quotes_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_quotes" ADD CONSTRAINT "provider_quotes_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "provider_work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_reviews" ADD CONSTRAINT "provider_reviews_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_reviews" ADD CONSTRAINT "provider_reviews_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_reviews" ADD CONSTRAINT "provider_reviews_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "provider_work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_chat_conversations" ADD CONSTRAINT "provider_chat_conversations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_chat_conversations" ADD CONSTRAINT "provider_chat_conversations_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_chat_messages" ADD CONSTRAINT "provider_chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "provider_chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_chat_messages" ADD CONSTRAINT "provider_chat_messages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owners" ADD CONSTRAINT "owners_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_buildings" ADD CONSTRAINT "owner_buildings_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_buildings" ADD CONSTRAINT "owner_buildings_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_buildings" ADD CONSTRAINT "owner_buildings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_notifications" ADD CONSTRAINT "owner_notifications_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_notifications" ADD CONSTRAINT "owner_notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_alerts" ADD CONSTRAINT "owner_alerts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_alerts" ADD CONSTRAINT "owner_alerts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automations" ADD CONSTRAINT "automations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automations" ADD CONSTRAINT "automations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_executions" ADD CONSTRAINT "automation_executions_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_executions" ADD CONSTRAINT "automation_executions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rules" ADD CONSTRAINT "notification_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rules" ADD CONSTRAINT "notification_rules_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "notification_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_interactions" ADD CONSTRAINT "support_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_minutes" ADD CONSTRAINT "community_minutes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_minutes" ADD CONSTRAINT "community_minutes_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_fees" ADD CONSTRAINT "community_fees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_fees" ADD CONSTRAINT "community_fees_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_fees" ADD CONSTRAINT "community_fees_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_funds" ADD CONSTRAINT "community_funds_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_funds" ADD CONSTRAINT "community_funds_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_alerts" ADD CONSTRAINT "financial_alerts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_alerts" ADD CONSTRAINT "financial_alerts_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow_forecasts" ADD CONSTRAINT "cash_flow_forecasts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow_forecasts" ADD CONSTRAINT "cash_flow_forecasts_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_management" ADD CONSTRAINT "deposit_management_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_management" ADD CONSTRAINT "deposit_management_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bad_debt_provisions" ADD CONSTRAINT "bad_debt_provisions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bad_debt_provisions" ADD CONSTRAINT "bad_debt_provisions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habitability_certificates" ADD CONSTRAINT "habitability_certificates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habitability_certificates" ADD CONSTRAINT "habitability_certificates_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modelo_347_records" ADD CONSTRAINT "modelo_347_records_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modelo_180_records" ADD CONSTRAINT "modelo_180_records_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building_inspections" ADD CONSTRAINT "building_inspections_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building_inspections" ADD CONSTRAINT "building_inspections_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_management" ADD CONSTRAINT "community_management_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_management" ADD CONSTRAINT "community_management_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_invoices" ADD CONSTRAINT "community_invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_invoices" ADD CONSTRAINT "community_invoices_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "community_management"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_book_entries" ADD CONSTRAINT "cash_book_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_book_entries" ADD CONSTRAINT "cash_book_entries_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "community_management"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "community_management"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingProfile" ADD CONSTRAINT "ColivingProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingProfile" ADD CONSTRAINT "ColivingProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingMatch" ADD CONSTRAINT "ColivingMatch_profile1Id_fkey" FOREIGN KEY ("profile1Id") REFERENCES "ColivingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingMatch" ADD CONSTRAINT "ColivingMatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingGroup" ADD CONSTRAINT "ColivingGroup_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingGroup" ADD CONSTRAINT "ColivingGroup_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingGroupMember" ADD CONSTRAINT "ColivingGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ColivingGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingGroupMember" ADD CONSTRAINT "ColivingGroupMember_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ColivingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingActivityPost" ADD CONSTRAINT "ColivingActivityPost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingActivityPost" ADD CONSTRAINT "ColivingActivityPost_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingActivityPost" ADD CONSTRAINT "ColivingActivityPost_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ColivingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingEvent" ADD CONSTRAINT "ColivingEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingEvent" ADD CONSTRAINT "ColivingEvent_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingEvent" ADD CONSTRAINT "ColivingEvent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ColivingGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingEventAttendance" ADD CONSTRAINT "ColivingEventAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ColivingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingEventAttendance" ADD CONSTRAINT "ColivingEventAttendance_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ColivingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingService" ADD CONSTRAINT "ColivingService_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingServiceBooking" ADD CONSTRAINT "ColivingServiceBooking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ColivingService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingServiceBooking" ADD CONSTRAINT "ColivingServiceBooking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingServiceBooking" ADD CONSTRAINT "ColivingServiceBooking_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingCheckInOut" ADD CONSTRAINT "ColivingCheckInOut_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingCheckInOut" ADD CONSTRAINT "ColivingCheckInOut_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingCheckInOut" ADD CONSTRAINT "ColivingCheckInOut_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingCheckInOut" ADD CONSTRAINT "ColivingCheckInOut_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartLock" ADD CONSTRAINT "SmartLock_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartLock" ADD CONSTRAINT "SmartLock_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartLock" ADD CONSTRAINT "SmartLock_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartLock" ADD CONSTRAINT "SmartLock_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartLockAccess" ADD CONSTRAINT "SmartLockAccess_lockId_fkey" FOREIGN KEY ("lockId") REFERENCES "SmartLock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartLockAccess" ADD CONSTRAINT "SmartLockAccess_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingPackage" ADD CONSTRAINT "ColivingPackage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingPackage" ADD CONSTRAINT "ColivingPackage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColivingPackage" ADD CONSTRAINT "ColivingPackage_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerClient" ADD CONSTRAINT "PartnerClient_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerClient" ADD CONSTRAINT "PartnerClient_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerInvitation" ADD CONSTRAINT "PartnerInvitation_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRepresentative" ADD CONSTRAINT "SalesRepresentative_parentSalesRepId_fkey" FOREIGN KEY ("parentSalesRepId") REFERENCES "SalesRepresentative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLead" ADD CONSTRAINT "SalesLead_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRepresentative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLead" ADD CONSTRAINT "SalesLead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRepresentative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "SalesLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTarget" ADD CONSTRAINT "SalesTarget_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRepresentative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDownload" ADD CONSTRAINT "MaterialDownload_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRepresentative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDownload" ADD CONSTRAINT "MaterialDownload_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MarketingMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerCertificationAwarded" ADD CONSTRAINT "PartnerCertificationAwarded_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRepresentative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerCertificationAwarded" ADD CONSTRAINT "PartnerCertificationAwarded_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "PartnerCertification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coliving_analytics" ADD CONSTRAINT "coliving_analytics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nps_surveys" ADD CONSTRAINT "nps_surveys_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nps_surveys" ADD CONSTRAINT "nps_surveys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_profiles" ADD CONSTRAINT "tenant_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_waitlist" ADD CONSTRAINT "space_waitlist_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_waitlist" ADD CONSTRAINT "space_waitlist_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "common_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_waitlist" ADD CONSTRAINT "space_waitlist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_credits" ADD CONSTRAINT "reservation_credits_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_ratings" ADD CONSTRAINT "space_ratings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_ratings" ADD CONSTRAINT "space_ratings_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "common_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_ratings" ADD CONSTRAINT "space_ratings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_ratings" ADD CONSTRAINT "space_ratings_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "space_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_maintenance_predictions" ADD CONSTRAINT "space_maintenance_predictions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_maintenance_predictions" ADD CONSTRAINT "space_maintenance_predictions_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "common_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_comments" ADD CONSTRAINT "event_comments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_confirmations" ADD CONSTRAINT "announcement_confirmations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_engagement_metrics" ADD CONSTRAINT "community_engagement_metrics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

┌─────────────────────────────────────────────────────────┐
│  Update available 6.7.0 -> 7.1.0                        │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
Done in 0.80s.
