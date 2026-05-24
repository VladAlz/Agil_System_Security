// ─── Tipos y datos de estadísticas para HU-07 ──────────────────────
export interface ZoneStat {
  name: string;
  color: string;
  total: number;
  active: number;
  resolved: number;
}

export interface DailyTrend {
  date: string;
  label: string;
  alerts: number;
  panic: number;
  medical: number;
  suspicious: number;
}

export interface HourlyTrend {
  hour: string;
  label: string;
  alerts: number;
}

export interface DayOfWeekStat {
  day: string;
  alerts: number;
  panic: number;
  medical: number;
}

export interface FacultyStat {
  facultad: string;
  total: number;
  panic: number;
  medical: number;
  suspicious: number;
}

export interface MonthlyTrend {
  month: string;
  label: string;
  alerts: number;
}

export interface AlertHistoryItem {
  id: string;
  code: string;
  usuario: string;
  facultad: string;
  tipo: string;
  estado: string;
  zona: string;
  fecha: string;
  guardia?: string;
}

// ─── Datos mock — en producción vendrán del Reports.Service ──────

export const ZONE_STATS: ZoneStat[] = [
  { name: "Zona 1 — FISEI",     color: "#0ea5e9", total: 28, active: 2,  resolved: 18 },
  { name: "Zona 2 — FCA",       color: "#eab308", total: 35, active: 1,  resolved: 24 },
  { name: "Zona 3 — Admón",     color: "#a855f7", total: 18, active: 0,  resolved: 14 },
  { name: "Zona 4 — Deportes",  color: "#22c55e", total: 22, active: 1,  resolved: 16 },
];

export const DAILY_TREND: DailyTrend[] = [
  { date: "2026-05-15", label: "15 may", alerts: 8,  panic: 3, medical: 2, suspicious: 3 },
  { date: "2026-05-16", label: "16 may", alerts: 12, panic: 5, medical: 4, suspicious: 3 },
  { date: "2026-05-17", label: "17 may", alerts: 6,  panic: 2, medical: 1, suspicious: 3 },
  { date: "2026-05-18", label: "18 may", alerts: 15, panic: 7, medical: 4, suspicious: 4 },
  { date: "2026-05-19", label: "19 may", alerts: 10, panic: 4, medical: 3, suspicious: 3 },
  { date: "2026-05-20", label: "20 may", alerts: 14, panic: 6, medical: 5, suspicious: 3 },
  { date: "2026-05-21", label: "21 may", alerts: 9,  panic: 4, medical: 3, suspicious: 2 },
];

// Alertas por hora del día (picos de actividad)
export const HOURLY_TREND: HourlyTrend[] = [
  { hour: "06:00", label: "06h", alerts: 2 },
  { hour: "07:00", label: "07h", alerts: 5 },
  { hour: "08:00", label: "08h", alerts: 8 },
  { hour: "09:00", label: "09h", alerts: 12 },
  { hour: "10:00", label: "10h", alerts: 15 },
  { hour: "11:00", label: "11h", alerts: 18 },
  { hour: "12:00", label: "12h", alerts: 22 },
  { hour: "13:00", label: "13h", alerts: 16 },
  { hour: "14:00", label: "14h", alerts: 20 },
  { hour: "15:00", label: "15h", alerts: 24 },
  { hour: "16:00", label: "16h", alerts: 19 },
  { hour: "17:00", label: "17h", alerts: 14 },
  { hour: "18:00", label: "18h", alerts: 10 },
  { hour: "19:00", label: "19h", alerts: 7 },
  { hour: "20:00", label: "20h", alerts: 11 },
  { hour: "21:00", label: "21h", alerts: 6 },
  { hour: "22:00", label: "22h", alerts: 3 },
  { hour: "23:00", label: "23h", alerts: 1 },
];

// Alertas por día de la semana
export const DAY_OF_WEEK_STATS: DayOfWeekStat[] = [
  { day: "Lunes",    alerts: 18, panic: 7,  medical: 5 },
  { day: "Martes",   alerts: 22, panic: 9,  medical: 6 },
  { day: "Miércoles",alerts: 25, panic: 11, medical: 7 },
  { day: "Jueves",   alerts: 20, panic: 8,  medical: 5 },
  { day: "Viernes",  alerts: 28, panic: 14, medical: 6 },
  { day: "Sábado",   alerts: 12, panic: 5,  medical: 3 },
  { day: "Domingo",  alerts: 8,  panic: 2,  medical: 2 },
];

// Facultades más afectadas
export const FACULTY_STATS: FacultyStat[] = [
  { facultad: "FISEI · Ing. Software",     total: 22, panic: 10, medical: 5,  suspicious: 7 },
  { facultad: "FISEI · Electrónica",       total: 15, panic: 6,  medical: 4,  suspicious: 5 },
  { facultad: "FISEI · Industrial",        total: 12, panic: 5,  medical: 3,  suspicious: 4 },
  { facultad: "FCA · Contabilidad",        total: 18, panic: 8,  medical: 5,  suspicious: 5 },
  { facultad: "FCA · Auditoría",           total: 10, panic: 4,  medical: 3,  suspicious: 3 },
  { facultad: "FCHE · Pedagogía",          total: 14, panic: 5,  medical: 5,  suspicious: 4 },
  { facultad: "FCHE · Psicología",         total: 8,  panic: 3,  medical: 3,  suspicious: 2 },
  { facultad: "FCHE · Inglés",             total: 6,  panic: 2,  medical: 2,  suspicious: 2 },
];

// Tendencia mensual
export const MONTHLY_TREND: MonthlyTrend[] = [
  { month: "2026-01", label: "Ene", alerts: 45 },
  { month: "2026-02", label: "Feb", alerts: 52 },
  { month: "2026-03", label: "Mar", alerts: 68 },
  { month: "2026-04", label: "Abr", alerts: 74 },
  { month: "2026-05", label: "May", alerts: 89 },
];

export const HISTORY_DATA: AlertHistoryItem[] = [
  { id: "1042", code: "ALT-1042", usuario: "Camila Reinoso",   facultad: "FISEI · Software",     tipo: "Pánico",   estado: "Activa",    zona: "Zona 1 — FISEI",     fecha: "20:42:11", guardia: undefined },
  { id: "1041", code: "ALT-1041", usuario: "Jorge Llerena",    facultad: "FCHE · Pedagogía",     tipo: "Médica",   estado: "Asumida",   zona: "Zona 1 — FISEI",     fecha: "20:39:02", guardia: "G. Ramírez" },
  { id: "1040", code: "ALT-1040", usuario: "Sofía Mena",       facultad: "FISEI · Electrónica",  tipo: "Sospecha", estado: "Activa",    zona: "Zona 3 — Querochaca", fecha: "20:36:20", guardia: undefined },
  { id: "1039", code: "ALT-1039", usuario: "Diego Salazar",    facultad: "FCA · Contabilidad",   tipo: "Pánico",   estado: "Cerrada",   zona: "Zona 4 — Centro",     fecha: "20:20:10", guardia: "L. Vinueza" },
  { id: "1038", code: "ALT-1038", usuario: "Ana Guilcapi",     facultad: "FISEI · Software",     tipo: "Pánico",   estado: "Resuelta",  zona: "Zona 2 — FCA",       fecha: "19:55:33", guardia: "M. Salazar" },
  { id: "1037", code: "ALT-1037", usuario: "Pedro Martínez",   facultad: "FCA · Auditoría",      tipo: "Sospecha", estado: "Cancelada", zona: "Zona 4 — Deportes",  fecha: "19:30:18", guardia: undefined },
  { id: "1036", code: "ALT-1036", usuario: "Lucía Córdova",    facultad: "FCHE · Psicología",    tipo: "Médica",   estado: "Resuelta",  zona: "Zona 3 — Admón",     fecha: "19:12:45", guardia: "P. Castillo" },
  { id: "1035", code: "ALT-1035", usuario: "Kevin Uribe",      facultad: "FISEI · Industrial",   tipo: "Pánico",   estado: "En Camino", zona: "Zona 1 — FISEI",     fecha: "18:50:02", guardia: "G. Ramírez" },
  { id: "1034", code: "ALT-1034", usuario: "María Jiménez",    facultad: "FCA · Contabilidad",   tipo: "Sospecha", estado: "Resuelta",  zona: "Zona 2 — FCA",       fecha: "18:22:10", guardia: "L. Vinueza" },
  { id: "1033", code: "ALT-1033", usuario: "Carlos Viñán",     facultad: "FISEI · Sistemas",     tipo: "Médica",   estado: "Cerrada",   zona: "Zona 1 — FISEI",     fecha: "17:45:30", guardia: "M. Salazar" },
  { id: "1032", code: "ALT-1032", usuario: "Diana Paredes",    facultad: "FCHE · Pedagogía",     tipo: "Pánico",   estado: "Resuelta",  zona: "Zona 4 — Deportes",  fecha: "17:10:55", guardia: "P. Castillo" },
  { id: "1031", code: "ALT-1031", usuario: "Esteban Mora",     facultad: "FCA · Auditoría",      tipo: "Sospecha", estado: "Cerrada",   zona: "Zona 3 — Admón",     fecha: "16:38:20", guardia: "L. Vinueza" },
];

// Totals derivados
export const SUMMARY_STATS = {
  totalAlertas: ZONE_STATS.reduce((s, z) => s + z.total, 0),
  activas: ZONE_STATS.reduce((s, z) => s + z.active, 0),
  resueltas: ZONE_STATS.reduce((s, z) => s + z.resolved, 0),
  enProceso: HISTORY_DATA.filter(h => h.estado === "Asumida" || h.estado === "En Camino").length,
  tiempoPromedio: "4m 32s",
  zonasMonitoreadas: ZONE_STATS.length,
};
