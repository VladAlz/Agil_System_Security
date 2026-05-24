import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import {
  AlertTriangle, CheckCircle2, Clock, TrendingUp,
  Activity, Shield, ArrowLeft, Download, Filter,
  Search, ChevronLeft, ChevronRight, Sun, CalendarDays,
  GraduationCap, Building2, User2, Wifi, WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ZONE_STATS, DAILY_TREND, HISTORY_DATA, SUMMARY_STATS,
  HOURLY_TREND, DAY_OF_WEEK_STATS, FACULTY_STATS, MONTHLY_TREND,
  type AlertHistoryItem,
} from "@/data/statistics";
import { useStats } from "@/hooks/use-stats";

const STATUS_COLORS: Record<string, string> = {
  Activa: "#ef4444",
  Asumida: "#f97316",
  "En Camino": "#eab308",
  Resuelta: "#22c55e",
  Cerrada: "#6b7280",
  Cancelada: "#a855f7",
};

const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#6b7280", "#a855f7"];
const ROLE_COLORS = ["#0ea5e9", "#eab308", "#a855f7"];

// Helper para determinar el rol de un usuario basado en su nombre
const getUserRole = (userName: string): string => {
  if (userName.includes("Llerena")) return "Docente";
  if (userName.includes("Jiménez") || userName.includes("Mora") || userName.includes("Salazar")) return "Personal";
  return "Estudiante"; // Default
};

// Mapeo estático de tiempos de respuesta por guardia (en segundos)
const guardMapping: Record<string, number> = {
  "G. Ramírez": 240, // 4m 00s
  "L. Vinueza": 192, // 3m 12s
  "M. Salazar": 288, // 4m 48s
  "P. Castillo": 372, // 6m 12s
  "García R.": 358,  // 5m 58s
  "Pérez C.": 192,   // 3m 12s
  "López M.": 250,   // 4m 10s
  "Torres A.": 450,   // 7m 30s
};

// Función para descargar archivos CSV en el cliente
const downloadCSV = (data: any[], filename: string, headers: string[]) => {
  const csvRows = [];
  csvRows.push(headers.join(","));
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
      const escaped = stringVal.replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Tooltip personalizado para Recharts
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl px-4 py-3 shadow-xl text-sm">
      <p className="font-bold mb-1 text-foreground">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-medium" style={{ color: p.color || p.fill }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// Tarjeta de estadística rápida
const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  color,
  trend,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  trend?: "up" | "down" | "neutral";
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 hover:shadow-lg transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-black tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground/70 font-medium">{sub}</p>}
      </div>
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    {trend && (
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5">
        <TrendingUp className={cn(
          "w-3.5 h-3.5",
          trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
        )} />
        <span className={cn(
          "text-[11px] font-bold",
          trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
        )}>
          {trend === "up" ? "+12% vs ayer" : trend === "down" ? "-8% vs ayer" : "Sin cambios"}
        </span>
      </div>
    )}
  </motion.div>
);

export default function Statistics() {
  const navigate = useNavigate();
  const { dashboard, facultyStats: apiFacultyStats, dailyTrend: apiDailyTrend, isLive, loading: statsLoading } = useStats(30);

  // Estados de filtros temporales (antes de hacer clic en Aplicar)
  const [tempRangoFecha, setTempRangoFecha] = useState("mes");
  const [tempZona, setTempZona] = useState("");
  const [tempTipoPersona, setTempTipoPersona] = useState("");

  // Estados de filtros aplicados
  const [rangoFecha, setRangoFecha] = useState("mes");
  const [zona, setZona] = useState("");
  const [tipoPersona, setTipoPersona] = useState("");

  // Estado de filtros del historial (tabla inferior)
  const [tablaEstado, setTablaEstado] = useState("");
  const [tablaBusqueda, setTablaBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const POR_PAGINA = 5;

  const handleAplicar = () => {
    setRangoFecha(tempRangoFecha);
    setZona(tempZona);
    setTipoPersona(tempTipoPersona);
    setPagina(0);
  };

  // Datos de gráficos: usa API si disponible, si no usa mocks locales
  const activeFacultyData = useMemo(() => {
    if (isLive && apiFacultyStats.length > 0) {
      return apiFacultyStats.map(f => ({
        facultad: f.facultad,
        total: f.total,
        panic: Math.round(f.total * 0.45),   // distribución aproximada si no viene del backend
        medical: Math.round(f.total * 0.3),
        suspicious: f.total - Math.round(f.total * 0.45) - Math.round(f.total * 0.3),
      }));
    }
    return FACULTY_STATS.map(f => ({ facultad: f.facultad, total: f.total, panic: f.panic, medical: f.medical, suspicious: f.suspicious }));
  }, [isLive, apiFacultyStats]);

  const activeDailyTrend = useMemo(() => {
    if (isLive && apiDailyTrend.length > 0) {
      return apiDailyTrend.map(d => ({
        date: d.fecha,
        label: d.fecha.substring(5),   // MM-DD
        alerts: d.total,
        panic: Math.round(d.total * 0.45),
        medical: Math.round(d.total * 0.3),
        suspicious: d.total - Math.round(d.total * 0.45) - Math.round(d.total * 0.3),
      }));
    }
    return DAILY_TREND;
  }, [isLive, apiDailyTrend]);

  // ─── Filtrar incidentes según los filtros aplicados ───
  const filteredHistory = useMemo(() => {
    let items = [...HISTORY_DATA];

    // Filtro de Zona
    if (zona) {
      items = items.filter((h) => h.zona === zona);
    }

    // Filtro de Tipo de Persona
    if (tipoPersona) {
      items = items.filter((h) => getUserRole(h.usuario) === tipoPersona);
    }

    // Filtro de Fecha (Simulación)
    if (rangoFecha === "hoy") {
      items = items.filter((h) => h.fecha.startsWith("20:") || h.fecha.startsWith("19:") || h.fecha.startsWith("18:"));
    } else if (rangoFecha === "semana") {
      items = items.slice(0, Math.floor(items.length * 0.65));
    }

    return items;
  }, [zona, tipoPersona, rangoFecha]);

  // ─── Métricas dinámicas: usa datos reales del backend si están disponibles ───
  const metrics = useMemo(() => {
    if (isLive) {
      const avgMins = dashboard.tiempoRespuestaPromedio;
      const m = Math.floor(avgMins);
      const s = Math.round((avgMins - m) * 60);
      return {
        total: dashboard.totalAlertas,
        resolved: dashboard.alertasResueltas,
        active: dashboard.alertasActivas,
        avgText: `${m}m ${s}s`,
      };
    }
    // Fallback a métricas calculadas del historial mock
    const total = filteredHistory.length;
    const resolved = filteredHistory.filter((h) => h.estado === "Resuelta" || h.estado === "Cerrada").length;
    const active = filteredHistory.filter((h) => h.estado === "Activa" || h.estado === "Asumida" || h.estado === "En Camino").length;
    let avgText = "4m 32s";
    if (total > 0) {
      let totalSeconds = 0; let count = 0;
      filteredHistory.forEach(h => { if (h.guardia) { totalSeconds += guardMapping[h.guardia] || 250; count++; } });
      if (count > 0) { const avg = Math.round(totalSeconds / count); avgText = `${Math.floor(avg / 60)}m ${avg % 60}s`; }
    }
    return { total, resolved, active, avgText };
  }, [isLive, dashboard, filteredHistory]);

  // ─── Agrupación por Facultad: usa datos de la API si están disponibles ───
  const facultyData = useMemo(() => {
    if (isLive && activeFacultyData.length > 0) return activeFacultyData;

    const counts: Record<string, { total: number; panic: number; medical: number; suspicious: number }> = {};
    filteredHistory.forEach((h) => {
      const fac = h.facultad.split("\u00b7")[0].trim();
      if (!counts[fac]) counts[fac] = { total: 0, panic: 0, medical: 0, suspicious: 0 };
      counts[fac].total += 1;
      if (h.tipo === "P\u00e1nico") counts[fac].panic += 1;
      else if (h.tipo === "M\u00e9dica") counts[fac].medical += 1;
      else counts[fac].suspicious += 1;
    });
    return Object.entries(counts)
      .map(([facultad, val]) => ({ facultad, total: val.total, panic: val.panic, medical: val.medical, suspicious: val.suspicious }))
      .sort((a, b) => b.total - a.total);
  }, [isLive, activeFacultyData, filteredHistory]);

  // ─── Agrupación por Rol de Persona para el Gráfico de Dona ───
  const personTypeData = useMemo(() => {
    const counts: Record<string, number> = {
      Estudiante: 0,
      Docente: 0,
      Personal: 0,
    };
    
    filteredHistory.forEach((h) => {
      const role = getUserRole(h.usuario);
      if (counts[role] !== undefined) {
        counts[role] += 1;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((v) => v.value > 0);
  }, [filteredHistory]);

  // ─── Tiempos de respuesta por guardia calculados ───
  const guardStatsData = useMemo(() => {
    const stats: Record<string, { totalTime: number; count: number }> = {};
    
    filteredHistory.forEach((h) => {
      if (h.guardia) {
        const time = guardMapping[h.guardia] || 250;
        if (!stats[h.guardia]) {
          stats[h.guardia] = { totalTime: 0, count: 0 };
        }
        stats[h.guardia].totalTime += time;
        stats[h.guardia].count += 1;
      }
    });

    // Si está vacío, rellenar con mocks para que se vea completo
    if (Object.keys(stats).length === 0) {
      return [
        { name: "Pérez C.", responseTime: 192, label: "3m 12s" },
        { name: "López M.", responseTime: 250, label: "4m 10s" },
        { name: "García R.", responseTime: 358, label: "5m 58s" },
        { name: "Torres A.", responseTime: 450, label: "7m 30s" },
      ];
    }

    return Object.entries(stats).map(([name, val]) => {
      const avgSeconds = Math.round(val.totalTime / val.count);
      const mins = Math.floor(avgSeconds / 60);
      const secs = avgSeconds % 60;
      return {
        name,
        responseTime: avgSeconds,
        label: `${mins}m ${secs}s`,
      };
    }).sort((a, b) => a.responseTime - b.responseTime);
  }, [filteredHistory]);

  // ─── Filtrar la tabla de abajo ───
  const tableFilteredHistory = useMemo(() => {
    let items = [...filteredHistory];
    
    if (tablaEstado) {
      items = items.filter((h) => h.estado === tablaEstado);
    }
    
    if (tablaBusqueda) {
      const q = tablaBusqueda.toLowerCase();
      items = items.filter((h) =>
        h.usuario.toLowerCase().includes(q) ||
        h.code.toLowerCase().includes(q)
      );
    }
    
    return items;
  }, [filteredHistory, tablaEstado, tablaBusqueda]);

  const totalPaginas = Math.max(1, Math.ceil(tableFilteredHistory.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const paginados = tableFilteredHistory.slice(paginaActual * POR_PAGINA, (paginaActual + 1) * POR_PAGINA);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center gap-4 px-6 h-16 max-w-7xl mx-auto w-full">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-750 flex items-center justify-center transition-colors border border-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">Estadísticas &amp; Reportes</h1>
            <p className="text-xs text-slate-400 font-medium">
              Indicadores históricos y de desempeño S.S.I.U. · Campus Huachi
            </p>
          </div>
          {/* Badge de estado de conexión con el backend */}
          <div className={cn(
            "ml-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
            isLive
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "bg-slate-700/50 text-slate-400 border border-slate-600/30"
          )}>
            {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isLive ? "LIVE" : "DEMO"}
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV(filteredHistory, "reporte_incidentes_general.csv", ["id", "code", "usuario", "facultad", "tipo", "estado", "zona", "fecha", "guardia"])}
              className="gap-2 rounded-xl text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
            >
              <Download className="w-3.5 h-3.5" /> Exportar Reporte
            </Button>
          </div>
        </div>
      </header>

      {/* Top Filters Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800 p-4 shrink-0 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Filtros:</span>
          </div>
          
          {/* Rango de Fecha */}
          <select
            value={tempRangoFecha}
            onChange={(e) => setTempRangoFecha(e.target.value)}
            className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold outline-none focus:border-destructive/40 cursor-pointer text-slate-200"
          >
            <option value="mes">Último mes</option>
            <option value="semana">Última semana</option>
            <option value="hoy">Hoy</option>
          </select>

          {/* Zonas */}
          <select
            value={tempZona}
            onChange={(e) => setTempZona(e.target.value)}
            className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold outline-none focus:border-destructive/40 cursor-pointer text-slate-200"
          >
            <option value="">Todas las zonas</option>
            <option value="Zona 1 — FISEI">Zona 1 — FISEI</option>
            <option value="Zona 2 — FCA">Zona 2 — FCA</option>
            <option value="Zona 3 — Admón">Zona 3 — Admón</option>
            <option value="Zona 4 — Deportes">Zona 4 — Deportes</option>
          </select>

          {/* Tipo de Persona */}
          <select
            value={tempTipoPersona}
            onChange={(e) => setTempTipoPersona(e.target.value)}
            className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold outline-none focus:border-destructive/40 cursor-pointer text-slate-200"
          >
            <option value="">Todos los tipos</option>
            <option value="Estudiante">Estudiantes</option>
            <option value="Docente">Docentes</option>
            <option value="Personal">Personal</option>
          </select>

          {/* Botón Aplicar */}
          <Button 
            onClick={handleAplicar}
            className="h-9 px-5 bg-destructive hover:bg-destructive/90 text-white font-bold text-xs rounded-lg transition-all shadow-lg shadow-destructive/10"
          >
            Aplicar Filtros
          </Button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6 w-full flex-1">
        {/* ── Tarjetas resumen ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={AlertTriangle}
            label="Total Alertas"
            value={metrics.total}
            sub={`Filtradas en periodo`}
            color="bg-primary"
            trend="neutral"
          />
          <StatCard
            icon={Activity}
            label="En Proceso"
            value={metrics.active}
            sub="Acciones en curso"
            color="bg-destructive"
            trend="neutral"
          />
          <StatCard
            icon={CheckCircle2}
            label="Resueltas / Cerradas"
            value={metrics.resolved}
            sub="Emergencias controladas"
            color="bg-success"
            trend="up"
          />
          <StatCard
            icon={Clock}
            label="T. Resp. Promedio"
            value={metrics.avgText}
            sub="Tiempo de reacción"
            color="bg-secondary"
            trend="down"
          />
        </div>

        {/* ── Fila 1 (Mockup 9): 3 Columnas principales ── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* C1: Incidentes por Facultad */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-destructive" />
                  <h3 className="text-sm font-black tracking-wider text-white">Incidentes por Facultad</h3>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => downloadCSV(facultyData, "incidentes_facultad.csv", ["facultad", "total", "panic", "medical", "suspicious"])}
                  className="text-[10px] h-7 px-2 border border-slate-800 hover:bg-slate-800 text-slate-300"
                >
                  <Download className="w-3 h-3 mr-1" /> Exportar CSV
                </Button>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mb-4">
                Frecuencia y tipos de alerta por sector académico
              </p>
            </div>
            
            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={facultyData} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="facultad"
                    tick={{ fontSize: 9, fontWeight: 600, fill: "#94a3b8" }}
                    width={90}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="panic" name="Pánico" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="medical" name="Médica" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="suspicious" name="Sospecha" stackId="a" fill="#eab308" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* C2: Distribución por Tipo de Persona */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <User2 className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-black tracking-wider text-white">Por Tipo de Persona</h3>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => downloadCSV(personTypeData, "distribucion_roles.csv", ["name", "value"])}
                  className="text-[10px] h-7 px-2 border border-slate-800 hover:bg-slate-800 text-slate-300"
                >
                  <Download className="w-3 h-3 mr-1" /> Exportar CSV
                </Button>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mb-4">
                Distribución de usuarios afectados por el incidente
              </p>
            </div>

            <div className="flex items-center justify-center h-64 gap-4 mt-2">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={personTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {personTypeData.map((entry, i) => (
                      <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 shrink-0">
                {personTypeData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: ROLE_COLORS[i % ROLE_COLORS.length] }}
                    />
                    <span className="text-[11px] font-medium text-slate-400">{entry.name}</span>
                    <span className="text-[11px] font-bold text-white">({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* C3: Tiempo de Respuesta por Guardia */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success" />
                  <h3 className="text-sm font-black tracking-wider text-white">Respuesta por Guardia</h3>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => downloadCSV(guardStatsData, "tiempos_respuesta_guardia.csv", ["name", "responseTime", "label"])}
                  className="text-[10px] h-7 px-2 border border-slate-800 hover:bg-slate-800 text-slate-300"
                >
                  <Download className="w-3 h-3 mr-1" /> Exportar CSV
                </Button>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mb-4">
                Tiempo de respuesta promedio por personal asignado
              </p>
            </div>

            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={guardStatsData} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis type="number" name="Segundos" tickFormatter={(v) => `${Math.floor(v/60)}m`} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 9, fontWeight: 600, fill: "#94a3b8" }}
                    width={90}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="responseTime" name="Tiempo de Respuesta" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* ── Fila 2: Alertas por hora + Tendencia temporal ── */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Alertas por hora del día */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black tracking-wider text-white">Alertas por Hora del Día</h3>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => downloadCSV(HOURLY_TREND, "alertas_por_hora.csv", ["hour", "alerts"])}
                className="text-[10px] h-7 px-2 border border-slate-800 hover:bg-slate-800 text-slate-300"
              >
                <Download className="w-3 h-3 mr-1" /> Exportar CSV
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mb-4">
              Distribución horaria para detectar picos críticos
            </p>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HOURLY_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="alerts" name="Alertas" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tendencia en el Tiempo — usa datos API si están disponibles */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black tracking-wider text-white">Evolución en el Tiempo</h3>
                {isLive && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">LIVE</span>}
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => downloadCSV(activeDailyTrend, "tendencia_diaria.csv", ["date", "alerts", "panic", "medical", "suspicious"])}
                className="text-[10px] h-7 px-2 border border-slate-800 hover:bg-slate-800 text-slate-300"
              >
                <Download className="w-3 h-3 mr-1" /> Exportar CSV
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mb-4">
              Evolución diaria de llamadas y botones de pánico
            </p>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeDailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="alerts" name="Total" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="panic" name="Pánico" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="medical" name="Médica" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Historial y Detalle del Reporte (Tabla) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden"
        >
          <div className="p-5 pb-0 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black tracking-wider text-white">Listado Histórico Detallado</h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {tableFilteredHistory.length} incidentes filtrados en total
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={tablaEstado}
                  onChange={(e) => setTablaEstado(e.target.value)}
                  className="h-8 px-3 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold outline-none text-slate-200"
                >
                  <option value="">Cualquier estado</option>
                  <option value="Activa">Activa</option>
                  <option value="Asumida">Asumida</option>
                  <option value="En Camino">En Camino</option>
                  <option value="Resuelta">Resuelta</option>
                  <option value="Cerrada">Cerrada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
                
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    value={tablaBusqueda}
                    onChange={(e) => setTablaBusqueda(e.target.value)}
                    placeholder="Filtrar por estudiante..."
                    className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-800 border border-slate-700 text-xs outline-none text-slate-200 focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-y border-slate-800 bg-slate-900 font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Estudiante</th>
                  <th className="px-4 py-3">Facultad</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Zona de Incidencia</th>
                  <th className="px-4 py-3">Guardia Encargado</th>
                  <th className="px-4 py-3">Hora Incidente</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {paginados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500 text-xs font-medium">
                      No se encontraron registros con los filtros actuales
                    </td>
                  </tr>
                ) : (
                  paginados.map((item, i) => (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b border-slate-850 hover:bg-slate-800/30 transition-colors",
                        i % 2 === 0 ? "bg-transparent" : "bg-slate-850/10"
                      )}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-bold text-destructive">{item.code}</td>
                      <td className="px-4 py-3 font-semibold text-white">{item.usuario}</td>
                      <td className="px-4 py-3 text-slate-400">{item.facultad}</td>
                      <td className="px-4 py-3 text-slate-300 font-medium">{item.tipo}</td>
                      <td className="px-4 py-3 text-slate-400">{item.zona}</td>
                      <td className="px-4 py-3 text-slate-300 font-semibold">{item.guardia || "—"}</td>
                      <td className="px-4 py-3 font-mono">{item.fecha}</td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: `${STATUS_COLORS[item.estado] || "#6b7280"}15`,
                            color: STATUS_COLORS[item.estado] || "#6b7280",
                            borderColor: `${STATUS_COLORS[item.estado] || "#6b7280"}30`,
                          }}
                        >
                          {item.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/30">
              <p className="text-xs text-slate-400 font-medium">
                Mostrando {paginaActual * POR_PAGINA + 1}–{Math.min((paginaActual + 1) * POR_PAGINA, tableFilteredHistory.length)} de {tableFilteredHistory.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina(Math.max(0, paginaActual - 1))}
                  disabled={paginaActual === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 transition-colors text-slate-400"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPagina(i)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold transition-colors",
                      i === paginaActual
                        ? "bg-destructive text-white"
                        : "hover:bg-slate-800 text-slate-400"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPagina(Math.min(totalPaginas - 1, paginaActual + 1))}
                  disabled={paginaActual >= totalPaginas - 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 transition-colors text-slate-400"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
