'use client';

import { useEffect, useState } from 'react';
import { ResponsiveContainer as RechartsResponsiveContainer } from 'recharts';

interface ClientResponsiveContainerProps {
  width?: number | `${number}%`;
  height?: number | `${number}%`;
  children?: React.ReactNode;
  [key: string]: any;
}

/**
 * Client-side only ResponsiveContainer wrapper
 * 
 * This component fixes the "WidthProvider is not a function" error
 * by ensuring ResponsiveContainer only renders on the client side.
 * 
 * During SSR, it renders a placeholder div with the same dimensions.
 * After hydration, it replaces the placeholder with the actual ResponsiveContainer.
 */
export function ClientResponsiveContainer({
  width = '100%',
  height = 400,
  children,
  ...props
}: ClientResponsiveContainerProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR and before hydration, render a placeholder
  if (!isClient) {
    return (
      <div
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        }}
        aria-hidden="true"
      >
        {/* Empty placeholder to match SSR dimensions */}
      </div>
    );
  }

  // After hydration, render the actual ResponsiveContainer
  return (
    <RechartsResponsiveContainer width={width as any} height={height as any} {...props}>
      {children as any}
    </RechartsResponsiveContainer>
  );
}

// Default export for convenience
export default ClientResponsiveContainer;
