// ============================================================
// Configuración de la experiencia conversacional
// Ajustá estos valores a gusto — no tocan la lógica, solo el ritmo.
// ============================================================

/**
 * Tiempo (en milisegundos) que cada paso del "proceso de pensamiento" (Prolog / IA)
 * permanece visible antes de pasar al siguiente.
 *
 * ⬆️  Subilo para que el usuario tenga MÁS tiempo de leer cada paso (más lento).
 * ⬇️  Bajalo para que los pasos roten más rápido.
 *
 * Ejemplos: 6000 = 6 s · 9000 = 9 s · 12000 = 12 s
 */
export const THINKING_STEP_DURATION_MS = 900000;

/**
 * Velocidad de "tipeo" de la respuesta de la IA (ms por palabra).
 * ⬆️  Más alto = escribe más lento · ⬇️ más bajo = más rápido.
 */
export const RESPONSE_TYPEWRITER_SPEED_MS = 15;
