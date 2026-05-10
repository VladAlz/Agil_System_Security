import Constants from 'expo-constants';

// ─── Configuración de API — Arquitectura Microservicios ─────────────────────
// Extraemos la IP automáticamente desde el servidor de desarrollo de Expo.
// Así no tienes que cambiarla manualmente si te conectas a otra red Wi-Fi.
const getGatewayHost = () => {
  // Constants.expoConfig?.hostUri suele ser "192.168.X.X:8081"
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0]; // Devuelve solo "192.168.X.X"
  }
  return '192.168.1.61'; // Fallback seguro a tu IP actual
};

const GATEWAY_IP      = getGatewayHost();
const GATEWAY_PORT    = '5000';
const ALERTS_HUB_PORT = '5002';

// HTTP → pasa por el Gateway
export const BASE_URL = `http://${GATEWAY_IP}:${GATEWAY_PORT}/api`;

// WebSocket → conexión directa a Alerts.Service (evita limitaciones de Ocelot)
export const HUB_URL  = `http://${GATEWAY_IP}:${ALERTS_HUB_PORT}/alerthub`;
