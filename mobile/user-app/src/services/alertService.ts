import type { AlertPayload, AlertResponse } from '../types';
import { BASE_URL } from '../config/api';

// Sprint 1 - Conecta al backend real Ssiu.Api
export const alertService = {
  async sendAlert(payload: AlertPayload): Promise<AlertResponse> {
    const response = await fetch(`${BASE_URL}/Alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarioId: parseInt(payload.userId || '0'),
        lat: payload.latitude,
        lng: payload.longitude
      })
    });

    if (!response.ok) {
      throw new Error('Error al enviar la alerta');
    }

    const data = await response.json();
    return {
      id: data.id.toString(),
      status: data.estado,
      zoneId: data.zonaId,
      message: 'Alerta enviada con éxito'
    };
  },
};

export const ALERT_API = BASE_URL;
