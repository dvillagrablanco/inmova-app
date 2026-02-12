/**
 * Configuración centralizada de modelos de IA
 * 
 * Todos los servicios deben importar los modelos desde aquí
 * para facilitar actualizaciones cuando Anthropic deprece versiones.
 * 
 * Modelos actuales (Feb 2026):
 * - claude-sonnet-4-20250514 (principal, reemplaza claude-3-5-sonnet)
 * - claude-haiku-3-5-20241022 (rapido/economico, reemplaza claude-3-haiku)
 */

/** Modelo principal para tareas complejas (valoraciones, análisis, generación) */
export const CLAUDE_MODEL_PRIMARY = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

/** Modelo rápido/económico para tareas simples (clasificación, ranking, chat) */
export const CLAUDE_MODEL_FAST = 'claude-haiku-3-5-20241022';

/** Max tokens por defecto */
export const CLAUDE_DEFAULT_MAX_TOKENS = parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096', 10);
