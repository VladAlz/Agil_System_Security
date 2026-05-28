// ─── Servicio de Report.API — Estadísticas y Turnos ──────────────────────────
// Conecta el dashboard de Gaby con el microservicio Report.API (puerto 5004 vía Gateway).
// Todos los endpoints requieren JWT → se lee del localStorage.

import { API_URL } from "@/config/api";

// ─── Tipos de respuesta del backend ──────────────────────────────────────────

export interface DashboardStats {
  totalAlertas: number;
  alertasHoy: number;
  alertasActivas: number;
  alertasResueltas: number;
  tiempoRespuestaPromedio: number;   // minutos
  totalGuardiasEnServicio: number;
  totalTurnos: number;
  turnosActivos: number;
}

export interface ZoneStat {
  zonaId: number;
  zona: string;
  total: number;
  resueltas: number;
  activas: number;
  pctResolucion: number;
}

export interface FacultyStat {
  facultad: string;
  total: number;
  resueltas: number;
}

export interface DailyTrend {
  fecha: string;     // yyyy-MM-dd
  total: number;
  resueltas: number;
}

export interface GuardPerformance {
  guardiaId: number;
  nombreGuardia: string;
  totalAlertas: number;
  alertasResueltas: number;
  tiempoRespuestaPromedio: number;
  totalTurnos: number;
}

export interface ShiftReport {
  id: number;
  guardiaId: number;
  nombreGuardia: string;
  zonaId: number;
  nombreZona: string;
  inicioTurno: string;
  finTurno: string | null;
  alertasAtendidas: number;
  alertasResueltas: number;
  tiempoRespuestaPromedio: number;
  estado: "Activo" | "Cerrado";
  observaciones: string;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("ssiu_token") ?? "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const resp = await fetch(url, { headers: getAuthHeaders() });
  if (resp.status === 401) {
    localStorage.removeItem("ssiu_token");
    localStorage.removeItem("ssiu_user");
    window.location.href = "/"; // Force redirect to login
    throw new Error("Sesión expirada. Por favor, inicie sesión nuevamente.");
  }
  if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`);
  return resp.json() as Promise<T>;
}

// ─── API de Estadísticas ──────────────────────────────────────────────────────

/**
 * Métricas generales para las tarjetas del dashboard (HU-07).
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  return fetchJson<DashboardStats>(`${API_URL}/stats/dashboard`);
}

/**
 * Alertas agrupadas por zona (gráfico de barras del dashboard).
 */
export async function fetchZoneStats(): Promise<ZoneStat[]> {
  return fetchJson<ZoneStat[]>(`${API_URL}/stats/zones`);
}

/**
 * Alertas agrupadas por facultad (gráfico de barras en Statistics).
 */
export async function fetchFacultyStats(): Promise<FacultyStat[]> {
  return fetchJson<FacultyStat[]>(`${API_URL}/stats/faculties`);
}

/**
 * Tendencia diaria de alertas para el gráfico de líneas.
 * @param days Número de días hacia atrás (default 30).
 */
export async function fetchDailyTrend(days = 30): Promise<DailyTrend[]> {
  return fetchJson<DailyTrend[]>(`${API_URL}/stats/trend?days=${days}`);
}

/**
 * Ranking de rendimiento de guardias (HU-08).
 */
export async function fetchGuardPerformance(): Promise<GuardPerformance[]> {
  return fetchJson<GuardPerformance[]>(`${API_URL}/stats/guards`);
}

// ─── API de Turnos (HU-08) ───────────────────────────────────────────────────

/**
 * Lista todos los turnos de guardia con filtros opcionales.
 */
export async function fetchShiftReports(params?: {
  zonaId?: number;
  guardiaId?: number;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}): Promise<ShiftReport[]> {
  const qs = new URLSearchParams();
  if (params?.zonaId)    qs.set("zonaId",    String(params.zonaId));
  if (params?.guardiaId) qs.set("guardiaId", String(params.guardiaId));
  if (params?.estado)    qs.set("estado",    params.estado);
  if (params?.fechaDesde) qs.set("fechaDesde", params.fechaDesde);
  if (params?.fechaHasta) qs.set("fechaHasta", params.fechaHasta);
  const query = qs.toString();
  return fetchJson<ShiftReport[]>(`${API_URL}/reports${query ? `?${query}` : ""}`);
}

/**
 * Abre un nuevo turno de guardia.
 */
export async function createShiftReport(dto: {
  guardiaId: number;
  nombreGuardia: string;
  zonaId: number;
  nombreZona: string;
  observaciones?: string;
}): Promise<ShiftReport> {
  const resp = await fetch(`${API_URL}/reports`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  });
  if (resp.status === 401) {
    localStorage.removeItem("ssiu_token");
    localStorage.removeItem("ssiu_user");
    window.location.href = "/";
    throw new Error("Sesión expirada.");
  }
  if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`);
  return resp.json() as Promise<ShiftReport>;
}

/**
 * Cierra un turno activo con las métricas del período.
 */
export async function closeShiftReport(
  id: number,
  dto: {
    alertasAtendidas: number;
    alertasResueltas: number;
    tiempoRespuestaPromedio: number;
    observaciones?: string;
  }
): Promise<ShiftReport> {
  const resp = await fetch(`${API_URL}/reports/${id}/close`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  });
  if (resp.status === 401) {
    localStorage.removeItem("ssiu_token");
    localStorage.removeItem("ssiu_user");
    window.location.href = "/";
    throw new Error("Sesión expirada.");
  }
  if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`);
  return resp.json() as Promise<ShiftReport>;
}
