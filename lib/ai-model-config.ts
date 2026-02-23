/**
 * Configuración centralizada de modelos de IA
 * 
 * Todos los servicios deben importar los modelos desde aquí
 * para facilitar actualizaciones cuando Anthropic deprece versiones.
 * 
 * Modelos verificados (Feb 2026):
 * - claude-sonnet-4-6 (último Sonnet, principal)
 * - claude-3-haiku-20240307 (rápido/económico)
 * 
 * Deprecated (ya no funcionan):
 * - claude-3-5-sonnet-20241022, claude-haiku-3-5-20241022
 */

/** Modelo principal para tareas complejas (valoraciones, análisis, generación) */
export const CLAUDE_MODEL_PRIMARY = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

/** Modelo rápido/económico para tareas simples (clasificación, ranking, chat) */
export const CLAUDE_MODEL_FAST = 'claude-3-haiku-20240307';

/** Max tokens por defecto */
export const CLAUDE_DEFAULT_MAX_TOKENS = parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096', 10);
