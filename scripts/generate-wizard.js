#!/usr/bin/env node

/**
 * GENERADOR DE WIZARDS - CLI para crear nuevos wizards automáticamente
 * 
 * Uso:
 * node scripts/generate-wizard.js --name=Flipping --steps=5
 * 
 * O con npm:
 * npm run generate-wizard -- --name=Flipping --steps=5
 */

const fs = require('fs');
const path = require('path');

// Parsear argumentos
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value;
  return acc;
}, {});

const wizardName = args.name;
const stepsCount = parseInt(args.steps || '3');

if (!wizardName) {
  console.error('❌ Error: Debes proporcionar un nombre con --name=NombreWizard');
  console.log('\nUso: node scripts/generate-wizard.js --name=Flipping --steps=5');
  process.exit(1);
}

const componentName = `${wizardName}Wizard`;
const fileName = `${componentName}.tsx`;
const componentPath = path.join(__dirname, '..', 'components', 'wizards', fileName);
const pagePath = path.join(__dirname, '..', 'app', wizardName.toLowerCase(), 'wizard', 'page.tsx');

console.log(`\n🧪 Generando wizard: ${componentName}`);
console.log(`📁 Archivos a crear:`);
console.log(`   - ${componentPath}`);
console.log(`   - ${pagePath}`);

// Template del componente
const componentTemplate = `"use client";

import React, { useState, useEffect } from 'react';
import { useWizard } from '@/lib/hooks/useWizard';
import { WizardContainer } from './WizardContainer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface ${componentName}Props {
  onComplete?: (data: any) => void;
}

/**
 * ${componentName.toUpperCase()} - Wizard de ${wizardName} en ${stepsCount} pasos
 * 
 * TODO: Personalizar los pasos según las necesidades de ${wizardName}
 */
export function ${componentName}({ onComplete }: ${componentName}Props) {
  const router = useRouter();

  const wizard = useWizard({
    steps: [
${Array.from({ length: stepsCount }, (_, i) => `      {
        id: 'step${i + 1}',
        title: 'Paso ${i + 1}',
        description: 'Descripción del paso ${i + 1}',
      },`).join('\n')}
    ],
    persistKey: '${wizardName.toLowerCase()}-wizard',
    onComplete: async (data) => {
      try {
        // TODO: Implementar lógica de guardado
        const res = await fetch('/api/${wizardName.toLowerCase()}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          toast.success('¡${wizardName} completado!');
          if (onComplete) {
            onComplete(data);
          } else {
            router.push('/${wizardName.toLowerCase()}');
          }
        } else {
          throw new Error('Error al completar ${wizardName}');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al completar ${wizardName}');
        throw error;
      }
    },
  });

  // TODO: Agregar estados para cada paso
${Array.from({ length: stepsCount }, (_, i) => `  const [step${i + 1}Data, setStep${i + 1}Data] = useState({});
`).join('')}

  // TODO: Actualizar datos del wizard
${Array.from({ length: stepsCount }, (_, i) => `  useEffect(() => {
    wizard.actions.updateData('step${i + 1}', step${i + 1}Data);
  }, [step${i + 1}Data]);

`).join('')}
  // Validación del paso actual
  const isCurrentStepValid = () => {
    const { currentStepIndex } = wizard.state;

    switch (currentStepIndex) {
${Array.from({ length: stepsCount }, (_, i) => `      case ${i}:
        // TODO: Implementar validación para paso ${i + 1}
        return true;`).join('\n')}
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (wizard.state.currentStepIndex) {
${Array.from({ length: stepsCount }, (_, i) => `      case ${i}:
        return (
          <div className="space-y-4">
            <p>Contenido del Paso ${i + 1}</p>
            {/* TODO: Implementar formulario para paso ${i + 1} */}
            <div>
              <Label htmlFor="field${i + 1}">Campo de ejemplo</Label>
              <Input
                id="field${i + 1}"
                placeholder="Ingresa un valor..."
              />
            </div>
          </div>
        );`).join('\n\n')}

      default:
        return null;
    }
  };

  return (
    <WizardContainer
      state={wizard.state}
      title="${wizardName} Wizard"
      description="Completa los pasos para configurar ${wizardName}"
      isStepValid={isCurrentStepValid()}
      isSubmitting={wizard.isSubmitting}
      onNext={wizard.actions.goToNext}
      onPrevious={wizard.actions.goToPrevious}
      onComplete={wizard.actions.complete}
    >
      {renderStepContent()}
    </WizardContainer>
  );
}
`;

// Template de la página
const pageTemplate = `"use client";

import { ${componentName} } from '@/components/wizards/${componentName}';
import { useRouter } from 'next/navigation';

/**
 * PÁGINA DE WIZARD DE ${wizardName.toUpperCase()}
 * 
 * Ruta: /${wizardName.toLowerCase()}/wizard
 */
export default function ${componentName}Page() {
  const router = useRouter();

  return (
    <${componentName}
      onComplete={(data) => {
        console.log('${wizardName} completado:', data);
        router.push('/${wizardName.toLowerCase()}');
      }}
    />
  );
}
`;

// Crear directorio de la página si no existe
const pageDir = path.dirname(pagePath);
if (!fs.existsSync(pageDir)) {
  fs.mkdirSync(pageDir, { recursive: true });
}

// Escribir archivos
try {
  fs.writeFileSync(componentPath, componentTemplate);
  console.log(`\n✅ Componente creado: ${componentPath}`);

  fs.writeFileSync(pagePath, pageTemplate);
  console.log(`✅ Página creada: ${pagePath}`);

  console.log(`\n🎉 ¡Wizard generado exitosamente!`);
  console.log(`\n📖 Próximos pasos:`);
  console.log(`   1. Edita ${fileName} para personalizar los pasos`);
  console.log(`   2. Implementa la validación en isCurrentStepValid()`);
  console.log(`   3. Añade los formularios en renderStepContent()`);
  console.log(`   4. Implementa la lógica de guardado en onComplete`);
  console.log(`   5. Crea la API en /api/${wizardName.toLowerCase()}`);
  console.log(`\n🚀 Accede al wizard en: http://localhost:3000/${wizardName.toLowerCase()}/wizard`);
} catch (error) {
  console.error(`\n❌ Error al generar wizard:`, error.message);
  process.exit(1);
}
