'use client';

import { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  position?: 'bottom' | 'right' | 'left';
  fullScreen?: boolean;
}

/**
 * Drawer optimizado para móviles
 * Soporte para gestos de arrastre
 */
export function MobileDrawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'bottom',
  fullScreen = false,
}: MobileDrawerProps) {
  const positionStyles = {
    bottom: 'inset-x-0 bottom-0 rounded-t-3xl max-h-[90vh]',
    right: 'inset-y-0 right-0 rounded-l-3xl max-w-md w-full',
    left: 'inset-y-0 left-0 rounded-r-3xl max-w-md w-full',
  };

  const slideStyles = {
    bottom: 'translate-y-full',
    right: 'translate-x-full',
    left: '-translate-x-full',
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div
            className={cn(
              'flex min-h-full',
              position === 'right' && 'justify-end',
              position === 'left' && 'justify-start',
              position === 'bottom' && 'items-end'
            )}
          >
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom={slideStyles[position]}
              enterTo="translate-x-0 translate-y-0"
              leave="transform transition ease-in-out duration-200"
              leaveFrom="translate-x-0 translate-y-0"
              leaveTo={slideStyles[position]}
            >
              <Dialog.Panel
                className={cn(
                  'fixed bg-white overflow-y-auto',
                  fullScreen ? 'inset-0' : positionStyles[position]
                )}
              >
                {/* Handle bar para bottom drawer */}
                {position === 'bottom' && (
                  <div className="flex justify-center py-3">
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                  </div>
                )}

                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  {title && (
                    <Dialog.Title className="text-xl font-bold text-gray-900">{title}</Dialog.Title>
                  )}
                  <button
                    onClick={onClose}
                    className="ml-auto p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Cerrar"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
