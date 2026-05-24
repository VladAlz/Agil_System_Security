// ─── Configuración de API — Arquitectura Microservicios ─────────────────────
// Las peticiones HTTP pasan por el Ocelot API Gateway en el puerto 5000.
// SignalR (WebSocket) también pasa por el Gateway (ahora con WebSockets habilitado).

const GATEWAY_HOST = 'localhost';
const GATEWAY_PORT = '5000';

// HTTP → pasa por el Gateway
export const API_URL = `http://${GATEWAY_HOST}:${GATEWAY_PORT}/api`;

// WebSocket → pasa por el Gateway :5000 (Ocelot ahora soporta WebSockets)
export const HUB_URL = `http://${GATEWAY_HOST}:${GATEWAY_PORT}/alerthub`;
