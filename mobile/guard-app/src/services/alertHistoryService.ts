import { apiFetch } from './apiClient';

export type GuardAlertHistoryItem = {
  id: number;
  usuarioId: number;
  nombreUsuario: string;
  correoUsuario: string;
  facultad: string;
  zonaId: number;
  nombreZona: string;
  colorZona: string;
  lat: number;
  lng: number;
  estado: string;
  fechaHora: string;
  fechaAsumida?: string | null;
  fechaEnCamino?: string | null;
  fechaResuelta?: string | null;
  fechaCerrada?: string | null;
  guardiaAsignadoId?: number | null;
  guardiaAsignadoNombre?: string | null;
  tiempoRespuestaMinutos?: number | null;
};

export const alertHistoryService = {
  async getTodayHistory(
    guardiaId: number
  ): Promise<GuardAlertHistoryItem[]> {
    return apiFetch<GuardAlertHistoryItem[]>(
      `/Alerts/guard/${guardiaId}/history?date=today`
    );
  },
};