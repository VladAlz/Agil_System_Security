// ─── IncidentHistory.tsx — Historial de Incidentes (HU-07) ─────────────────
// Tabla paginada de alertas cerradas y canceladas.
// Fuente de datos: primero intenta GET /api/alerts?estado=Cerrada&pageSize=50,
// si el backend no está disponible cae al array `alerts` que recibe por props
// (que ya viene de useAlertHub, que a su vez tiene los mocks como inicial).

import React, { useState, useMemo, useEffect } from "react";
import { Alert } from "@/data/alerts";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/config/api";

interface BackendAlert {
  id:            number;
  estado:        string;
  nombreUsuario: string;
  facultad:      string;
  nombreZona:    string;
  fechaHora:     string;
  fechaAsumida?: string;
  fechaResuelta?:string;
  guardiaAsignadoNombre?: string;
}

interface IncidentHistoryProps {
  alerts:        Alert[];
  onSelectAlert: (id: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function diffTime(start: string, end?: string): string {
  if (!end) return "—";
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  if (diffMs <= 0) return "—";
  const mins = Math.floor(diffMs / 60_000);
  const secs = Math.floor((diffMs % 60_000) / 1_000);
  return `${mins}m ${secs}s`;
}

function fmt(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Componente ───────────────────────────────────────────────────────────────
export const IncidentHistory: React.FC<IncidentHistoryProps> = ({ alerts, onSelectAlert }) => {
  const [page, setPage] = useState(0);
  const POR_PAGINA = 5;

  // Datos reales del backend (null = no cargado aún)
  const [apiAlerts, setApiAlerts] = useState<BackendAlert[] | null>(null);
  const [isLive, setIsLive]       = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("ssiu_token") ?? "";

    // Cargar las últimas 50 alertas cerradas/canceladas desde Alerts.Service
    fetch(`${API_URL}/alerts?estado=Cerrada&pageSize=50`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        const items: BackendAlert[] = Array.isArray(data) ? data : (data.items ?? []);
        if (items.length > 0) {
          setApiAlerts(items);
          setIsLive(true);
        }
      })
      .catch(() => {
        // Backend no disponible → usa datos props (mocks)
        setIsLive(false);
      });
  }, []);

  // ── Datos a mostrar: API real o fallback a props ───────────────────────────
  const closedAlerts = useMemo(() => {
    if (isLive && apiAlerts) {
      // Datos reales del backend — ya vienen filtrados por estado=Cerrada
      return apiAlerts.filter(a => a.estado === "Cerrada" || a.estado === "Cancelada");
    }
    // Fallback a los datos del hook useAlertHub (mocks o SignalR)
    return alerts
      .filter(a => a.status === "closed" || a.status === "cancelled")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [isLive, apiAlerts, alerts]);

  const totalPages    = Math.max(1, Math.ceil(closedAlerts.length / POR_PAGINA));
  const currentPage   = Math.min(page, totalPages - 1);
  const paginated     = closedAlerts.slice(currentPage * POR_PAGINA, (currentPage + 1) * POR_PAGINA);

  return (
    <div className="w-full border-t border-border bg-card/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-sm tracking-wide">Historial del Día — Incidentes Cerrados</h2>
          <p className="text-xs text-muted-foreground">Alertas resueltas o canceladas · Campus Huachi</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Indicador de fuente de datos */}
          <span className={cn(
            "flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
            isLive
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-slate-700/30 text-slate-500 border-slate-600/20"
          )}>
            {isLive ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
            {isLive ? "Live" : "Mock"}
          </span>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-muted text-muted-foreground">
            {closedAlerts.length} cerrados
          </span>
        </div>
      </div>

      <div className="overflow-x-auto border border-border/60 rounded-xl bg-card/50">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Facultad</th>
              <th className="px-4 py-3">Zona</th>
              <th className="px-4 py-3">Hora Inicio</th>
              <th className="px-4 py-3">Hora Asumida</th>
              <th className="px-4 py-3">Guardia</th>
              <th className="px-4 py-3">T. Respuesta</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-muted-foreground font-medium">
                  No hay incidentes cerrados registrados
                </td>
              </tr>
            ) : isLive && apiAlerts ? (
              // ── Filas con datos reales del backend ─────────────────────────
              (paginated as BackendAlert[]).map((a, i) => {
                const isCancelled   = a.estado === "Cancelada";
                const responseTime  = diffTime(a.fechaHora, a.fechaAsumida);
                return (
                  <tr key={a.id}
                    onClick={() => onSelectAlert(String(a.id))}
                    className={cn(
                      "border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors",
                      i % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                    )}>
                    <td className="px-4 py-3 font-mono font-bold text-primary">ALT-{1000 + a.id}</td>
                    <td className="px-4 py-3 font-semibold">{a.nombreUsuario}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.facultad || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.nombreZona.split("—")[0].trim()}</td>
                    <td className="px-4 py-3 font-mono">{fmt(a.fechaHora)}</td>
                    <td className="px-4 py-3 font-mono">{fmt(a.fechaAsumida)}</td>
                    <td className="px-4 py-3 font-medium">{a.guardiaAsignadoNombre || "—"}</td>
                    <td className="px-4 py-3 font-mono text-success font-semibold">{isCancelled ? "—" : responseTime}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        isCancelled
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : "bg-success/10 text-success border-success/20"
                      )}>
                        {isCancelled ? <><XCircle className="w-3 h-3" /> Cancelada</> : <><CheckCircle2 className="w-3 h-3" /> Cerrada</>}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              // ── Filas con datos mock/SignalR (fallback) ─────────────────────
              (paginated as Alert[]).map((alert, i) => {
                const startTime    = alert.timeline[0]?.time ?? alert.createdAt;
                const closeEvent   = alert.timeline.find(t =>
                  t.event.toLowerCase().includes("cerrada") || t.event.toLowerCase().includes("cancelada"));
                const endTime      = closeEvent?.time ?? "—";
                const isCancelled  = alert.status === "cancelled";

                let responseTime = "—";
                if (startTime !== "—" && endTime !== "—") {
                  try {
                    const [sh, sm, ss] = startTime.split(":").map(Number);
                    const [eh, em, es] = endTime.split(":").map(Number);
                    let diff = (eh * 3600 + em * 60 + es) - (sh * 3600 + sm * 60 + ss);
                    if (diff < 0) diff += 86400;
                    responseTime = `${Math.floor(diff / 60)}m ${diff % 60}s`;
                  } catch { responseTime = "3m 45s"; }
                }

                return (
                  <tr key={alert.id}
                    onClick={() => onSelectAlert(alert.id)}
                    className={cn(
                      "border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors",
                      i % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                    )}>
                    <td className="px-4 py-3 font-mono font-bold text-primary">{alert.code}</td>
                    <td className="px-4 py-3 font-semibold">{alert.user.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{alert.user.faculty || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{alert.zone.split("—")[0].trim()}</td>
                    <td className="px-4 py-3 font-mono">{startTime}</td>
                    <td className="px-4 py-3 font-mono">{endTime}</td>
                    <td className="px-4 py-3 font-medium">{alert.guard || "—"}</td>
                    <td className="px-4 py-3 font-mono text-success font-semibold">{isCancelled ? "—" : responseTime}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        isCancelled
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : "bg-success/10 text-success border-success/20"
                      )}>
                        {isCancelled ? <><XCircle className="w-3 h-3" /> Cancelada</> : <><CheckCircle2 className="w-3 h-3" /> Cerrada</>}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Mostrando {currentPage * POR_PAGINA + 1}–{Math.min((currentPage + 1) * POR_PAGINA, closedAlerts.length)} de {closedAlerts.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={cn("w-8 h-8 rounded-lg text-xs font-bold transition-colors",
                  i === currentPage ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage >= totalPages - 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
