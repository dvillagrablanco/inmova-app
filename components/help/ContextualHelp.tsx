'use client';

/**
 * AYUDA CONTEXTUAL SIMPLIFICADA
 * Muestra ayuda relevante según la página donde esté el usuario
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  HelpCircle,
  X,
  Video,
  BookOpen,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpContent {
  title: string;
  description: string;
  quickTips: string[];
  videoUrl?: string;
  commonQuestions: { q: string; a: string }[];
}

const HELP_CONTENT: Record<string, HelpContent> = {
  dashboard: {
    title: 'Tu Panel Principal',
    description:
      'Aquí ves un resumen de todo lo importante: ingresos, propiedades ocupadas, pagos pendientes.',
    quickTips: [
      'Las tarjetas de arriba muestran los números más importantes',
      'Los gráficos te ayudan a ver tendencias en el tiempo',
      'Las alertas rojas requieren tu atención pronto',
    ],
    commonQuestions: [
      {
        q: '¿Qué significa "Tasa de Ocupación"?',
        a: 'Es el porcentaje de tus propiedades que están alquiladas. Ejemplo: si tienes 10 pisos y 8 están ocupados, tu tasa es 80%.',
      },
      {
        q: '¿Cómo actualizo los datos?',
        a: 'Los datos se actualizan automáticamente cada vez que añades un pago, contrato o propiedad nueva.',
      },
    ],
  },
  edificios: {
    title: 'Tus Edificios y Propiedades',
    description:
      'Aquí guardas toda la información de tus inmuebles: direcciones, fotos, documentos.',
    quickTips: [
      'Haz click en "Nuevo Edificio" para añadir tu primera propiedad',
      'Sube fotos para recordar detalles importantes',
      'Los documentos se guardan de forma segura',
    ],
    commonQuestions: [
      {
        q: '¿Puedo guardar varios edificios?',
        a: 'Sí, sin límite. Puedes organizar por edificios o zonas geográficas.',
      },
      {
        q: '¿Qué documentos puedo subir?',
        a: 'Cualquier documento: escrituras, certificados, facturas, fotos, planos.',
      },
    ],
  },
  inquilinos: {
    title: 'Tus Inquilinos',
    description: 'Información de contacto, contratos y pagos de cada persona que alquila contigo.',
    quickTips: [
      'Añade inquilinos desde el botón "Nuevo Inquilino"',
      'Puedes enviarles mensajes directamente desde aquí',
      'El historial de pagos te ayuda a llevar el control',
    ],
    commonQuestions: [
      {
        q: '¿Cómo envío un mensaje a un inquilino?',
        a: 'Click en su nombre, luego en el ícono de mensaje. El mensaje llega a su email.',
      },
      {
        q: '¿Se enteran de que uso esta app?',
        a: 'Solo si tú quieres. Puedes mantener privado tu uso de la herramienta.',
      },
    ],
  },
  contratos: {
    title: 'Contratos de Alquiler',
    description: 'Todos tus contratos en un solo lugar, organizados y fáciles de encontrar.',
    quickTips: [
      'Crea contratos desde plantillas predefinidas',
      'Los contratos próximos a vencer aparecen resaltados',
      'Puedes firmar digitalmente sin impresiones',
    ],
    commonQuestions: [
      {
        q: '¿Son válidos legalmente?',
        a: 'Sí, la firma digital tiene la misma validez que la firma en papel según la ley española.',
      },
      {
        q: '¿Puedo editar un contrato después de crearlo?',
        a: 'Depende. Si ya está firmado, necesitas crear un anexo. Si no está firmado, puedes editarlo libremente.',
      },
    ],
  },
  configuracion: {
    title: 'Configuración',
    description: 'Personaliza la aplicación según tus necesidades y experiencia.',
    quickTips: [
      'Si eres nuevo, deja activada la "Ayuda Visual"',
      'Puedes activar/desactivar funciones que no uses',
      'Los cambios se guardan automáticamente',
    ],
    commonQuestions: [
      {
        q: '¿Qué es "Nivel de Experiencia"?',
        a: 'Controla cuánta ayuda ves. "Principiante" muestra más ayuda, "Avanzado" muestra menos.',
      },
      {
        q: '¿Puedo desactivar funciones?',
        a: 'Sí, en la pestaña "Módulos". Desactiva lo que no uses para simplificar el menú.',
      },
    ],
  },
};

export function ContextualHelp({ page = 'dashboard' }: { page?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const content = HELP_CONTENT[page] || HELP_CONTENT.dashboard;

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        // Posicionado arriba del FloatingTourButton (bottom-[216px] + ~56px)
        // Stack: chatbot(6) -> AIDoc(88) -> FormAssistant(152) -> TourButton(216) -> ContextualHelp(272)
        className="fixed bottom-[272px] right-6 w-10 h-10 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 z-30 hidden lg:flex lg:right-8"
        size="icon"
        title="Ayuda contextual"
      >
        <HelpCircle className="w-4 h-4 text-white" />
      </Button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        // Panel de ayuda posicionado arriba del botón
        className="fixed bottom-[272px] right-6 w-80 max-h-[45vh] z-[60] hidden lg:block lg:right-8"
      >
        <Card className="bg-white shadow-2xl border-2 border-blue-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{content.title}</h3>
                <p className="text-xs text-gray-600">Ayuda rápida</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </Button>
          </div>

          {/* Content - Scrollable */}
          <div className="max-h-[500px] overflow-y-auto p-4 space-y-4">
            {/* Description */}
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">{content.description}</p>
            </div>

            {/* Quick Tips */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <BookOpen size={16} className="text-blue-600" />
                Consejos rápidos
              </h4>
              <ul className="space-y-2">
                {content.quickTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Video Tutorial (if available) */}
            {content.videoUrl && (
              <Button variant="outline" className="w-full">
                <Video size={16} className="mr-2" />
                Ver video tutorial (2 min)
              </Button>
            )}

            {/* Common Questions */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <MessageCircle size={16} className="text-blue-600" />
                Preguntas frecuentes
              </h4>
              <div className="space-y-2">
                {content.commonQuestions.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                      className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">{item.q}</span>
                      {expandedQuestion === index ? (
                        <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {expandedQuestion === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 pt-0 text-sm text-gray-600 bg-gray-50">{item.a}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 text-center space-y-2">
              <p className="text-sm text-gray-700">¿No encuentras lo que buscas?</p>
              <Button variant="outline" size="sm" className="w-full">
                <MessageCircle size={16} className="mr-2" />
                Contactar soporte
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
