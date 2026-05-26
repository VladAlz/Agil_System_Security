import { apiFetch } from './apiClient';

export type ShiftReport = {
  id: number;
  guardiaId: number;
  nombreGuardia: string;
  zonaId: number;
  nombreZona: string;
  inicioTurno: string;
  finTurno?: string | null;
  alertasAtendidas: number;
  alertasResueltas: number;
  tiempoRespuestaPromedio: number;
  estado: 'Activo' | 'Cerrado' | string;
  observaciones: string;
  creadoEn: string;
};

export type CreateShiftReportPayload = {
  guardiaId: number;
  nombreGuardia: string;
  zonaId: number;
  nombreZona: string;
  observaciones: string;
};

export type CloseShiftReportPayload = {
  alertasAtendidas: number;
  alertasResueltas: number;
  tiempoRespuestaPromedio: number;
  observaciones: string;
};

export const reportService = {
  async getReportsByGuard(guardiaId: number): Promise<ShiftReport[]> {
    return apiFetch<ShiftReport[]>(
      `/reports?guardiaId=${guardiaId}&_t=${Date.now()}`
    );
  },

  async getActiveReport(guardiaId: number): Promise<ShiftReport | null> {
    const reports = await this.getReportsByGuard(guardiaId);

    return (
      reports.find((report) => report.estado?.toLowerCase() === 'activo') ??
      null
    );
  },

  async createReport(
    payload: CreateShiftReportPayload
  ): Promise<ShiftReport> {
    return apiFetch<ShiftReport>('/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async closeReport(
    reportId: number,
    payload: CloseShiftReportPayload
  ): Promise<ShiftReport> {
    return apiFetch<ShiftReport>(`/reports/${reportId}/close`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};