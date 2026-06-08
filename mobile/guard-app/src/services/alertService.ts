import { apiFetch } from './apiClient';

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
    return apiFetch<AlertDetail>(`/Alerts/${alertId}`);
  },

  // ─── HU-09: Endpoints dedicados para máquina de estados ──────────────

  async assumeAlert(
    alertId: string | number,
    guardiaId: number
  ): Promise<AlertDetail> {
    return apiFetch<AlertDetail>(`/Alerts/${alertId}/assume`, {
      method: 'PUT',
      body: JSON.stringify({ guardiaId }),
    });
  },

  async enRouteAlert(alertId: string | number): Promise<AlertDetail> {
    return apiFetch<AlertDetail>(`/Alerts/${alertId}/enroute`, {
      method: 'PUT',
    });
  },

  async arriveAlert(alertId: string | number): Promise<AlertDetail> {
    return apiFetch<AlertDetail>(`/Alerts/${alertId}/arrive`, {
      method: 'PUT',
    });
  },

  async closeAlert(alertId: string | number, observacionesGuardia?: string): Promise<AlertDetail> {
    return apiFetch<AlertDetail>(`/Alerts/${alertId}/close`, {
      method: 'PUT',
      body: JSON.stringify({ observacionesGuardia }),
    });
  },

  async cancelAlert(alertId: string | number): Promise<AlertDetail> {
    return apiFetch<AlertDetail>(`/Alerts/${alertId}/cancel`, {
      method: 'PUT',
    });
  },

  // Mantener updateStatus por compatibilidad
  async updateStatus(
    alertId: string | number,
    estado: string,
    guardiaId?: number
  ): Promise<AlertDetail> {
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