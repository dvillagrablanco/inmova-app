#!/usr/bin/env python3
"""
Generador de PDF de Presentación de Funcionalidades - INMOVA APP
Para presentaciones a partners (Multifamily Office)
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, ListFlowable, ListItem
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, Circle
from datetime import datetime
import os

# Colores de la marca
INMOVA_BLUE = colors.HexColor('#2563EB')
INMOVA_PURPLE = colors.HexColor('#7C3AED')
INMOVA_GREEN = colors.HexColor('#10B981')
INMOVA_ORANGE = colors.HexColor('#F59E0B')
INMOVA_DARK = colors.HexColor('#1F2937')
INMOVA_GRAY = colors.HexColor('#6B7280')
INMOVA_LIGHT = colors.HexColor('#F3F4F6')

class InmovaPDF:
    def __init__(self, filename):
        self.filename = filename
        self.doc = SimpleDocTemplate(
            filename,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        self.styles = getSampleStyleSheet()
        self._create_custom_styles()
        self.story = []
        
    def _create_custom_styles(self):
        """Crear estilos personalizados"""
        # Título principal
        self.styles.add(ParagraphStyle(
            name='MainTitle',
            parent=self.styles['Heading1'],
            fontSize=28,
            textColor=INMOVA_DARK,
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Subtítulo
        self.styles.add(ParagraphStyle(
            name='Subtitle',
            parent=self.styles['Normal'],
            fontSize=14,
            textColor=INMOVA_GRAY,
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica'
        ))
        
        # Encabezado de sección
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading1'],
            fontSize=20,
            textColor=INMOVA_BLUE,
            spaceBefore=20,
            spaceAfter=15,
            fontName='Helvetica-Bold'
        ))
        
        # Subsección
        self.styles.add(ParagraphStyle(
            name='SubSection',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=INMOVA_PURPLE,
            spaceBefore=15,
            spaceAfter=10,
            fontName='Helvetica-Bold'
        ))
        
        # Texto normal personalizado
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=INMOVA_DARK,
            spaceAfter=10,
            alignment=TA_JUSTIFY,
            fontName='Helvetica'
        ))
        
        # Bullet point
        self.styles.add(ParagraphStyle(
            name='BulletText',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=INMOVA_DARK,
            leftIndent=20,
            spaceAfter=5,
            fontName='Helvetica'
        ))
        
        # Feature destacada
        self.styles.add(ParagraphStyle(
            name='FeatureTitle',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=INMOVA_BLUE,
            spaceBefore=10,
            spaceAfter=5,
            fontName='Helvetica-Bold'
        ))
        
        # Precio
        self.styles.add(ParagraphStyle(
            name='PriceText',
            parent=self.styles['Normal'],
            fontSize=18,
            textColor=INMOVA_GREEN,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))

    def add_cover_page(self):
        """Página de portada"""
        # Espaciado superior
        self.story.append(Spacer(1, 3*cm))
        
        # Logo/Título principal
        self.story.append(Paragraph(
            "🏠 INMOVA APP",
            self.styles['MainTitle']
        ))
        
        self.story.append(Spacer(1, 0.5*cm))
        
        self.story.append(Paragraph(
            "Plataforma PropTech Integral",
            ParagraphStyle(
                'CoverSubtitle',
                parent=self.styles['Normal'],
                fontSize=18,
                textColor=INMOVA_PURPLE,
                alignment=TA_CENTER,
                fontName='Helvetica-Bold'
            )
        ))
        
        self.story.append(Spacer(1, 1*cm))
        
        self.story.append(Paragraph(
            "Presentación de Funcionalidades para Partners",
            self.styles['Subtitle']
        ))
        
        # Línea decorativa
        self.story.append(Spacer(1, 1*cm))
        
        # Descripción breve
        cover_desc = """
        <b>La plataforma más completa para gestión inmobiliaria</b><br/><br/>
        • 7 Verticales de Negocio especializadas<br/>
        • +15 Módulos Transversales incluidos<br/>
        • Inteligencia Artificial integrada<br/>
        • Firma Digital y Compliance legal<br/>
        • API REST completa para integraciones<br/>
        • Multi-empresa y White Label disponible
        """
        self.story.append(Paragraph(cover_desc, ParagraphStyle(
            'CoverDesc',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=INMOVA_DARK,
            alignment=TA_CENTER,
            spaceAfter=30,
            leading=18
        )))
        
        self.story.append(Spacer(1, 2*cm))
        
        # Información de contacto
        contact_info = f"""
        <b>Fecha:</b> {datetime.now().strftime('%d de %B de %Y')}<br/>
        <b>Web:</b> inmovaapp.com<br/>
        <b>Email:</b> partners@inmova.app
        """
        self.story.append(Paragraph(contact_info, ParagraphStyle(
            'ContactInfo',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=INMOVA_GRAY,
            alignment=TA_CENTER,
            leading=16
        )))
        
        self.story.append(PageBreak())

    def add_executive_summary(self):
        """Resumen ejecutivo"""
        self.story.append(Paragraph("📊 Resumen Ejecutivo", self.styles['SectionHeader']))
        
        summary_text = """
        <b>Inmova App</b> es una plataforma PropTech B2B/B2C híbrida diseñada para cubrir 
        todo el ciclo de vida de la gestión inmobiliaria. Desde pequeños propietarios hasta 
        grandes fondos de inversión y SOCIMIs, nuestra tecnología se adapta a cualquier escala.
        """
        self.story.append(Paragraph(summary_text, self.styles['CustomBody']))
        
        # Métricas clave
        self.story.append(Paragraph("🎯 Métricas Clave", self.styles['SubSection']))
        
        metrics_data = [
            ['Métrica', 'Valor'],
            ['Verticales de Negocio', '7 especializadas'],
            ['Módulos Incluidos', '+15 transversales'],
            ['Integraciones', '+20 plataformas'],
            ['Tiempo de Setup', '< 10 minutos'],
            ['Uptime Garantizado', '99.9%'],
            ['Soporte', '24/7 en planes Business+'],
        ]
        
        metrics_table = Table(metrics_data, colWidths=[8*cm, 7*cm])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), INMOVA_BLUE),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BACKGROUND', (0, 1), (-1, -1), INMOVA_LIGHT),
            ('TEXTCOLOR', (0, 1), (-1, -1), INMOVA_DARK),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.white),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        self.story.append(metrics_table)
        
        self.story.append(Spacer(1, 1*cm))
        
        # Propuesta de valor
        self.story.append(Paragraph("💡 Propuesta de Valor para Multifamily Office", self.styles['SubSection']))
        
        value_props = [
            "<b>Control Total:</b> Dashboard unificado para toda la cartera con métricas en tiempo real",
            "<b>Eficiencia Operativa:</b> Automatización de cobros, contratos y comunicaciones",
            "<b>Business Intelligence:</b> Reportes avanzados y analytics con IA para toma de decisiones",
            "<b>Compliance:</b> Cumplimiento GDPR, LAU y normativas inmobiliarias españolas",
            "<b>Escalabilidad:</b> Crece desde 10 hasta 10.000+ propiedades sin cambiar de sistema",
            "<b>API First:</b> Integración con ERPs, contabilidad y sistemas existentes",
        ]
        
        for prop in value_props:
            self.story.append(Paragraph(f"✓ {prop}", self.styles['BulletText']))
        
        self.story.append(PageBreak())

    def add_verticals(self):
        """Verticales de negocio"""
        self.story.append(Paragraph("🏗️ 7 Verticales de Negocio", self.styles['SectionHeader']))
        
        intro = """
        Inmova cubre todas las modalidades de negocio inmobiliario con módulos especializados 
        para cada vertical. Cada empresa puede activar solo las verticales que necesita.
        """
        self.story.append(Paragraph(intro, self.styles['CustomBody']))
        
        verticals = [
            {
                'icon': '🏘️',
                'name': 'Alquiler Residencial',
                'desc': 'Tradicional (12+ meses) + Media Estancia (1-11 meses)',
                'features': ['Contratos LAU automatizados', 'Scoring IA de inquilinos', 'Check-in digital', 'Portal de inquilino'],
                'badge': 'CORE'
            },
            {
                'icon': '🏨',
                'name': 'STR (Vacacional)',
                'desc': 'Alquileres vacacionales y corta estancia',
                'features': ['Channel Manager (Airbnb, Booking)', 'Gestión de Reviews', 'Auto check-in con smart locks', 'Pricing dinámico con IA'],
                'badge': 'PREMIUM'
            },
            {
                'icon': '🏠',
                'name': 'Coliving / Habitaciones',
                'desc': 'Gestión por habitación con espacios compartidos',
                'features': ['Prorrateo automático de suministros', 'Matching IA de perfiles', 'Reglas de convivencia', 'Eventos de comunidad'],
                'badge': 'TRENDING'
            },
            {
                'icon': '📈',
                'name': 'House Flipping',
                'desc': 'Compra-reforma-venta con control de ROI',
                'features': ['Calculadora ROI/TIR', 'Timeline de proyecto', 'Control de presupuestos', 'Gestión de reformas'],
                'badge': 'NUEVO'
            },
            {
                'icon': '🔨',
                'name': 'Construcción B2B (eWoorker)',
                'desc': 'Subcontratación segura en obras',
                'features': ['Cumplimiento Ley 32/2006', 'Escrow de pagos', 'Marketplace de proveedores', 'Gamificación'],
                'badge': 'B2B'
            },
            {
                'icon': '🏢',
                'name': 'Comunidades / Fincas',
                'desc': 'Administración de comunidades de propietarios',
                'features': ['Juntas y votaciones online', 'Cuotas y derramas', 'Gestión de incidencias', 'Portal de vecinos'],
                'badge': 'NUEVO'
            },
            {
                'icon': '💼',
                'name': 'Servicios Profesionales',
                'desc': 'Property management B2B',
                'features': ['CRM inmobiliario', 'Facturación automatizada', 'Multi-cartera', 'White-label disponible'],
                'badge': 'B2B'
            },
        ]
        
        for v in verticals:
            self.story.append(Paragraph(
                f"{v['icon']} <b>{v['name']}</b> [{v['badge']}]",
                self.styles['FeatureTitle']
            ))
            self.story.append(Paragraph(v['desc'], self.styles['CustomBody']))
            for feat in v['features']:
                self.story.append(Paragraph(f"    • {feat}", self.styles['BulletText']))
            self.story.append(Spacer(1, 0.3*cm))
        
        self.story.append(PageBreak())

    def add_modules(self):
        """Módulos transversales"""
        self.story.append(Paragraph("⚡ +15 Módulos Transversales", self.styles['SectionHeader']))
        
        intro = """
        Funcionalidades disponibles en todas las verticales que potencian la gestión diaria:
        """
        self.story.append(Paragraph(intro, self.styles['CustomBody']))
        
        modules = [
            ('📄 Contratos Digitales', 'Genera contratos LAU automáticamente con plantillas legales actualizadas. Incluye firma digital integrada y gestión de renovaciones.'),
            ('🔐 Gestión de Documentos', 'Almacenamiento seguro en la nube. Alertas de vencimiento para DNIs, seguros y certificados. Exportación en múltiples formatos.'),
            ('💰 Cobros y Pagos', 'Automatización completa de cobros. Integración con Stripe y transferencias SEPA. Recibos automáticos y alertas de morosidad.'),
            ('📸 Galería de Propiedades', 'Fotos ilimitadas por propiedad. Organización por carpetas. Compartir enlaces públicos o privados.'),
            ('💬 Comunicación Integrada', 'Chat directo con inquilinos y propietarios. Emails automatizados. Historial completo de comunicaciones.'),
            ('🔗 Integraciones', 'Conexión con portales (Idealista, Fotocasa), calendarios (Google, Outlook), contabilidad (Contasimple, Holded).'),
            ('📊 Analytics e IA', 'Dashboard de métricas en tiempo real. Predicciones con machine learning. Alertas proactivas.'),
            ('✍️ Firma Digital', 'Integración con Signaturit y DocuSign. Cumplimiento eIDAS para validez legal europea.'),
            ('🔧 Mantenimiento', 'Gestión de incidencias con clasificación IA. Coordinación con proveedores. Historial de reparaciones.'),
            ('📅 Calendario', 'Visitas, vencimientos, pagos en vista unificada. Sincronización con Google Calendar y Outlook.'),
            ('👥 CRM Inmobiliario', 'Gestión de leads y pipeline de ventas. Seguimiento de actividades. Integración con marketing.'),
            ('🧾 Facturación', 'Generación automática de facturas. Integración con sistemas contables. Cumplimiento fiscal español.'),
        ]
        
        for name, desc in modules:
            self.story.append(Paragraph(f"<b>{name}</b>", self.styles['FeatureTitle']))
            self.story.append(Paragraph(desc, self.styles['BulletText']))
        
        self.story.append(PageBreak())

    def add_ai_features(self):
        """Funcionalidades de IA"""
        self.story.append(Paragraph("🤖 Inteligencia Artificial Integrada", self.styles['SectionHeader']))
        
        intro = """
        Inmova incorpora IA de última generación (Claude, GPT-4) para automatizar tareas 
        y proporcionar insights accionables:
        """
        self.story.append(Paragraph(intro, self.styles['CustomBody']))
        
        ai_features = [
            {
                'name': '💎 Valoración Automática de Propiedades',
                'desc': 'Estimación de valor de mercado basada en comparables, ubicación y características. Incluye rango de confianza y justificación detallada.',
                'benefit': 'Ahorro: 50€-200€ por tasación externa'
            },
            {
                'name': '👤 Scoring de Inquilinos',
                'desc': 'Análisis de riesgo crediticio y solvencia. Verificación de documentación. Predicción de morosidad.',
                'benefit': 'Reducción: -40% impagos'
            },
            {
                'name': '🎯 Matching Inquilino-Propiedad',
                'desc': 'Algoritmo que encuentra el inquilino ideal para cada propiedad basado en preferencias, presupuesto y perfil.',
                'benefit': 'Velocidad: -60% tiempo de alquiler'
            },
            {
                'name': '💬 Asistente Virtual 24/7',
                'desc': 'Chatbot con IA que responde consultas de inquilinos, programa visitas y gestiona incidencias básicas.',
                'benefit': 'Ahorro: -30% llamadas a soporte'
            },
            {
                'name': '📈 Pricing Dinámico',
                'desc': 'Optimización automática de precios para STR basada en demanda, temporada, eventos y competencia.',
                'benefit': 'Incremento: +15-25% ingresos'
            },
            {
                'name': '🔧 Clasificación de Incidencias',
                'desc': 'IA que categoriza automáticamente incidencias, sugiere proveedores y estima costes de reparación.',
                'benefit': 'Velocidad: -50% tiempo de resolución'
            },
            {
                'name': '📄 Generación de Contratos',
                'desc': 'Creación automática de contratos personalizados según tipo de alquiler, cumpliendo normativa LAU vigente.',
                'benefit': 'Ahorro: -80% tiempo administrativo'
            },
            {
                'name': '📊 Predicción de Flujo de Caja',
                'desc': 'Proyecciones financieras basadas en histórico, tendencias y alertas de posibles impagos.',
                'benefit': 'Visibilidad: +3 meses anticipación'
            },
        ]
        
        for feat in ai_features:
            self.story.append(Paragraph(f"<b>{feat['name']}</b>", self.styles['FeatureTitle']))
            self.story.append(Paragraph(feat['desc'], self.styles['BulletText']))
            self.story.append(Paragraph(
                f"<i>📌 {feat['benefit']}</i>",
                ParagraphStyle('Benefit', parent=self.styles['BulletText'], textColor=INMOVA_GREEN)
            ))
            self.story.append(Spacer(1, 0.2*cm))
        
        self.story.append(PageBreak())

    def add_integrations(self):
        """Integraciones"""
        self.story.append(Paragraph("🔗 Integraciones Disponibles", self.styles['SectionHeader']))
        
        integrations = [
            ('💳 Pagos', [
                'Stripe - Pagos con tarjeta y SEPA',
                'Transferencias bancarias - Seguimiento automático',
                'Recibos - Generación automática PDF',
            ]),
            ('🌐 Publicación', [
                'Idealista, Fotocasa, Habitaclia - Sincronización automática',
                'API de portales - Publicación masiva',
                'Web propia - Widgets embebibles',
            ]),
            ('📧 Comunicación', [
                'Email (SMTP, Gmail, SendGrid)',
                'SMS (Twilio) - Recordatorios automáticos',
                'WhatsApp Business - Notificaciones',
            ]),
            ('📝 Documentos', [
                'Signaturit / DocuSign - Firma digital legal',
                'AWS S3 - Almacenamiento seguro',
                'OCR - Extracción de datos de documentos',
            ]),
            ('📊 Contabilidad', [
                'Contasimple - Sincronización de gastos',
                'Holded - Integración contable',
                'Alegra - Facturación',
            ]),
            ('🏨 Channel Managers (STR)', [
                'Airbnb - Reservas y calendario',
                'Booking.com - Sincronización',
                'Vrbo - Gestión de listings',
                'iCal - Calendario unificado',
            ]),
            ('🔐 Seguridad', [
                'Encriptación AES-256 en reposo',
                'TLS 1.3 en tránsito',
                'GDPR compliant',
                'Backups automáticos diarios',
            ]),
        ]
        
        for category, items in integrations:
            self.story.append(Paragraph(f"<b>{category}</b>", self.styles['FeatureTitle']))
            for item in items:
                self.story.append(Paragraph(f"    ✓ {item}", self.styles['BulletText']))
            self.story.append(Spacer(1, 0.3*cm))
        
        self.story.append(PageBreak())

    def add_pricing(self):
        """Planes y precios"""
        self.story.append(Paragraph("💰 Planes y Precios", self.styles['SectionHeader']))
        
        intro = """
        Planes flexibles adaptados a cada tamaño de negocio. Todos incluyen soporte, 
        actualizaciones y sin costes ocultos. Descuento del 20% en pago anual.
        """
        self.story.append(Paragraph(intro, self.styles['CustomBody']))
        
        # Tabla de precios
        pricing_data = [
            ['Plan', 'Precio/mes', 'Propiedades', 'Usuarios', 'Características Clave'],
            ['Starter', '19€', '5', '2', 'Portal inquilino, Documentos, Calendario'],
            ['Básico', '39€', '15', '3', '+ Firma digital, Gastos, Reportes básicos'],
            ['Profesional ⭐', '79€', '50', '10', '+ Analytics, CRM, API, Soporte prioritario'],
            ['Business', '149€', '200', '25', '+ Multi-empresa, IA, Automatizaciones'],
            ['Enterprise', 'Contactar', 'Ilimitado', 'Ilimitado', '+ White-label, SLA, SSO, Dedicado'],
        ]
        
        pricing_table = Table(pricing_data, colWidths=[2.5*cm, 2.5*cm, 2.5*cm, 2*cm, 7*cm])
        pricing_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), INMOVA_BLUE),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#EDE9FE')),  # Profesional destacado
            ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 1), (-1, 2), INMOVA_LIGHT),
            ('BACKGROUND', (0, 4), (-1, 5), INMOVA_LIGHT),
            ('TEXTCOLOR', (0, 1), (-1, -1), INMOVA_DARK),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (-1, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.white),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        self.story.append(pricing_table)
        
        self.story.append(Spacer(1, 1*cm))
        
        # Recomendación para Multifamily Office
        self.story.append(Paragraph("📌 Recomendación para Multifamily Office", self.styles['SubSection']))
        
        recommendation = """
        Para un <b>Multifamily Office</b> con cartera diversificada, recomendamos el plan 
        <b>Business</b> o <b>Enterprise</b> por las siguientes razones:
        """
        self.story.append(Paragraph(recommendation, self.styles['CustomBody']))
        
        reasons = [
            "<b>Multi-empresa:</b> Gestión separada de cada vehículo de inversión con reporting consolidado",
            "<b>Business Intelligence:</b> Dashboards personalizados para comités de inversión",
            "<b>API completa:</b> Integración con sistemas de gestión patrimonial existentes",
            "<b>Usuarios ilimitados:</b> Acceso para gestores, analistas y stakeholders",
            "<b>Audit Log:</b> Trazabilidad completa para compliance y due diligence",
            "<b>SLA garantizado:</b> Disponibilidad 99.9% con soporte dedicado",
        ]
        
        for reason in reasons:
            self.story.append(Paragraph(f"✓ {reason}", self.styles['BulletText']))
        
        self.story.append(PageBreak())

    def add_client_profiles(self):
        """Perfiles de cliente"""
        self.story.append(Paragraph("👥 Perfiles de Cliente Soportados", self.styles['SectionHeader']))
        
        intro = """
        Inmova se adapta a diferentes tipos de clientes con configuraciones específicas:
        """
        self.story.append(Paragraph(intro, self.styles['CustomBody']))
        
        profiles = [
            ('🏠 Propietario Individual', '1-5 propiedades', 'Starter/Básico', 
             'Gestión simple, recordatorios, documentos organizados'),
            ('📈 Pequeño Inversor', '5-20 propiedades', 'Profesional', 
             'Control financiero, reportes de rentabilidad, multi-propiedad'),
            ('💼 Gestor Profesional', '20-100 propiedades', 'Business', 
             'Multi-cliente, facturación, portal propietario, API'),
            ('🏢 Agencia Inmobiliaria', '10-200 propiedades', 'Profesional/Business', 
             'CRM, publicación en portales, comisiones'),
            ('📋 Administrador de Fincas', '5-100 comunidades', 'Profesional/Business', 
             'Juntas, votaciones, contabilidad de comunidad'),
            ('🏗️ Promotor Inmobiliario', '1-50 proyectos', 'Business/Enterprise', 
             'Gestión de obra, costes, entregas, post-venta'),
            ('🛋️ Empresa de Coliving', '1-30 edificios', 'Profesional/Business', 
             'Gestión por habitación, matching, eventos'),
            ('🏨 Empresa STR', '3-100 propiedades', 'Profesional/Business', 
             'Channel manager, pricing dinámico, housekeeping'),
            ('💎 Fondo de Inversión / SOCIMI', '100+ propiedades', 'Enterprise', 
             'BI, multi-gestor, compliance, API enterprise, SLA'),
        ]
        
        for profile, size, plan, features in profiles:
            self.story.append(Paragraph(f"<b>{profile}</b>", self.styles['FeatureTitle']))
            self.story.append(Paragraph(f"    Cartera típica: {size}", self.styles['BulletText']))
            self.story.append(Paragraph(f"    Plan recomendado: {plan}", self.styles['BulletText']))
            self.story.append(Paragraph(f"    Necesidades: {features}", self.styles['BulletText']))
            self.story.append(Spacer(1, 0.2*cm))
        
        self.story.append(PageBreak())

    def add_portals(self):
        """Portales de acceso"""
        self.story.append(Paragraph("🌐 Portales de Acceso", self.styles['SectionHeader']))
        
        intro = """
        Inmova ofrece portales específicos para cada tipo de usuario con funcionalidades adaptadas:
        """
        self.story.append(Paragraph(intro, self.styles['CustomBody']))
        
        portals = [
            {
                'name': '📊 Dashboard de Administrador',
                'desc': 'Panel de control completo para gestores y propietarios',
                'features': [
                    'Vista consolidada de toda la cartera',
                    'Métricas en tiempo real (ocupación, ingresos, morosidad)',
                    'Alertas proactivas de vencimientos y pagos',
                    'Acceso a todos los módulos según plan',
                ]
            },
            {
                'name': '🏠 Portal de Inquilino',
                'desc': 'Autoservicio para inquilinos 24/7',
                'features': [
                    'Ver contrato y documentos',
                    'Pagar alquiler online',
                    'Reportar incidencias con fotos',
                    'Chat con el gestor',
                    'Historial de pagos',
                ]
            },
            {
                'name': '👔 Portal de Propietario',
                'desc': 'Transparencia para propietarios de tu cartera',
                'features': [
                    'Ver estado de sus propiedades',
                    'Consultar pagos recibidos',
                    'Acceder a reportes de rentabilidad',
                    'Comunicarse con el gestor',
                ]
            },
            {
                'name': '🔧 Portal de Proveedor',
                'desc': 'Coordinación con proveedores de mantenimiento',
                'features': [
                    'Recibir órdenes de trabajo',
                    'Subir presupuestos',
                    'Gestionar facturas',
                    'Calendario de trabajos',
                ]
            },
            {
                'name': '📱 App Móvil (PWA)',
                'desc': 'Acceso desde cualquier dispositivo',
                'features': [
                    'Funciona en iOS, Android y Web',
                    'Notificaciones push',
                    'Modo offline para inspecciones',
                    'Captura de fotos y firmas',
                ]
            },
        ]
        
        for portal in portals:
            self.story.append(Paragraph(f"<b>{portal['name']}</b>", self.styles['FeatureTitle']))
            self.story.append(Paragraph(portal['desc'], self.styles['BulletText']))
            for feat in portal['features']:
                self.story.append(Paragraph(f"        • {feat}", self.styles['BulletText']))
            self.story.append(Spacer(1, 0.3*cm))
        
        self.story.append(PageBreak())

    def add_security_compliance(self):
        """Seguridad y compliance"""
        self.story.append(Paragraph("🔐 Seguridad y Compliance", self.styles['SectionHeader']))
        
        intro = """
        La seguridad de los datos es nuestra prioridad. Cumplimos con las normativas más 
        exigentes y aplicamos las mejores prácticas de la industria:
        """
        self.story.append(Paragraph(intro, self.styles['CustomBody']))
        
        self.story.append(Paragraph("🛡️ Seguridad Técnica", self.styles['SubSection']))
        security_items = [
            'Encriptación AES-256 para datos en reposo',
            'TLS 1.3 para datos en tránsito',
            'Autenticación multi-factor (2FA) opcional',
            'Single Sign-On (SSO/SAML) en Enterprise',
            'Backups automáticos diarios con retención 30 días',
            'Infraestructura en AWS EU (Frankfurt) con redundancia',
            'Monitorización 24/7 y alertas automáticas',
            'Penetration testing anual',
        ]
        for item in security_items:
            self.story.append(Paragraph(f"✓ {item}", self.styles['BulletText']))
        
        self.story.append(Spacer(1, 0.5*cm))
        
        self.story.append(Paragraph("📋 Compliance Legal", self.styles['SubSection']))
        compliance_items = [
            '<b>GDPR:</b> Cumplimiento total del Reglamento Europeo de Protección de Datos',
            '<b>LAU:</b> Contratos ajustados a la Ley de Arrendamientos Urbanos vigente',
            '<b>LOPDGDD:</b> Ley Orgánica de Protección de Datos española',
            '<b>eIDAS:</b> Firma electrónica con validez legal en toda la UE',
            '<b>PCI-DSS:</b> Seguridad de pagos a través de Stripe certificado',
            '<b>Ley 32/2006:</b> Compliance para subcontratación en construcción',
        ]
        for item in compliance_items:
            self.story.append(Paragraph(f"✓ {item}", self.styles['BulletText']))
        
        self.story.append(Spacer(1, 0.5*cm))
        
        self.story.append(Paragraph("📊 Auditoría y Trazabilidad", self.styles['SubSection']))
        audit_items = [
            'Audit log completo de todas las acciones',
            'Exportación de datos en cualquier momento (portabilidad)',
            'Derecho al olvido implementado',
            'Reportes de actividad para compliance interno',
            'Acceso a logs bajo demanda para auditorías externas',
        ]
        for item in audit_items:
            self.story.append(Paragraph(f"✓ {item}", self.styles['BulletText']))
        
        self.story.append(PageBreak())

    def add_implementation(self):
        """Implementación y soporte"""
        self.story.append(Paragraph("🚀 Implementación y Soporte", self.styles['SectionHeader']))
        
        self.story.append(Paragraph("⏱️ Timeline de Implementación", self.styles['SubSection']))
        
        timeline_data = [
            ['Fase', 'Duración', 'Actividades'],
            ['1. Onboarding', '1 día', 'Configuración cuenta, importación datos, formación básica'],
            ['2. Configuración', '1-3 días', 'Personalización, plantillas, integraciones'],
            ['3. Migración', '1-5 días', 'Importación de histórico (opcional)'],
            ['4. Go-Live', '1 día', 'Activación y soporte intensivo'],
            ['5. Optimización', 'Continuo', 'Ajustes, formación avanzada, nuevas features'],
        ]
        
        timeline_table = Table(timeline_data, colWidths=[3*cm, 2.5*cm, 10*cm])
        timeline_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), INMOVA_PURPLE),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), INMOVA_LIGHT),
            ('TEXTCOLOR', (0, 1), (-1, -1), INMOVA_DARK),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (0, 0), (1, -1), 'CENTER'),
            ('ALIGN', (2, 0), (2, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.white),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        self.story.append(timeline_table)
        
        self.story.append(Spacer(1, 1*cm))
        
        self.story.append(Paragraph("💁 Niveles de Soporte", self.styles['SubSection']))
        
        support_data = [
            ['Nivel', 'Canales', 'Tiempo Respuesta', 'Incluido en'],
            ['Básico', 'Email, Base conocimientos', '48h', 'Todos los planes'],
            ['Prioritario', 'Email, Chat en vivo', '4h', 'Profesional+'],
            ['Premium', 'Email, Chat, Teléfono', '1h', 'Business+'],
            ['Dedicado', 'Account Manager, Slack', 'Inmediato', 'Enterprise'],
        ]
        
        support_table = Table(support_data, colWidths=[2.5*cm, 5*cm, 4*cm, 4*cm])
        support_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), INMOVA_GREEN),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), INMOVA_LIGHT),
            ('TEXTCOLOR', (0, 1), (-1, -1), INMOVA_DARK),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.white),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        self.story.append(support_table)
        
        self.story.append(PageBreak())

    def add_partner_benefits(self):
        """Beneficios para partners"""
        self.story.append(Paragraph("🤝 Programa de Partners", self.styles['SectionHeader']))
        
        intro = """
        Como Multifamily Office, puedes beneficiarte de nuestro programa de partners 
        con condiciones especiales:
        """
        self.story.append(Paragraph(intro, self.styles['CustomBody']))
        
        benefits = [
            {
                'name': '💰 Descuentos por Volumen',
                'items': [
                    '10-50 propiedades: 10% descuento',
                    '51-200 propiedades: 15% descuento',
                    '201+ propiedades: 20% descuento + pricing personalizado',
                ]
            },
            {
                'name': '🎓 Formación Incluida',
                'items': [
                    'Onboarding personalizado para tu equipo',
                    'Webinars mensuales de nuevas funcionalidades',
                    'Acceso a documentación avanzada',
                    'Certificación de usuario avanzado',
                ]
            },
            {
                'name': '🔧 Soporte Preferente',
                'items': [
                    'Account Manager dedicado',
                    'Canal Slack privado',
                    'Llamadas de seguimiento mensuales',
                    'Prioridad en desarrollo de features solicitadas',
                ]
            },
            {
                'name': '📊 Reporting Avanzado',
                'items': [
                    'Dashboards personalizados para comités',
                    'Exportación automatizada de informes',
                    'Integración con herramientas de BI propias',
                    'Acceso anticipado a nuevos módulos analytics',
                ]
            },
            {
                'name': '🏷️ White Label (Enterprise)',
                'items': [
                    'Tu marca en la plataforma',
                    'Dominio personalizado (app.tufondo.com)',
                    'Emails con tu branding',
                    'Portales de inquilino/propietario personalizados',
                ]
            },
        ]
        
        for benefit in benefits:
            self.story.append(Paragraph(f"<b>{benefit['name']}</b>", self.styles['FeatureTitle']))
            for item in benefit['items']:
                self.story.append(Paragraph(f"    ✓ {item}", self.styles['BulletText']))
            self.story.append(Spacer(1, 0.3*cm))
        
        self.story.append(PageBreak())

    def add_next_steps(self):
        """Próximos pasos"""
        self.story.append(Paragraph("📞 Próximos Pasos", self.styles['SectionHeader']))
        
        steps_intro = """
        Estamos encantados de ayudarle a evaluar Inmova para su Multifamily Office. 
        Estos son los siguientes pasos recomendados:
        """
        self.story.append(Paragraph(steps_intro, self.styles['CustomBody']))
        
        steps = [
            ('1️⃣ Demo Personalizada', 
             'Agendamos una sesión de 45 minutos donde mostraremos las funcionalidades específicas para su caso de uso, con datos de ejemplo similares a su cartera.'),
            ('2️⃣ Prueba Gratuita', 
             'Acceso completo al plan Business durante 30 días sin compromiso. Puede importar datos reales o usar datos de demo.'),
            ('3️⃣ Propuesta Comercial', 
             'Tras la prueba, preparamos una propuesta personalizada con pricing, timeline de implementación y condiciones de partner.'),
            ('4️⃣ Kickoff de Proyecto', 
             'Si decide continuar, arrancamos con onboarding, migración y formación de su equipo.'),
        ]
        
        for title, desc in steps:
            self.story.append(Paragraph(f"<b>{title}</b>", self.styles['FeatureTitle']))
            self.story.append(Paragraph(desc, self.styles['BulletText']))
            self.story.append(Spacer(1, 0.3*cm))
        
        self.story.append(Spacer(1, 1*cm))
        
        # Información de contacto
        self.story.append(Paragraph("📧 Contacto", self.styles['SubSection']))
        
        contact_box = """
        <b>Web:</b> inmovaapp.com<br/>
        <b>Email Partners:</b> partners@inmova.app<br/>
        <b>Teléfono:</b> +34 91 XXX XX XX<br/>
        <b>LinkedIn:</b> linkedin.com/company/inmova-app<br/><br/>
        
        <i>Solicite su demo personalizada en:</i><br/>
        <b>inmovaapp.com/demo</b>
        """
        self.story.append(Paragraph(contact_box, ParagraphStyle(
            'ContactBox',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=INMOVA_DARK,
            borderWidth=1,
            borderColor=INMOVA_BLUE,
            borderPadding=15,
            backColor=INMOVA_LIGHT,
            leading=16
        )))
        
        self.story.append(Spacer(1, 1*cm))
        
        # Mensaje final
        closing = """
        <b>Gracias por su interés en Inmova.</b><br/><br/>
        Estamos comprometidos en ser el partner tecnológico que impulse la eficiencia 
        y rentabilidad de su cartera inmobiliaria.
        """
        self.story.append(Paragraph(closing, ParagraphStyle(
            'Closing',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=INMOVA_PURPLE,
            alignment=TA_CENTER,
            spaceBefore=20
        )))

    def build(self):
        """Generar el PDF"""
        self.add_cover_page()
        self.add_executive_summary()
        self.add_verticals()
        self.add_modules()
        self.add_ai_features()
        self.add_integrations()
        self.add_pricing()
        self.add_client_profiles()
        self.add_portals()
        self.add_security_compliance()
        self.add_implementation()
        self.add_partner_benefits()
        self.add_next_steps()
        
        self.doc.build(self.story)
        return self.filename


def main():
    output_file = '/workspace/INMOVA_Presentacion_Funcionalidades.pdf'
    
    print("🚀 Generando PDF de presentación de INMOVA...")
    print(f"📄 Archivo de salida: {output_file}")
    
    pdf = InmovaPDF(output_file)
    pdf.build()
    
    print(f"✅ PDF generado exitosamente: {output_file}")
    print(f"📊 Contenido incluido:")
    print("   - Portada profesional")
    print("   - Resumen ejecutivo")
    print("   - 7 Verticales de negocio")
    print("   - +15 Módulos transversales")
    print("   - Funcionalidades de IA")
    print("   - Integraciones disponibles")
    print("   - Planes y precios")
    print("   - Perfiles de cliente")
    print("   - Portales de acceso")
    print("   - Seguridad y compliance")
    print("   - Implementación y soporte")
    print("   - Beneficios para partners")
    print("   - Próximos pasos")


if __name__ == '__main__':
    main()
