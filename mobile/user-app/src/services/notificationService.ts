// ─── notificationService.ts — Notificaciones push/local (HU-13) ───────────────
// Carga perezosa de expo-notifications: si el paquete no está instalado o se
// ejecuta en web, el servicio degrada a no-op y no rompe la app ni el dev server.
// Para push remoto en segundo plano se requiere un build (EAS/dev-client) con
// credenciales FCM y un projectId de EAS en app.json (extra.eas.projectId).

import { Platform } from 'react-native';
import Constants from 'expo-constants';

let Notifications: any = null;
try { Notifications = require('expo-notifications'); } catch { Notifications = null; }

let handlerSet = false;

function ensureHandler() {
  if (!Notifications || handlerSet) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerSet = true;
}

/**
 * Solicita permisos, crea el canal Android y devuelve el token de push remoto
 * (Expo) si hay un projectId configurado. HU-13 Escenario 3.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications || Platform.OS === 'web') return null;
  ensureHandler();

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Alertas SSIU',
        importance: Notifications.AndroidImportance?.MAX ?? 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ef4444',
      });
    }

    const projectId =
      (Constants.expoConfig?.extra as any)?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId;
    if (!projectId) return null;   // sin projectId no se emite token remoto

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Muestra una notificación local inmediata. Funciona con la app en primer o
 * segundo plano (mientras el proceso siga vivo).
 */
export async function notifyLocal(title: string, body: string): Promise<void> {
  if (!Notifications || Platform.OS === 'web') return;
  ensureHandler();
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch {
    /* no-op */
  }
}
