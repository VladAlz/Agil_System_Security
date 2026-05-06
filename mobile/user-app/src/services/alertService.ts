import type { AlertPayload, AlertResponse } from '../types';

const ALERT_API = process.env.EXPO_PUBLIC_ALERT_API_URL ?? 'http://10.0.2.2:5002';

// Sprint 1 stub — Sprint 2 conecta a Alert.API real
export const alertService = {
  async sendAlert(payload: AlertPayload): Promise<AlertResponse> {
    if (!payload.userId) {
      return Promise.reject(new Error('userId is required'));
    }
    return new Promise<AlertResponse>((resolve) =>
      setTimeout(
        () =>
          resolve({
            id: `alert-${Date.now()}`,
            status: 'Active',
            zoneId: 1,
            message: 'Alerta enviada. Guardias notificados.',
          }),
        500,
      ),
    );
  },
};

export { ALERT_API };
