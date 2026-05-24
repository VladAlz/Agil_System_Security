namespace Report.API.Dtos
{
    // ─── Input DTOs ───────────────────────────────────────────────────────────

    /// <summary>Abre un nuevo turno de guardia (HU-08).</summary>
    public class CreateShiftReportDto
    {
        public int    GuardiaId     { get; set; }
        public string NombreGuardia { get; set; } = string.Empty;
        public int    ZonaId        { get; set; }
        public string NombreZona    { get; set; } = string.Empty;
        public string Observaciones { get; set; } = string.Empty;
    }

    /// <summary>Cierra un turno activo con las métricas finales.</summary>
    public class CloseShiftReportDto
    {
        public int    AlertasAtendidas          { get; set; }
        public int    AlertasResueltas          { get; set; }
        public double TiempoRespuestaPromedio   { get; set; }
        public string Observaciones             { get; set; } = string.Empty;
    }

    // ─── Output / Aggregate DTOs ─────────────────────────────────────────────

    /// <summary>Resumen de estadísticas generales para el dashboard (HU-07).</summary>
    public class DashboardStatsDto
    {
        public int    TotalAlertas             { get; set; }
        public int    AlertasHoy               { get; set; }
        public int    AlertasActivas           { get; set; }
        public int    AlertasResueltas         { get; set; }
        public double TiempoRespuestaPromedio  { get; set; }   // minutos
        public int    TotalGuardiasEnServicio  { get; set; }
        public int    TotalTurnos              { get; set; }
        public int    TurnosActivos            { get; set; }
    }

    /// <summary>Estadísticas de alertas agrupadas por zona.</summary>
    public class ZoneStatsDto
    {
        public int    ZonaId    { get; set; }
        public string Zona      { get; set; } = string.Empty;
        public int    Total     { get; set; }
        public int    Resueltas { get; set; }
        public int    Activas   { get; set; }
        public double PctResolucion { get; set; }
    }

    /// <summary>Estadísticas de alertas agrupadas por facultad.</summary>
    public class FacultyStatsDto
    {
        public string Facultad  { get; set; } = string.Empty;
        public int    Total     { get; set; }
        public int    Resueltas { get; set; }
    }

    /// <summary>Serie temporal de alertas por día para el gráfico de tendencia.</summary>
    public class DailyTrendDto
    {
        public string Fecha    { get; set; } = string.Empty;   // yyyy-MM-dd
        public int    Total    { get; set; }
        public int    Resueltas { get; set; }
    }

    /// <summary>
    /// Reporte de rendimiento de un guardia individual (HU-08).
    /// </summary>
    public class GuardPerformanceDto
    {
        public int    GuardiaId              { get; set; }
        public string NombreGuardia          { get; set; } = string.Empty;
        public int    TotalAlertas           { get; set; }
        public int    AlertasResueltas       { get; set; }
        public double TiempoRespuestaPromedio { get; set; }
        public int    TotalTurnos            { get; set; }
    }
}
