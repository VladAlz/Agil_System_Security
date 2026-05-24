import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─── Configuración de API — Arquitectura Microservicios ─────────────────────
const GATEWAY_PORT = '5000';
const ALERTS_HUB_PORT = '5002';

const getGatewayHost = () => {
  if (Platform.OS === 'web') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'localhost';
    }
    return hostname;
  }

  // En móviles, extraer la IP automáticamente de Expo
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }

  return '10.79.18.5'; // Fallback seguro a tu IP actual
};

const GATEWAY_HOST = getGatewayHost();

// HTTP → pasa por el Gateway
export const API_URL = `http://${GATEWAY_HOST}:${GATEWAY_PORT}/api`;

// WebSocket → pasa por el Gateway :5000 (Ocelot ahora soporta WebSockets)
export const HUB_URL = `http://${GATEWAY_HOST}:${GATEWAY_PORT}/alerthub`;
