/** Base URL for API calls (empty = same origin / Vite proxy). */
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
