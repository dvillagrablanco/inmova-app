/**
 * 🎨 INMOVA AUTO-GROWTH ENGINE - Image Generator
 * Genera imágenes dinámicas de mockups UI para posts en redes sociales
 *
 * Ejemplo de uso:
 * GET /api/og/saas?topic=AUTOMATIZACION&variant=notification
 * GET /api/og/saas?topic=ROI_INMOBILIARIO&variant=dashboard
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

interface ImageConfig {
  topic: string;
  variant: 'notification' | 'dashboard' | 'chart' | 'mobile' | 'simple';
  text?: string;
  metric?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const config: ImageConfig = {
      topic: searchParams.get('topic') || 'AUTOMATIZACION',
      variant: (searchParams.get('variant') as any) || 'notification',
      text: searchParams.get('text') || undefined,
      metric: searchParams.get('metric') || undefined,
    };

    // Seleccionar diseño según variant
    let content;
    switch (config.variant) {
      case 'notification':
        content = renderNotification(config);
        break;
      case 'dashboard':
        content = renderDashboard(config);
        break;
      case 'chart':
        content = renderChart(config);
        break;
      case 'mobile':
        content = renderMobile(config);
        break;
      case 'simple':
        content = renderSimple(config);
        break;
      default:
        content = renderNotification(config);
    }

    return new ImageResponse(content, {
      width: 1200,
      height: 630,
    });
  } catch (error) {
    console.error('[OG Image] Error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}

// ============================================
// VARIANTES DE DISEÑO
// ============================================

/**
 * VARIANTE 1: Notificación Móvil
 * Simula una notificación push de la app Inmova
 */
function renderNotification(config: ImageConfig) {
  const notifications = {
    AUTOMATIZACION: '✅ 15 emails enviados automáticamente',
    ROI_INMOBILIARIO: '💰 Alquiler c/Goya: Cobrado 1,200€',
    GESTION_ALQUILERES: '📋 3 contratos renovados este mes',
    COLIVING: '🏡 Nueva reserva: Habitación #3',
    FIRMA_DIGITAL: '📝 Contrato firmado digitalmente',
    TIEMPO_LIBERTAD: '⏱️ 8 horas ahorradas esta semana',
    ESCALABILIDAD: '📈 50 propiedades gestionadas',
    INTEGRACIONES: '🔗 Sincronizado con QuickBooks',
    REPORTES_ANALYTICS: '📊 Informe mensual generado',
    COMUNIDADES: '🏢 Votación cerrada: 85% aprobado',
  };

  const text =
    config.text ||
    notifications[config.topic as keyof typeof notifications] ||
    notifications.AUTOMATIZACION;

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px',
      }}
    >
      {/* Patrón geométrico de fondo */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.1,
          backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Contenedor de notificación */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'white',
          borderRadius: '24px',
          padding: '50px 60px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.4)',
          maxWidth: '900px',
        }}
      >
        {/* Header de la notificación */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              marginRight: '20px',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#1f2937' }}>Inmova</div>
            <div style={{ fontSize: '16px', color: '#6b7280' }}>Ahora</div>
          </div>
        </div>

        {/* Texto de la notificación */}
        <div
          style={{
            fontSize: '42px',
            fontWeight: 800,
            color: '#111827',
            lineHeight: 1.3,
          }}
        >
          {text}
        </div>

        {/* Badge inferior */}
        <div
          style={{
            display: 'flex',
            marginTop: '30px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              padding: '8px 20px',
              borderRadius: '999px',
              background: '#f3f4f6',
              fontSize: '16px',
              color: '#6b7280',
              fontWeight: 600,
            }}
          >
            Gestión Automática
          </div>
        </div>
      </div>

      {/* Logo inferior derecha */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '60px',
          display: 'flex',
          alignItems: 'center',
          color: 'white',
          fontSize: '32px',
          fontWeight: 800,
        }}
      >
        INMOVA
      </div>
    </div>
  );
}

/**
 * VARIANTE 2: Dashboard con Métricas
 * Simula un panel de control de la app
 */
function renderDashboard(config: ImageConfig) {
  const metrics = {
    AUTOMATIZACION: { value: '15h', label: 'Tiempo ahorrado', change: '+45%' },
    ROI_INMOBILIARIO: { value: '12.5%', label: 'ROI Promedio', change: '+3.2%' },
    GESTION_ALQUILERES: { value: '48', label: 'Propiedades activas', change: '+12' },
    ESCALABILIDAD: { value: '5→50', label: 'Crecimiento', change: '10x' },
  };

  const metric = metrics[config.topic as keyof typeof metrics] || metrics.AUTOMATIZACION;

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#f9fafb',
        padding: '60px',
      }}
    >
      {/* Sidebar simulado */}
      <div
        style={{
          width: '200px',
          background: 'white',
          borderRadius: '16px',
          marginRight: '30px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
        }}
      >
        {/* Menú items simulados */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: '40px',
              background: i === 2 ? '#667eea' : '#f3f4f6',
              borderRadius: '8px',
            }}
          />
        ))}
      </div>

      {/* Contenido principal */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#111827' }}>Dashboard</div>
          <div
            style={{
              padding: '12px 24px',
              background: 'white',
              borderRadius: '12px',
              fontSize: '18px',
              color: '#6b7280',
              fontWeight: 600,
            }}
          >
            Diciembre 2025
          </div>
        </div>

        {/* Card principal con métrica */}
        <div
          style={{
            display: 'flex',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '24px',
            padding: '50px',
            color: 'white',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ fontSize: '28px', opacity: 0.9 }}>{metric.label}</div>
            <div style={{ fontSize: '96px', fontWeight: 900 }}>{metric.value}</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '24px',
                opacity: 0.9,
              }}
            >
              <div
                style={{
                  padding: '6px 16px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '999px',
                  marginRight: '10px',
                }}
              >
                {metric.change}
              </div>
              vs. mes anterior
            </div>
          </div>

          {/* Gráfico simulado */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            {[60, 75, 65, 85, 95, 100].map((height, i) => (
              <div
                key={i}
                style={{
                  width: '30px',
                  height: `${height * 1.5}px`,
                  background: 'rgba(255, 255, 255, 0.4)',
                  borderRadius: '8px 8px 0 0',
                }}
              />
            ))}
          </div>
        </div>

        {/* Cards secundarias */}
        <div style={{ display: 'flex', gap: '20px' }}>
          {[
            { label: 'Ingresos', value: '€45,230' },
            { label: 'Ocupación', value: '94%' },
            { label: 'Mantenimiento', value: '3 activos' },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: 'white',
                borderRadius: '16px',
                padding: '30px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ fontSize: '18px', color: '#6b7280', marginBottom: '10px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#111827' }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * VARIANTE 3: Gráfico de Barras Ascendente
 * Representación visual de crecimiento/ROI
 */
function renderChart(config: ImageConfig) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #667eea 0%, #764ba2 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px',
      }}
    >
      {/* Contenedor blanco con el gráfico */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'white',
          borderRadius: '32px',
          padding: '60px',
          width: '100%',
          maxWidth: '1000px',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Título */}
        <div style={{ fontSize: '48px', fontWeight: 900, color: '#111827', marginBottom: '50px' }}>
          Crecimiento Exponencial
        </div>

        {/* Gráfico de barras */}
        <div
          style={{
            display: 'flex',
            gap: '30px',
            alignItems: 'flex-end',
            height: '300px',
          }}
        >
          {[
            { height: 80, label: '5' },
            { height: 120, label: '12' },
            { height: 180, label: '25' },
            { height: 260, label: '42' },
            { height: 300, label: '50' },
          ].map((bar, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${bar.height}px`,
                  background: 'linear-gradient(to top, #10b981, #34d399)',
                  borderRadius: '16px 16px 0 0',
                  boxShadow: '0 -4px 12px rgba(16, 185, 129, 0.3)',
                }}
              />
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: '#111827',
                  marginTop: '20px',
                }}
              >
                {bar.label}
              </div>
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '40px',
            fontSize: '20px',
            color: '#6b7280',
          }}
        >
          <div>Enero</div>
          <div>Mayo</div>
        </div>

        {/* Métrica destacada */}
        <div
          style={{
            display: 'flex',
            marginTop: '50px',
            padding: '30px',
            background: '#f3f4f6',
            borderRadius: '16px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '24px', color: '#6b7280' }}>Propiedades gestionadas</div>
          <div style={{ fontSize: '56px', fontWeight: 900, color: '#10b981' }}>10x</div>
        </div>
      </div>
    </div>
  );
}

/**
 * VARIANTE 4: Mockup Móvil
 * Simula una app móvil de Inmova
 */
function renderMobile(config: ImageConfig) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
      }}
    >
      {/* Dispositivo móvil */}
      <div
        style={{
          width: '420px',
          height: '840px',
          background: '#1f2937',
          borderRadius: '60px',
          padding: '20px',
          boxShadow: '0 40px 100px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Notch */}
        <div
          style={{
            width: '120px',
            height: '30px',
            background: '#111827',
            borderRadius: '0 0 20px 20px',
            margin: '0 auto 20px',
          }}
        />

        {/* Pantalla */}
        <div
          style={{
            flex: 1,
            background: 'white',
            borderRadius: '40px',
            padding: '40px 30px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header de app */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#111827' }}>Inmova</div>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#667eea',
              }}
            />
          </div>

          {/* Card destacada */}
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '24px',
              padding: '35px',
              color: 'white',
              marginBottom: '30px',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '15px', opacity: 0.9 }}>
              Total este mes
            </div>
            <div style={{ fontSize: '56px', fontWeight: 900 }}>€12,500</div>
            <div style={{ fontSize: '18px', marginTop: '15px', opacity: 0.9 }}>
              +18% vs. anterior
            </div>
          </div>

          {/* Lista de items */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '20px 0',
                borderBottom: '2px solid #f3f4f6',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#f3f4f6',
                    marginRight: '15px',
                  }}
                />
                <div style={{ fontSize: '18px', color: '#6b7280' }}>Propiedad {i}</div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>€1,200</div>
            </div>
          ))}
        </div>
      </div>

      {/* Texto lateral */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginLeft: '80px',
          maxWidth: '500px',
        }}
      >
        <div style={{ fontSize: '64px', fontWeight: 900, color: '#111827', lineHeight: 1.1 }}>
          Gestiona desde cualquier lugar
        </div>
        <div
          style={{
            fontSize: '28px',
            color: '#6b7280',
            marginTop: '30px',
            lineHeight: 1.5,
          }}
        >
          Tu negocio inmobiliario en el bolsillo
        </div>
      </div>
    </div>
  );
}

/**
 * VARIANTE 5: Simple con Tipografía Masiva
 * Para posts minimalistas
 */
function renderSimple(config: ImageConfig) {
  const text = config.text || '15 horas ahorradas cada semana';

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#111827',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Texto principal */}
        <div
          style={{
            fontSize: '96px',
            fontWeight: 900,
            color: 'white',
            lineHeight: 1.1,
            marginBottom: '60px',
          }}
        >
          {text}
        </div>

        {/* Divider */}
        <div
          style={{
            width: '200px',
            height: '6px',
            background: 'linear-gradient(to right, #667eea, #764ba2)',
            borderRadius: '999px',
            marginBottom: '60px',
          }}
        />

        {/* Subtexto */}
        <div
          style={{
            fontSize: '36px',
            color: '#9ca3af',
            fontWeight: 600,
          }}
        >
          Con Inmova
        </div>
      </div>
    </div>
  );
}
