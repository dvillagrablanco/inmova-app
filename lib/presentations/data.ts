import { Presentation } from "@/components/presentation/PresentationViewer";

export const PRESENTATIONS: Record<string, Presentation> = {
  "inversores": {
    id: "inversores",
    title: "Pitch Deck Inversores",
    description: "Presentación para rondas de inversión Seed/Series A.",
    slides: [
      {
        id: "1",
        type: "title",
        title: "INMOVA",
        subtitle: "The Real Estate Operating System",
        content: ["La primera plataforma que unifica todo el ciclo de vida del activo inmobiliario."]
      },
      {
        id: "2",
        type: "split",
        title: "El Problema: Fragmentación",
        subtitle: "El Mercado Inmobiliario se ha Fragmentado",
        content: [
          "Los gestores usan 4 softwares diferentes (PMS, Channel Manager, Excel, ERP).",
          "Datos desconectados y duplicados.",
          "Costes operativos disparados por ineficiencia.",
          "Gestionan: Alquiler tradicional, Airbnb (STR) y Reformas (Flipping)."
        ],
        image: "/images/fragmentation-problem.png" // Placeholder
      },
      {
        id: "3",
        type: "section",
        title: "La Solución: INMOVA",
        subtitle: "La SuperApp Multi-Vertical"
      },
      {
        id: "4",
        type: "content",
        title: "Una sola plataforma para todo",
        content: [
          "1. Multi-Vertical: Residencial + Vacacional + Comercial + Co-Living + Build-to-Rent.",
          "2. Dato Único: Un solo dashboard financiero para toda la cartera.",
          "3. IA Nativa: Revenue Management y Risk Scoring integrados en el core."
        ]
      },
      {
        id: "5",
        type: "quote",
        quote: "Dejamos de vender software para vender eficiencia operativa.",
        author: "Visión INMOVA"
      },
      {
        id: "6",
        type: "split",
        title: "Tracción y Métricas",
        content: [
          "✅ 88+ Módulos operativos.",
          "✅ 7 Verticales activas.",
          "✅ Integraciones: Bancos, Hacienda, Smart Locks.",
          "✅ Pipeline: 500+ Leads cualificados."
        ]
      },
      {
        id: "7",
        type: "content",
        title: "Modelo de Negocio",
        subtitle: "SaaS B2B + FinTech",
        content: [
          "Suscripción Recurrente (SaaS): Tier Pro (299€/mes) y Enterprise.",
          "Take-Rate (FinTech): % sobre pagos procesados y servicios.",
          "Unit Economics: LTV/CAC > 5x, Churn < 2%."
        ]
      },
      {
        id: "8",
        type: "content",
        title: "Mercado (TAM)",
        content: [
          "TAM España: 18.575M€ (Mercado total de gestión).",
          "Oportunidad: Gestores con carteras mixtas (>20 unidades).",
          "Escalabilidad: Arquitectura lista para LATAM y EU."
        ]
      },
      {
        id: "9",
        type: "content",
        title: "Roadmap 2025",
        content: [
          "Q1: IA Revenue Management & App Propietarios V2.",
          "Q2: Módulo Build-to-Rent completo.",
          "Q3: Expansión Comercial Nacional.",
          "Q4: Preparación Internacionalización."
        ]
      },
      {
        id: "10",
        type: "section",
        title: "La Inversión",
        subtitle: "Buscamos Partners Estratégicos"
      },
      {
        id: "11",
        type: "title",
        title: "INMOVA",
        subtitle: "inversores@inmova.app | www.inmova.app"
      }
    ]
  },
  "partners": {
    id: "partners",
    title: "Presentación Partners",
    description: "Para integradores, proveedores de servicios y ecosistema.",
    slides: [
      {
        id: "1",
        type: "title",
        title: "Únete al Ecosistema INMOVA",
        subtitle: "Conecta tu servicio con los mejores gestores inmobiliarios."
      },
      {
        id: "2",
        type: "content",
        title: "El Hub Central del Property Management",
        content: [
          "INMOVA es donde los gestores operan día a día.",
          "Gestionamos propiedades, inquilinos y flujos financieros.",
          "Necesitamos gestionar los SERVICIOS externos."
        ]
      },
      {
        id: "3",
        type: "split",
        title: "La Oportunidad",
        content: [
          "Acceso directo a miles de unidades gestionadas.",
          "Necesidades recurrentes: Limpiezas, Mantenimiento, Seguros.",
          "Solución: Marketplace integrado directamente en el workflow."
        ]
      },
      {
        id: "4",
        type: "content",
        title: "Tipos de Partnership",
        content: [
          "1. Integradores Tecnológicos (API): Software contable, IoT.",
          "2. Proveedores de Servicios (Marketplace): Reformas, limpieza.",
          "3. Canal de Distribución (Resellers): Consultoras, Asesorías."
        ]
      },
      {
        id: "5",
        type: "content",
        title: "Tecnología de Integración",
        content: [
          "Developer First: API RESTful documentada (Swagger).",
          "Webhooks en tiempo real.",
          "SSO (Single Sign On)."
        ]
      },
      {
        id: "6",
        type: "quote",
        quote: "Tu tecnología, embebida en el flujo de trabajo diario de nuestros clientes.",
        author: "Filosofía de Integración"
      },
      {
        id: "7",
        type: "title",
        title: "Intégrate Hoy",
        subtitle: "partners@inmova.app | developer.inmova.app"
      }
    ]
  },
  "verticales": {
    id: "verticales",
    title: "Presentación Verticales de Negocio",
    description: "Para clientes potenciales (Property Managers) de distintos sectores.",
    slides: [
      {
        id: "1",
        type: "title",
        title: "INMOVA",
        subtitle: "Potencia tu Cartera Inmobiliaria"
      },
      {
        id: "2",
        type: "content",
        title: "El Desafío Común",
        content: [
          "1. Falta de tiempo.",
          "2. Información dispersa.",
          "3. Rentabilidad estancada.",
          "4. Miedo a la morosidad/vacancia."
        ]
      },
      {
        id: "3",
        type: "section",
        title: "Residencial",
        subtitle: "Gestión de Alquiler 360º"
      },
      {
        id: "4",
        type: "content",
        title: "Residencial: Claves",
        content: [
          "Cobro Automático: Domiciliación SEPA y conciliación.",
          "Gestión de Incidencias: App para inquilinos e industriales.",
          "Scoring de Inquilinos: Análisis de riesgo financiero con IA.",
          "Portal Propietario V2: Transparencia total en tiempo real."
        ]
      },
      {
        id: "5",
        type: "section",
        title: "Vacacional (STR)",
        subtitle: "Airbnb & Booking Automatizado"
      },
      {
        id: "6",
        type: "content",
        title: "STR: Revenue Management IA",
        content: [
          "Análisis de demanda y competencia en tiempo real.",
          "Actualización de precios automática.",
          "Resultado: +30% de ingresos medios.",
          "Operativa Manos Libres: Check-in digital y llaves inteligentes."
        ]
      },
      {
        id: "7",
        type: "section",
        title: "Terciario & Oficinas",
        subtitle: "Gestión Profesional de Activos"
      },
      {
        id: "8",
        type: "content",
        title: "Terciario: Funcionalidades",
        content: [
          "Contratos complejos: Rentas variables (% ventas).",
          "Escalados de IPC/IPRI automáticos.",
          "Facility Management: Mantenimiento y cumplimiento normativo."
        ]
      },
      {
        id: "9",
        type: "title",
        title: "¿Hablamos?",
        subtitle: "Solicita tu Auditoría Gratuita"
      }
    ]
  },
  "comercial": {
    id: "comercial",
    title: "Red Comercial Externa",
    description: "Argumentario de ventas y plan de comisiones.",
    slides: [
      {
        id: "1",
        type: "title",
        title: "Vende INMOVA",
        subtitle: "El Software que se Vende Solo"
      },
      {
        id: "2",
        type: "content",
        title: "Tu Oportunidad",
        content: [
          "Ticket Alto: Vendes valor, no precio.",
          "Retención Alta: Churn <2%. Ingresos recurrentes.",
          "Producto Único: Sin competencia real en Multi-Vertical."
        ]
      },
      {
        id: "3",
        type: "quote",
        quote: "INMOVA es la única plataforma que unifica todo tu negocio inmobiliario en un solo lugar.",
        author: "Elevator Pitch"
      },
      {
        id: "4",
        type: "split",
        title: "Perfiles de Cliente",
        content: [
          "El Mini-Magnate: Tiene de todo. Quiere orden.",
          "El Gestor STR: Quiere ganar más (Revenue Mgmt).",
          "La Inmobiliaria Tradicional: Quiere diferenciarse con tecnología."
        ]
      },
      {
        id: "5",
        type: "content",
        title: "Manejo de Objeciones",
        content: [
          "Es caro -> Es un Ferrari, no un Twingo. Se paga solo.",
          "Ya tengo ERP -> Nos integramos, no lo sustituimos.",
          "Pereza al cambio -> Migración gratuita en 48h."
        ]
      },
      {
        id: "6",
        type: "content",
        title: "Comisiones (Lifetime)",
        content: [
          "Hunter (Cierre): 20% del primer año.",
          "Farmer (Cartera): 10% recurrente de por vida.",
          "Bonus: 1.000€ extra por superar 10k€ ARR/trimestre."
        ]
      },
      {
        id: "7",
        type: "title",
        title: "¡A Vender!",
        subtitle: "Go INMOVA Team"
      }
    ]
  },
  "formacion": {
    id: "formacion",
    title: "Formación Interna (Onboarding)",
    description: "Plan de formación para nuevos empleados.",
    slides: [
      {
        id: "1",
        type: "title",
        title: "Bienvenidos a INMOVA",
        subtitle: "Onboarding Program 2025"
      },
      {
        id: "2",
        type: "content",
        title: "Semana 1: The Basics",
        content: [
          "Cultura y Visión: Democratizar la tecnología.",
          "Inmersión en Producto: Crea tu propia inmobiliaria ficticia.",
          "Objetivo: Entender el dolor del cliente."
        ]
      },
      {
        id: "3",
        type: "content",
        title: "Módulo 1: Arquitectura",
        content: [
          "Roles: SuperAdmin, Company Admin, Inquilino.",
          "Concepto Vertical: Activación modular.",
          "Para técnicos y no técnicos."
        ]
      },
      {
        id: "4",
        type: "split",
        title: "Módulo 2: Verticales Deep Dive",
        content: [
          "Residencial: Ciclo SEPA, Seguros.",
          "STR: ADR, RevPAR, Channel Manager.",
          "B2B: Facturación y Grandes Cuentas."
        ]
      },
      {
        id: "5",
        type: "content",
        title: "Módulo 3: Soporte",
        content: [
          "Herramientas Admin (God Mode).",
          "Diagnóstico: Bug vs Feature.",
          "Simulacros de incidencias reales."
        ]
      },
      {
        id: "6",
        type: "title",
        title: "Evaluación Final",
        subtitle: "Demo Inversa y Certificación"
      }
    ]
  }
};
