# Storybook - Biblioteca de Componentes UI INMOVA

## Descripción

Storybook es una herramienta de desarrollo para construir, documentar y probar componentes de UI de forma aislada.

## Acceso

### Ejecutar Storybook en Desarrollo

```bash
yarn storybook
```

La interfaz estará disponible en: http://localhost:6006

### Build para Producción

```bash
yarn build-storybook
```

Los archivos estáticos se generarán en `storybook-static/`

## Componentes Documentados

### ✅ Componentes Básicos

#### Button
- Variantes: default, destructive, outline, secondary, ghost, link
- Tamaños: default, sm, lg, icon
- Estados: normal, disabled, loading
- Con/sin iconos

#### Card
- Card simple
- Card con footer
- Card de KPI
- Card de estadísticas

#### Badge
- Variantes: default, secondary, destructive, outline
- Badges de estado
- Badges de roles

#### Input
- Tipos: text, email, password, number, date, search
- Con/sin label
- Con iconos
- Estados: normal, disabled
- Ejemplos de formularios

### 🎨 Componentes Compuestos (Próximamente)

- Dialog
- DropdownMenu
- Select
- Table
- Tabs
- Toast

## Estructura

```
.storybook/
├── main.ts           # Configuración principal
└── preview.ts        # Configuración global de historias

stories/
├── Button.stories.tsx
├── Card.stories.tsx
├── Badge.stories.tsx
└── Input.stories.tsx
```

## Crear una Nueva Historia

### 1. Estructura Básica

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { MiComponente } from '@/components/ui/mi-componente';

const meta = {
  title: 'UI/MiComponente',
  component: MiComponente,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'variant1', 'variant2'],
    },
  },
} satisfies Meta<typeof MiComponente>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Mi Componente',
  },
};
```

### 2. Historias con Render Personalizado

```typescript
export const Complex: Story = {
  render: () => (
    <div className="space-y-4">
      <MiComponente variant="default">Opción 1</MiComponente>
      <MiComponente variant="variant1">Opción 2</MiComponente>
    </div>
  ),
};
```

### 3. Historias Interactivas

```typescript
export const Interactive: Story = {
  args: {
    onClick: () => alert('Clicked!'),
    children: 'Click Me',
  },
};
```

## Características de Storybook

### 🎛️ Controls
Modifica las props de los componentes en tiempo real desde la interfaz.

### 📱 Viewport
Prueba los componentes en diferentes tamaños de pantalla:
- Mobile (375px)
- Tablet (768px)
- Desktop (1280px)

### 🎨 Backgrounds
Cambia el fondo para probar el contraste:
- Light (#ffffff)
- Dark (#1a1a1a)
- Gray (#f5f5f5)

### ♿ Accessibility
Addon `@storybook/addon-a11y` para verificar la accesibilidad.

### 📖 Autodocs
Documentación automática generada a partir de las historias y TypeScript.

## Configuración

### main.ts
```typescript
stories: [
  '../stories/**/*.stories.@(js|jsx|ts|tsx)',
  '../components/**/*.stories.@(js|jsx|ts|tsx)',
]

addons: [
  '@storybook/addon-links',
  '@storybook/addon-essentials',
  '@storybook/addon-interactions',
  '@storybook/addon-a11y',
]

framework: '@storybook/nextjs'
```

### preview.ts
```typescript
parameters: {
  backgrounds: { ... },
  viewport: { ... },
}
```

## Mejores Prácticas

### 1. Organización
```typescript
// ✅ Bueno - Agrupado por categoría
title: 'UI/Button'
title: 'Forms/Input'
title: 'Layout/Card'

// ❌ Evitar
title: 'Button'
```

### 2. Variantes Completas
Documenta TODAS las variantes del componente:
```typescript
export const Default: Story = { ... }
export const Primary: Story = { ... }
export const Secondary: Story = { ... }
export const Disabled: Story = { ... }
export const Loading: Story = { ... }
```

### 3. Ejemplos Realistas
Usa datos que representen casos de uso reales:
```typescript
// ✅ Bueno
children: 'Guardar Cambios'

// ❌ Evitar
children: 'Lorem ipsum'
```

### 4. Documentación con JSDoc
```typescript
/**
 * Button component for user interactions
 * 
 * @example
 * <Button variant="default" size="lg">
 *   Click Me
 * </Button>
 */
```

## Integración con Desarrollo

### 1. TDD de Componentes
1. Crea la historia con los casos de uso
2. Implementa el componente
3. Verifica visualmente en Storybook
4. Itera hasta lograr el resultado deseado

### 2. Design System
Storybook funciona como documentación viva del design system.

### 3. Testing Visual
Puedes integrar herramientas como Chromatic para testing visual automático.

## Scripts Disponibles

Añade estos scripts a tu workflow:

```json
{
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build"
}
```

Ejecutar:
```bash
yarn storybook          # Modo desarrollo
yarn build-storybook    # Build producción
```

## Deployment

### Opción 1: Chromatic
```bash
yarn add -D chromatic
npx chromatic --project-token=<token>
```

### Opción 2: Static Hosting
```bash
yarn build-storybook
# Subir storybook-static/ a cualquier hosting
```

### Opción 3: GitHub Pages
```yaml
# .github/workflows/storybook.yml
- run: yarn build-storybook
- uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./storybook-static
```

## Addons Instalados

- **@storybook/addon-essentials**: Addons básicos (controles, acciones, docs)
- **@storybook/addon-interactions**: Testing de interacciones
- **@storybook/addon-links**: Links entre historias
- **@storybook/addon-a11y**: Verificación de accesibilidad

## Addons Recomendados

```bash
# Responsive design
yarn add -D @storybook/addon-viewport

# Dark mode
yarn add -D storybook-dark-mode

# Theme switcher
yarn add -D @storybook/addon-themes

# Performance
yarn add -D @storybook/addon-performance
```

## Recursos

- [Storybook Documentation](https://storybook.js.org/docs)
- [Next.js Integration](https://storybook.js.org/docs/react/get-started/nextjs)
- [Writing Stories](https://storybook.js.org/docs/react/writing-stories/introduction)
- [Addons](https://storybook.js.org/addons)
- [Best Practices](https://storybook.js.org/docs/react/writing-stories/best-practices)

## Solución de Problemas

### Error: Cannot find module '@/...'
Verifica que el alias esté configurado en `main.ts`:
```typescript
webpackFinal: async (config) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, '../'),
  };
  return config;
}
```

### Estilos de Tailwind no se aplican
Importa los estilos en `.storybook/preview.ts`:
```typescript
import '../app/globals.css';
```

### Componentes de Next.js no funcionan
Usa `@storybook/nextjs` framework en lugar de `@storybook/react`.

## Roadmap

- [ ] Documentar todos los componentes UI
- [ ] Añadir historias para componentes de layout
- [ ] Integrar testing visual con Chromatic
- [ ] Crear temas personalizables
- [ ] Documentar patrones de composición
- [ ] Añadir ejemplos de formularios complejos

## Métricas Actuales

- ✅ 4 componentes documentados
- ✅ 25+ variantes de componentes
- ✅ Configuración completa de addons
- ✅ Soporte para Tailwind CSS
- ✅ Autodocs habilitado
- ✅ Tests de accesibilidad

