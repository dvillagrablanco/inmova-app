# 🏗️ ARQUITECTURA MICRO-FRONTENDS POR VERTICAL

**Fecha:** 31 de Diciembre de 2025  
**Versión:** 1.0  
**Estado:** Implementación planificada

---

## 🎯 OBJETIVO

Separar la aplicación monolítica en micro-frontends independientes por vertical de negocio, permitiendo:

- **Desarrollo independiente** por equipos
- **Deploy independiente** de cada vertical
- **Escalabilidad** mejorada
- **Mantenibilidad** simplificada
- **Tecnologías heterogéneas** si es necesario

---

## 📊 VERTICALES IDENTIFICADAS

Según el análisis del schema de Prisma (`BusinessVertical` enum):

1. **Alquiler Tradicional** (`alquiler_tradicional`)
2. **STR Vacacional** (`str_vacacional`)
3. **Coliving** (`coliving`)
4. **Room Rental** (`room_rental`)
5. **Construcción** (`construccion`)
6. **Flipping** (`flipping`)
7. **Servicios Profesionales** (`servicios_profesionales`)
8. **Comunidades** (`comunidades`)
9. **Mixto** (`mixto`)

---

## 🏛️ ARQUITECTURA PROPUESTA

### Modelo: **Host + Remotes** (Module Federation)

```
┌─────────────────────────────────────────────────────────────┐
│                       HOST APPLICATION                        │
│                      (Shell/Container)                        │
│                                                               │
│  - Routing principal                                         │
│  - Autenticación compartida                                  │
│  - Layout global (Header, Sidebar)                           │
│  - State management global                                    │
│  - API Gateway                                                │
│                                                               │
│  Ports: 3000 (main)                                           │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│   REMOTE 1     │  │    REMOTE 2     │  │    REMOTE 3     │
│   Alquiler     │  │    Coliving     │  │   Comunidades   │
│   Tradicional  │  │                 │  │                 │
│                │  │                 │  │                 │
│  - Propiedades │  │  - Rooms        │  │  - Votaciones   │
│  - Inquilinos  │  │  - Events       │  │  - Gastos       │
│  - Contratos   │  │  - Matching     │  │  - Reuniones    │
│  - Pagos       │  │  - Community    │  │  - Convocatoria │
│                │  │                 │  │                 │
│  Port: 3001    │  │  Port: 3002     │  │  Port: 3003     │
└────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 🔧 TECNOLOGÍAS

### Webpack 5 Module Federation

**Configuración Host:**

```javascript
// next.config.js (Host)
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new ModuleFederationPlugin({
          name: 'host',
          remotes: {
            alquiler: 'alquiler@http://localhost:3001/remoteEntry.js',
            coliving: 'coliving@http://localhost:3002/remoteEntry.js',
            comunidades: 'comunidades@http://localhost:3003/remoteEntry.js',
          },
          shared: {
            react: { singleton: true, eager: true },
            'react-dom': { singleton: true, eager: true },
            'next/router': { singleton: true },
            '@tanstack/react-query': { singleton: true },
          },
        })
      );
    }
    return config;
  },
};
```

**Configuración Remote:**

```javascript
// next.config.js (Remote - ej: Alquiler)
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new ModuleFederationPlugin({
          name: 'alquiler',
          filename: 'remoteEntry.js',
          exposes: {
            './Propiedades': './pages/propiedades',
            './Inquilinos': './pages/inquilinos',
            './Contratos': './pages/contratos',
          },
          shared: {
            react: { singleton: true, eager: true },
            'react-dom': { singleton: true, eager: true },
          },
        })
      );
    }
    return config;
  },
};
```

---

## 📦 ESTRUCTURA DE DIRECTORIOS

```
inmova-app/
├── host/                    # Aplicación principal (Shell)
│   ├── app/
│   │   ├── layout.tsx       # Layout global
│   │   ├── (auth)/          # Rutas de autenticación
│   │   └── [vertical]/      # Dynamic routes para remotes
│   ├── components/
│   │   ├── shared/          # Componentes compartidos
│   │   └── layout/          # Header, Sidebar, Footer
│   └── lib/
│       ├── api-gateway.ts   # Proxy para APIs de remotes
│       └── remote-loader.ts # Dynamic loading de remotes
│
├── remotes/
│   ├── alquiler/            # Vertical Alquiler Tradicional
│   │   ├── pages/
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   │
│   ├── coliving/            # Vertical Coliving
│   │   ├── pages/
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   │
│   └── comunidades/         # Vertical Comunidades
│       ├── pages/
│       ├── components/
│       ├── lib/
│       └── package.json
│
└── shared/                  # Packages compartidos
    ├── ui/                  # Componentes UI (Shadcn)
    ├── types/               # TypeScript types
    ├── utils/               # Utilidades
    └── api-client/          # Cliente API compartido
```

---

## 🔄 COMUNICACIÓN ENTRE MICRO-FRONTENDS

### 1. **Event Bus** (Custom Events)

```typescript
// shared/event-bus.ts
class EventBus {
  private events: Map<string, Function[]> = new Map();

  subscribe(event: string, callback: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  publish(event: string, data: any) {
    if (this.events.has(event)) {
      this.events.get(event)!.forEach((callback) => callback(data));
    }
  }

  unsubscribe(event: string, callback: Function) {
    if (this.events.has(event)) {
      const callbacks = this.events.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
}

export const eventBus = new EventBus();

// Uso:
// Remote 1 publica evento
eventBus.publish('tenant:created', { id: '123', name: 'Juan' });

// Remote 2 escucha evento
eventBus.subscribe('tenant:created', (data) => {
  console.log('Nuevo inquilino:', data);
});
```

### 2. **Shared State** (Zustand global)

```typescript
// shared/store.ts
import create from 'zustand';

interface GlobalState {
  user: User | null;
  company: Company | null;
  setUser: (user: User) => void;
  setCompany: (company: Company) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  user: null,
  company: null,
  setUser: (user) => set({ user }),
  setCompany: (company) => set({ company }),
}));
```

### 3. **API Gateway** (Proxy centralizado)

```typescript
// host/lib/api-gateway.ts
export class APIGateway {
  private baseURL = process.env.NEXT_PUBLIC_API_URL;

  // Proxy requests con autenticación automática
  async request(path: string, options?: RequestInit) {
    const token = getAuthToken();

    return fetch(`${this.baseURL}${path}`, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Métodos específicos por vertical
  alquiler = {
    getPropiedades: () => this.request('/api/alquiler/propiedades'),
    getInquilinos: () => this.request('/api/alquiler/inquilinos'),
  };

  coliving = {
    getRooms: () => this.request('/api/coliving/rooms'),
    getEvents: () => this.request('/api/coliving/events'),
  };
}

export const apiGateway = new APIGateway();
```

---

## 🚀 ESTRATEGIA DE MIGRACIÓN

### Fase 1: Preparación (2 semanas)

1. **Auditoría de dependencias**
   - Identificar dependencias compartidas
   - Crear paquete `@inmova/shared`

2. **Refactoring inicial**
   - Separar componentes por vertical
   - Extraer lógica de negocio

3. **Setup de monorepo** (Turborepo o Nx)
   ```bash
   npx create-turbo@latest
   ```

### Fase 2: Implementación piloto (1 mes)

1. **Vertical piloto: Alquiler Tradicional**
   - Extraer como primer remote
   - Configurar Module Federation
   - Testing exhaustivo

2. **Configurar CI/CD independiente**
   - GitHub Actions por remote
   - Deploy independiente a Vercel

### Fase 3: Migración completa (2-3 meses)

1. **Migrar resto de verticales**
   - Coliving
   - Comunidades
   - STR Vacacional
   - etc.

2. **Optimizaciones**
   - Code splitting avanzado
   - Lazy loading de remotes
   - Caching strategies

### Fase 4: Consolidación (1 mes)

1. **Optimización de performance**
2. **Documentación completa**
3. **Training del equipo**

---

## 📊 BENEFICIOS ESPERADOS

### Performance

| Métrica         | Antes (Monolito) | Después (Micro-frontends)  | Mejora |
| --------------- | ---------------- | -------------------------- | ------ |
| **Bundle Size** | 5 MB             | 500 KB (host) + 1MB/remote | -60%   |
| **TTI**         | 4.5s             | 2.0s (host)                | -55%   |
| **Deploy Time** | 15 min           | 3 min/remote               | -80%   |

### Desarrollo

- **Tiempo de build**: -70% (solo rebuild del remote modificado)
- **Conflictos de merge**: -80% (equipos independientes)
- **Time to market**: -50% (deploy independiente)

---

## ⚠️ RIESGOS Y MITIGACIONES

### Riesgo 1: Complejidad de configuración

**Mitigación:**

- Templates pre-configurados
- Scripts de setup automatizados
- Documentación exhaustiva

### Riesgo 2: Errores de comunicación entre remotes

**Mitigación:**

- Event Bus con tipos TypeScript
- Contract testing automático
- Monitoreo de errores (Sentry)

### Riesgo 3: Overhead de red

**Mitigación:**

- Precarga de remotes críticos
- Service Worker para caching
- CDN para static assets

---

## 🎓 REFERENCIAS Y RECURSOS

- [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/)
- [Micro-Frontends Pattern](https://micro-frontends.org/)
- [Next.js Module Federation Plugin](https://www.npmjs.com/package/@module-federation/nextjs-mf)
- [Monorepos con Turborepo](https://turbo.build/)

---

**Firma:** Cursor AI Agent  
**Fecha:** 31/12/2025  
**Status:** Arquitectura definida, listo para implementación
