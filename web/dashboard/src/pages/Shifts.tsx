// ─── Shifts.tsx — Gestión de Turnos de Guardia (HU-08) ──────────────────────
// Vista completa de los turnos: tabla paginada, apertura y cierre de turnos,
// filtros por zona/guardia/estado y exportación CSV.

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Shield, Clock, CheckCircle2, XCircle, Plus, ArrowLeft,
  Download, Search, ChevronLeft, ChevronRight, Activity,
  ClipboardList, Timer, TrendingUp, X, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchShiftReports, createShiftReport, closeShiftReport, type ShiftReport } from "@/services/reportService";
import { useStats } from "@/hooks/use-stats";

// ─── Descarga CSV ─────────────────────────────────────────────────────────────
function downloadCSV(rows: ShiftReport[], filename: string) {
  if (!rows.length) return;
  const headers = ["ID", "Guardia", "Zona", "Inicio Turno", "Fin Turno", "Alertas Atendidas", "Alertas Resueltas", "T. Respuesta (min)", "Estado", "Observaciones"];
  const lines = rows.map(r => [
    r.id, r.nombreGuardia, r.nombreZona,
    r.inicioTurno, r.finTurno ?? "—",
    r.alertasAtendidas, r.alertasResueltas,
    r.tiempoRespuestaPromedio.toFixed(1), r.estado, r.observaciones
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
  const csv = [headers.join(","), ...lines].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Utilidades de formato ────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-EC", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function formatDuration(inicio: string, fin?: string | null) {
  if (!fin) return "En curso…";
  const diffMs  = new Date(fin).getTime() - new Date(inicio).getTime();
  const hours   = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

// ─── Modal para abrir turno ───────────────────────────────────────────────────
interface OpenShiftModalProps {
  onClose:  () => void;
  onSubmit: (dto: { guardiaId: number; nombreGuardia: string; zonaId: number; nombreZona: string; observaciones?: string }) => Promise<void>;
  loading:  boolean;
}

const ZONAS = [
  { id: 1, nombre: "Zona 1 — FISEI" },
  { id: 2, nombre: "Zona 2 — FCA" },
  { id: 3, nombre: "Zona 3 — Administración" },
  { id: 4, nombre: "Zona 4 — Deportes" },
];

function OpenShiftModal({ onClose, onSubmit, loading }: OpenShiftModalProps) {
  const [guardiaId, setGuardiaId]         = useState("");
  const [nombreGuardia, setNombreGuardia] = useState("");
  const [zonaId, setZonaId]               = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [err, setErr]                     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardiaId || !nombreGuardia || !zonaId) { setErr("Todos los campos obligatorios son requeridos."); return; }
    const zona = ZONAS.find(z => z.id === parseInt(zonaId));
    if (!zona) { setErr("Zona inválida."); return; }
    setErr("");
    await onSubmit({ guardiaId: parseInt(guardiaId), nombreGuardia, zonaId: zona.id, nombreZona: zona.nombre, observaciones });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-black text-white">Abrir Nuevo Turno</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {err && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID Guardia *</label>
              <input
                value={guardiaId}
                onChange={e => setGuardiaId(e.target.value)}
                type="number" min="1"
                placeholder="Ej: 3"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nombre Guardia *</label>
              <input
                value={nombreGuardia}
                onChange={e => setNombreGuardia(e.target.value)}
                placeholder="Ej: G. Ramírez"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Zona Asignada *</label>
            <select
              value={zonaId}
              onChange={e => setZonaId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">Seleccionar zona…</option>
              {ZONAS.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Notas opcionales para este turno…"
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-slate-700 hover:bg-slate-800 text-white">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              {loading ? "Abriendo…" : "Abrir Turno"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Modal para cerrar turno ──────────────────────────────────────────────────
interface CloseShiftModalProps {
  shift:    ShiftReport;
  onClose:  () => void;
  onSubmit: (id: number, dto: { alertasAtendidas: number; alertasResueltas: number; tiempoRespuestaPromedio: number; observaciones?: string }) => Promise<void>;
  loading:  boolean;
}

function CloseShiftModal({ shift, onClose, onSubmit, loading }: CloseShiftModalProps) {
  const [atendidas, setAtendidas]   = useState(String(shift.alertasAtendidas || 0));
  const [resueltas, setResueltas]   = useState(String(shift.alertasResueltas || 0));
  const [tiempoResp, setTiempoResp] = useState("0");
  const [observaciones, setObservaciones] = useState(shift.observaciones || "");
  const [err, setErr]               = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const at = parseInt(atendidas), rs = parseInt(resueltas), tr = parseFloat(tiempoResp);
    if (isNaN(at) || isNaN(rs) || isNaN(tr)) { setErr("Todos los campos numéricos son requeridos."); return; }
    if (rs > at) { setErr("Las alertas resueltas no pueden ser más que las atendidas."); return; }
    setErr("");
    await onSubmit(shift.id, { alertasAtendidas: at, alertasResueltas: rs, tiempoRespuestaPromedio: tr, observaciones });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <h2 className="text-base font-black text-white">Cerrar Turno #{shift.id}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-3 text-xs text-slate-300 space-y-1">
          <p><span className="text-slate-500">Guardia:</span> {shift.nombreGuardia}</p>
          <p><span className="text-slate-500">Zona:</span> {shift.nombreZona}</p>
          <p><span className="text-slate-500">Duración:</span> {formatDuration(shift.inicioTurno, null)}</p>
        </div>

        {err && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Atendidas</label>
              <input value={atendidas} onChange={e => setAtendidas(e.target.value)} type="number" min="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resueltas</label>
              <input value={resueltas} onChange={e => setResueltas(e.target.value)} type="number" min="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">T. Respuesta (min)</label>
              <input value={tiempoResp} onChange={e => setTiempoResp(e.target.value)} type="number" min="0" step="0.1"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Observaciones finales</label>
            <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2}
              placeholder="Notas o incidencias del turno…"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500 transition-colors resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-slate-700 hover:bg-slate-800 text-white">Cancelar</Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold">
              {loading ? "Cerrando…" : "Cerrar Turno"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Shifts() {
  const navigate = useNavigate();
  const { guardPerformance, reload: reloadStats } = useStats();

  const [shifts, setShifts]             = useState<ShiftReport[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [closingShift, setClosingShift]  = useState<ShiftReport | null>(null);

  // Filtros
  const [search, setSearch]     = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [page, setPage]         = useState(0);
  const POR_PAGINA = 8;

  // ── Cargar turnos ─────────────────────────────────────────────────────────
  const loadShifts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchShiftReports();
      setShifts(data);
    } catch (e: any) {
      setError(e.message || "No se pudieron cargar los turnos");
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial
  useState(() => { loadShifts(); });

  // ── Filtrado local ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let s = [...shifts];
    if (filterEstado) s = s.filter(r => r.estado === filterEstado);
    if (search) {
      const q = search.toLowerCase();
      s = s.filter(r =>
        r.nombreGuardia.toLowerCase().includes(q) ||
        r.nombreZona.toLowerCase().includes(q) ||
        String(r.id).includes(q)
      );
    }
    return s;
  }, [shifts, filterEstado, search]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / POR_PAGINA));
  const currentPage = Math.min(page, totalPages - 1);
  const paginated   = filtered.slice(currentPage * POR_PAGINA, (currentPage + 1) * POR_PAGINA);

  // ── Métricas rápidas ──────────────────────────────────────────────────────
  const summaryCards = [
    { icon: ClipboardList, label: "Total Turnos",   value: shifts.length,                                              color: "text-sky-400",     bg: "bg-sky-500/15" },
    { icon: Activity,      label: "Activos Ahora",  value: shifts.filter(r => r.estado === "Activo").length,           color: "text-emerald-400", bg: "bg-emerald-500/15" },
    { icon: CheckCircle2,  label: "Cerrados Hoy",   value: shifts.filter(r => r.estado === "Cerrado").length,          color: "text-purple-400",  bg: "bg-purple-500/15" },
    {
      icon:  Timer,
      label: "T. Respuesta Prom.",
      value: guardPerformance.length > 0
        ? `${(guardPerformance.reduce((s, g) => s + g.tiempoRespuestaPromedio, 0) / guardPerformance.length).toFixed(1)}m`
        : "—",
      color: "text-amber-400", bg: "bg-amber-500/15"
    },
  ];

  // ── Abrir turno ───────────────────────────────────────────────────────────
  const handleOpenShift = async (dto: Parameters<typeof createShiftReport>[0]) => {
    setActionLoading(true);
    try {
      const nuevo = await createShiftReport(dto);
      setShifts(prev => [nuevo, ...prev]);
      setShowOpenModal(false);
      reloadStats();
    } catch (e: any) {
      alert(e.message || "Error al abrir turno");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Cerrar turno ──────────────────────────────────────────────────────────
  const handleCloseShift = async (id: number, dto: Parameters<typeof closeShiftReport>[1]) => {
    setActionLoading(true);
    try {
      const updated = await closeShiftReport(id, dto);
      setShifts(prev => prev.map(r => r.id === id ? updated : r));
      setClosingShift(null);
      reloadStats();
    } catch (e: any) {
      alert(e.message || "Error al cerrar turno");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-sans">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center gap-4 px-6 h-16 max-w-7xl mx-auto w-full">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors border border-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">Gestión de Turnos</h1>
            <p className="text-xs text-slate-400 font-medium">Apertura, cierre y métricas de turno de guardias · HU-08</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV(filtered, "turnos_guardias.csv")}
              className="gap-2 rounded-xl text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
            >
              <Download className="w-3.5 h-3.5" /> Exportar CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setShowOpenModal(true)}
              className="gap-2 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Abrir Turno
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── Métricas rápidas ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map(c => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 flex items-center gap-4"
            >
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", c.bg)}>
                <c.icon className={cn("w-5 h-5", c.color)} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{c.label}</p>
                <p className="text-2xl font-black text-white">{c.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Ranking de guardias ─────────────────────────────────────────── */}
        {guardPerformance.length > 0 && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-black tracking-wider text-white">Ranking de Guardias</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {guardPerformance.slice(0, 6).map((g, i) => (
                <div key={g.guardiaId} className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                    i === 0 ? "bg-amber-500/20 text-amber-400" :
                    i === 1 ? "bg-slate-500/20 text-slate-300" :
                    i === 2 ? "bg-orange-700/20 text-orange-500" :
                    "bg-slate-700/30 text-slate-500"
                  )}>
                    #{i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{g.nombreGuardia}</p>
                    <p className="text-[10px] text-slate-400">
                      {g.alertasResueltas} resueltas · {g.tiempoRespuestaPromedio.toFixed(1)}m prom.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Filtros ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Buscar por guardia, zona o ID…"
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
          <select
            value={filterEstado}
            onChange={e => { setFilterEstado(e.target.value); setPage(0); }}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Cerrado">Cerrado</option>
          </select>
          <Button variant="ghost" size="sm" onClick={loadShifts} disabled={loading}
            className="text-xs border border-slate-700 hover:bg-slate-800 text-slate-300">
            {loading ? "Cargando…" : "↻ Actualizar"}
          </Button>
        </div>

        {/* ── Tabla de turnos ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-800 overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-sm font-semibold">{error}</p>
              <Button size="sm" onClick={loadShifts} className="mt-2 bg-sky-600 hover:bg-sky-500 text-white text-xs">Reintentar</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900 font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Guardia</th>
                    <th className="px-4 py-3">Zona</th>
                    <th className="px-4 py-3">Inicio Turno</th>
                    <th className="px-4 py-3">Fin Turno</th>
                    <th className="px-4 py-3 text-center">Alertas</th>
                    <th className="px-4 py-3 text-center">Resueltas</th>
                    <th className="px-4 py-3 text-center">T. Respuesta</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-800/50">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-3 bg-slate-800 rounded animate-pulse" style={{ width: `${40 + Math.random() * 60}%` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-500">
                        {search || filterEstado ? "No se encontraron turnos con esos filtros" : "No hay turnos registrados aún"}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((shift, i) => (
                      <tr key={shift.id}
                        className={cn("border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors", i % 2 === 1 && "bg-slate-900/30")}>
                        <td className="px-4 py-3 font-mono font-bold text-sky-400">#{shift.id}</td>
                        <td className="px-4 py-3 font-semibold text-white">{shift.nombreGuardia}</td>
                        <td className="px-4 py-3 text-slate-300">{shift.nombreZona}</td>
                        <td className="px-4 py-3 font-mono text-slate-300">{formatDate(shift.inicioTurno)}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {shift.finTurno ? formatDate(shift.finTurno) : (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                              En curso
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-white">{shift.alertasAtendidas}</td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-400">{shift.alertasResueltas}</td>
                        <td className="px-4 py-3 text-center font-mono text-amber-400">
                          {shift.tiempoRespuestaPromedio > 0 ? `${shift.tiempoRespuestaPromedio.toFixed(1)}m` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            shift.estado === "Activo"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-slate-600/20 text-slate-400 border-slate-600/30"
                          )}>
                            {shift.estado === "Activo"
                              ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Activo</>
                              : <><CheckCircle2 className="w-3 h-3" /> Cerrado</>
                            }
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {shift.estado === "Activo" ? (
                            <Button size="sm" variant="outline"
                              onClick={() => setClosingShift(shift)}
                              className="text-[10px] h-7 px-2.5 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/60">
                              <XCircle className="w-3 h-3 mr-1" /> Cerrar
                            </Button>
                          ) : (
                            <span className="text-[10px] text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Paginación ───────────────────────────────────────────────────── */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Mostrando {currentPage * POR_PAGINA + 1}–{Math.min((currentPage + 1) * POR_PAGINA, filtered.length)} de {filtered.length} turnos
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={cn("w-8 h-8 rounded-lg text-xs font-bold transition-colors",
                    i === currentPage ? "bg-sky-600 text-white" : "hover:bg-slate-800 text-slate-400")}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Modales ─────────────────────────────────────────────────────────── */}
      {showOpenModal && (
        <OpenShiftModal
          onClose={() => setShowOpenModal(false)}
          onSubmit={handleOpenShift}
          loading={actionLoading}
        />
      )}
      {closingShift && (
        <CloseShiftModal
          shift={closingShift}
          onClose={() => setClosingShift(null)}
          onSubmit={handleCloseShift}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
