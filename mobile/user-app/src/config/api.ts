import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─── Configuración de API — Arquitectura Microservicios ─────────────────────
const GATEWAY_PORT = '5000';

// HU-13: el APK puede apuntar a la IP del servidor SIN recompilar el código.
// Prioridad: EXPO_PUBLIC_GATEWAY_URL (env) > app.json (extra.gatewayUrl) > autodetección.
const configuredUrl =
  process.env.EXPO_PUBLIC_GATEWAY_URL ||
  ((Constants.expoConfig?.extra as any)?.gatewayUrl ?? '');

const getGatewayBase = (): string => {
  if (configuredUrl) return String(configuredUrl).replace(/\/+$/, '');

  // En web (navegador), usar el hostname de la página
  if (Platform.OS === 'web') {
    const hostname = (typeof window !== 'undefined' && window.location.hostname) || 'localhost';
    return `http://${hostname}:${GATEWAY_PORT}`;
  }

  // En desarrollo móvil con Metro, extraer la IP automáticamente de Expo
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `http://${host}:${GATEWAY_PORT}`;
};

const GATEWAY_BASE = getGatewayBase();

// HTTP → pasa por el Gateway
export const BASE_URL = `${GATEWAY_BASE}/api`;

// WebSocket → pasa por el Gateway :5000 (Ocelot soporta WebSockets)
export const HUB_URL = `${GATEWAY_BASE}/alerthub`;
