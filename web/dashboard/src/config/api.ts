// ─── Configuración de API — Arquitectura Microservicios ─────────────────────
// Las peticiones HTTP pasan por el Ocelot API Gateway en el puerto 5000.
// SignalR (WebSocket) se conecta DIRECTAMENTE a Alerts.Service en el puerto 5002
// porque Ocelot tiene limitaciones conocidas con WebSockets.

const GATEWAY_HOST    = 'localhost';
const GATEWAY_PORT    = '5000';
const ALERTS_HUB_PORT = '5002'; // Conexión directa para SignalR

// HTTP → pasa por el Gateway
export const API_URL = `http://${GATEWAY_HOST}:${GATEWAY_PORT}/api`;

// WebSocket → conexión directa a Alerts.Service (evita limitaciones de Ocelot)
export const HUB_URL = `http://${GATEWAY_HOST}:${ALERTS_HUB_PORT}/alerthub`;
