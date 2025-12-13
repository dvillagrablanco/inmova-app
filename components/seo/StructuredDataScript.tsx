/**
 * Structured Data Script Component
 * Componente para insertar JSON-LD en el head de la página
 */

import React from 'react';

export interface StructuredDataScriptProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Componente para insertar structured data en el head
 */
export function StructuredDataScript({ data }: StructuredDataScriptProps) {
  const jsonLd = Array.isArray(data) ? data : [data];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item),
          }}
        />
      ))}
    </>
  );
}
