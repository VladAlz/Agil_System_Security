// ─── alertReportService.ts — Reportería precisa de incidentes (HU-12) ─────────
// Consulta Alerts.Service (GET /api/alerts vía Gateway) con rango de fechas REAL
// y expone cada incidente con sus sellos temporales completos del ciclo de vida.

import { API_URL } from "@/config/api";
import type { AlertHistoryItem } from "@/data/statistics";

const EC_TZ = "America/Guayaquil";

/** Formatea una fecha ISO a fecha y hora exactas en es-EC (zona Ecuador). */
export function formatEC(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-EC", {
    timeZone: EC_TZ,
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

/** Tiempo de respuesta (asunción → resolución/cierre) en formato "Xm Ys". */
function responseTime(a: any): string {
  const start = a.fechaAsumida ? new Date(a.fechaAsumida).getTime() : null;
  const end = a.fechaCerrada
    ? new Date(a.fechaCerrada).getTime()
    : a.fechaResuelta ? new Date(a.fechaResuelta).getTime() : null;
  if (!start || !end || end < start) return "—";
  const secs = Math.round((end - start) / 1000);
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function mapAlert(a: any): AlertHistoryItem {
  return {
    id: String(a.id),
    code: `ALT-${1000 + a.id}`,
    usuario: a.nombreUsuario || "Desconocido",
    facultad: a.facultad || "—",
    tipo: "Pánico",
    estado: a.estado || "Activa",
    zona: a.nombreZona || "—",
    fecha: formatEC(a.fechaHora),
    guardia: a.guardiaAsignadoNombre || undefined,
    // HU-12 — sellos temporales completos del ciclo de la alerta
    fechaCreacion: formatEC(a.fechaHora),
    fechaAsumida: formatEC(a.fechaAsumida),
    fechaEnCamino: formatEC(a.fechaEnCamino),
    fechaResuelta: formatEC(a.fechaResuelta),
    fechaCerrada: formatEC(a.fechaCerrada),
    tiempoRespuesta: responseTime(a),
  };
}

export interface AlertReportParams {
  fechaDesde?: string;   // "YYYY-MM-DDTHH:mm"
  fechaHasta?: string;
}

/**
 * Lista los incidentes (alertas) del rango indicado, consultando el backend real.
 * El filtrado por fecha lo aplica Alerts.Service (no es simulación de cadena).
 */
export async function fetchAlertReport(params: AlertReportParams = {}): Promise<AlertHistoryItem[]> {
  const token = localStorage.getItem("ssiu_token") ?? "";
  const qs = new URLSearchParams({ page: "0", pageSize: "100" });
  if (params.fechaDesde) qs.set("fechaDesde", params.fechaDesde);
  if (params.fechaHasta) qs.set("fechaHasta", params.fechaHasta);

  const resp = await fetch(`${API_URL}/alerts?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`);

  const data = await resp.json();
  const items = Array.isArray(data) ? data : (data.items ?? []);
  return items.map(mapAlert);
}
