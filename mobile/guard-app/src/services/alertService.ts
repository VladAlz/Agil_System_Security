import { API_URL } from '../../config/api';

export type AlertDetail = {
  id: number;
  usuarioId: number;
  zonaId: number;
  lat: number;
  lng: number;
  estado: string;
  fechaHora: string;
  usuario?: {
    id: number;
    nombre: string;
    correo: string;
    rol: string;
    facultad: string;
  };
  zona?: {
    id: number;
    nombre: string;
    color: string;
  };
};

export const alertService = {
  async getById(alertId: string | number): Promise<AlertDetail> {
    const response = await fetch(`${API_URL}/Alerts/${alertId}`);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.mensaje || 'No se pudo cargar la alerta');
    }

    return data;
  },

  // ─── HU-09: Endpoints dedicados para máquina de estados ──────────────

  async assumeAlert(alertId: string | number, guardiaId: number): Promise<AlertDetail> {
    const response = await fetch(`${API_URL}/Alerts/${alertId}/assume`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guardiaId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.mensaje || 'No se pudo asumir la alerta');
    }

    return data;
  },

  async enRouteAlert(alertId: string | number): Promise<AlertDetail> {
    const response = await fetch(`${API_URL}/Alerts/${alertId}/enroute`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.mensaje || 'No se pudo cambiar a En Camino');
    }

    return data;
  },

  async arriveAlert(alertId: string | number): Promise<AlertDetail> {
    const response = await fetch(`${API_URL}/Alerts/${alertId}/arrive`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.mensaje || 'No se pudo marcar como resuelta');
    }

    return data;
  },

  async closeAlert(alertId: string | number): Promise<AlertDetail> {
    const response = await fetch(`${API_URL}/Alerts/${alertId}/close`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.mensaje || 'No se pudo cerrar la alerta');
    }

    return data;
  },

  async cancelAlert(alertId: string | number): Promise<AlertDetail> {
    const response = await fetch(`${API_URL}/Alerts/${alertId}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.mensaje || 'No se pudo cancelar la alerta');
    }

    return data;
  },

  // Mantener updateStatus por compatibilidad (redirige a los nuevos endpoints)
  async updateStatus(alertId: string | number, estado: string, guardiaId?: number): Promise<AlertDetail> {
    switch (estado) {
      case 'Asumida':
        return this.assumeAlert(alertId, guardiaId ?? 0);
      case 'En Camino':
        return this.enRouteAlert(alertId);
      case 'Resuelta':
        return this.arriveAlert(alertId);
      case 'Cerrada':
        return this.closeAlert(alertId);
      default:
        throw new Error(`Estado desconocido: ${estado}`);
    }
  },
};