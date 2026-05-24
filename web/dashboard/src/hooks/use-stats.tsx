// ─── Hook useStats — Datos de estadísticas con fallback a mocks ───────────────
// Intenta cargar datos reales de Report.API. Si el backend no está disponible
// (en desarrollo sin servicios corriendo) muestra los datos mock de /data/statistics.ts
// Los consumidores del hook NO saben si los datos son reales o mock.

import { useState, useEffect, useCallback } from "react";
import {
  fetchDashboardStats,
  fetchZoneStats,
  fetchFacultyStats,
  fetchDailyTrend,
  fetchGuardPerformance,
  type DashboardStats,
  type ZoneStat,
  type FacultyStat,
  type DailyTrend,
  type GuardPerformance,
} from "@/services/reportService";

// ─── Fallback mock data (se usan cuando el backend no está disponible) ─────────
import {
  ZONE_STATS,
  DAILY_TREND as MOCK_DAILY_TREND,
  FACULTY_STATS,
  SUMMARY_STATS,
} from "@/data/statistics";

// ─── Tipos de salida del hook ──────────────────────────────────────────────────

export interface StatsState {
  loading: boolean;
  error: string | null;
  isLive: boolean;              // true = datos del backend, false = datos mock
  dashboard: DashboardStats;
  zoneStats: ZoneStat[];
  facultyStats: FacultyStat[];
  dailyTrend: DailyTrend[];
  guardPerformance: GuardPerformance[];
  reload: () => void;
}

// ─── Valores por defecto (mientras carga) ─────────────────────────────────────

const DEFAULT_DASHBOARD: DashboardStats = {
  totalAlertas: SUMMARY_STATS.totalAlertas,
  alertasHoy: SUMMARY_STATS.activas,          // aproximación: activas del día
  alertasActivas: SUMMARY_STATS.activas,
  alertasResueltas: SUMMARY_STATS.resueltas,
  tiempoRespuestaPromedio: 4.5,               // minutos — el mock usa string "4m 32s"
  totalGuardiasEnServicio: 0,
  totalTurnos: 12,
  turnosActivos: 4,
};

const DEFAULT_ZONE_STATS: ZoneStat[] = ZONE_STATS.map((z) => ({
  zonaId: z.id,
  zona: z.name,
  total: z.total,
  resueltas: z.resolved,
  activas: z.active,
  pctResolucion: z.total > 0 ? Math.round((z.resolved / z.total) * 100) : 0,
}));

const DEFAULT_FACULTY_STATS: FacultyStat[] = FACULTY_STATS.map((f) => ({
  facultad: f.facultad,
  total: f.total,
  resueltas: f.total - f.panic - f.medical,   // aproximación con datos mock
}));

const DEFAULT_DAILY_TREND: DailyTrend[] = MOCK_DAILY_TREND.map((d) => ({
  fecha: d.date,
  total: d.alerts,
  resueltas: Math.round(d.alerts * 0.6),
}));

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useStats(days = 30): StatsState {
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [isLive, setIsLive]                 = useState(false);
  const [dashboard, setDashboard]           = useState<DashboardStats>(DEFAULT_DASHBOARD);
  const [zoneStats, setZoneStats]           = useState<ZoneStat[]>(DEFAULT_ZONE_STATS);
  const [facultyStats, setFacultyStats]     = useState<FacultyStat[]>(DEFAULT_FACULTY_STATS);
  const [dailyTrend, setDailyTrend]         = useState<DailyTrend[]>(DEFAULT_DAILY_TREND);
  const [guardPerformance, setGuardPerf]    = useState<GuardPerformance[]>([]);
  const [tick, setTick]                     = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Lanzar todas las peticiones en paralelo para minimizar el tiempo de espera
        const [dash, zones, faculties, trend, guards] = await Promise.all([
          fetchDashboardStats(),
          fetchZoneStats(),
          fetchFacultyStats(),
          fetchDailyTrend(days),
          fetchGuardPerformance(),
        ]);

        if (cancelled) return;

        setDashboard(dash);
        setZoneStats(zones);
        setFacultyStats(faculties);
        setDailyTrend(trend);
        setGuardPerf(guards);
        setIsLive(true);
      } catch (err) {
        if (cancelled) return;
        // Backend no disponible → usar datos mock silenciosamente
        console.warn("[useStats] Backend no disponible, usando datos mock:", err);
        setIsLive(false);
        // Los estados ya tienen los defaults, no hay que resetearlos
        setError(null);   // No mostrar error al usuario en modo mock
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [days, tick]);

  return {
    loading,
    error,
    isLive,
    dashboard,
    zoneStats,
    facultyStats,
    dailyTrend,
    guardPerformance,
    reload,
  };
}
