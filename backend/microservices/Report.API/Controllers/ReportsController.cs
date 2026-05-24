using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Report.API.Data;
using Report.API.Dtos;
using Report.API.Models;

namespace Report.API.Controllers
{
    // ═══════════════════════════════════════════════════════════════════════════
    // POST  api/reports           — Abre un turno de guardia  (HU-08)
    // GET   api/reports           — Lista todos los turnos
    // GET   api/reports/{id}      — Obtiene un turno por ID
    // PUT   api/reports/{id}/close— Cierra un turno activo    (HU-08)
    // ═══════════════════════════════════════════════════════════════════════════

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]                    // ← Seguridad: requiere JWT válido
    public class ReportsController : ControllerBase
    {
        private readonly ReportDbContext _context;

        public ReportsController(ReportDbContext context)
        {
            _context = context;
        }

        // ───────────────────────────────────────────────────────────────────
        // POST api/reports — Crear / abrir un turno de guardia
        // ───────────────────────────────────────────────────────────────────

        /// <summary>
        /// Abre un nuevo turno de guardia (HU-08).
        /// Un guardia solo puede tener un turno "Activo" a la vez.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] CreateShiftReportDto dto)
        {
            // Regla de negocio: un guardia no puede tener dos turnos activos
            var turnoActivo = await _context.ShiftReports
                .AnyAsync(r => r.GuardiaId == dto.GuardiaId && r.Estado == "Activo");

            if (turnoActivo)
                return Conflict(new
                {
                    mensaje = $"El guardia {dto.GuardiaId} ya tiene un turno activo. Ciérralo antes de abrir uno nuevo."
                });

            var reporte = new ShiftReport
            {
                GuardiaId     = dto.GuardiaId,
                NombreGuardia = dto.NombreGuardia,
                ZonaId        = dto.ZonaId,
                NombreZona    = dto.NombreZona,
                Observaciones = dto.Observaciones,
                InicioTurno   = DateTime.UtcNow,
                Estado        = "Activo"
            };

            _context.ShiftReports.Add(reporte);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetReportById), new { id = reporte.Id }, reporte);
        }

        // ───────────────────────────────────────────────────────────────────
        // GET api/reports
        // ───────────────────────────────────────────────────────────────────

        /// <summary>Lista todos los turnos de guardia, más recientes primero.</summary>
        [HttpGet]
        public async Task<IActionResult> GetReports(
            [FromQuery] int?    zonaId      = null,
            [FromQuery] int?    guardiaId   = null,
            [FromQuery] string? estado      = null,
            [FromQuery] string? fechaDesde  = null,
            [FromQuery] string? fechaHasta  = null)
        {
            var query = _context.ShiftReports.AsQueryable();

            if (zonaId.HasValue)
                query = query.Where(r => r.ZonaId == zonaId.Value);

            if (guardiaId.HasValue)
                query = query.Where(r => r.GuardiaId == guardiaId.Value);

            if (!string.IsNullOrEmpty(estado))
                query = query.Where(r => r.Estado == estado);

            if (DateTime.TryParse(fechaDesde, out var desde))
                query = query.Where(r => r.InicioTurno >= desde);

            if (DateTime.TryParse(fechaHasta, out var hasta))
                query = query.Where(r => r.InicioTurno <= hasta.AddDays(1));

            var reportes = await query
                .OrderByDescending(r => r.InicioTurno)
                .ToListAsync();

            return Ok(reportes);
        }

        // ───────────────────────────────────────────────────────────────────
        // GET api/reports/{id}
        // ───────────────────────────────────────────────────────────────────

        /// <summary>Obtiene un turno específico por ID.</summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetReportById(int id)
        {
            var reporte = await _context.ShiftReports.FindAsync(id);
            if (reporte == null)
                return NotFound(new { mensaje = "Turno no encontrado" });

            return Ok(reporte);
        }

        // ───────────────────────────────────────────────────────────────────
        // PUT api/reports/{id}/close — Cierra un turno activo
        // ───────────────────────────────────────────────────────────────────

        /// <summary>
        /// Cierra un turno activo registrando las métricas finales (HU-08).
        /// </summary>
        [HttpPut("{id:int}/close")]
        public async Task<IActionResult> CloseReport(int id, [FromBody] CloseShiftReportDto dto)
        {
            var reporte = await _context.ShiftReports.FindAsync(id);
            if (reporte == null)
                return NotFound(new { mensaje = "Turno no encontrado" });

            if (reporte.Estado != "Activo")
                return BadRequest(new
                {
                    mensaje = $"No se puede cerrar un turno en estado '{reporte.Estado}'. Debe estar 'Activo'."
                });

            reporte.FinTurno                  = DateTime.UtcNow;
            reporte.AlertasAtendidas          = dto.AlertasAtendidas;
            reporte.AlertasResueltas          = dto.AlertasResueltas;
            reporte.TiempoRespuestaPromedio   = dto.TiempoRespuestaPromedio;
            reporte.Observaciones             = dto.Observaciones;
            reporte.Estado                    = "Cerrado";

            await _context.SaveChangesAsync();

            return Ok(reporte);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GET api/stats/...  — Endpoints de estadísticas para el Dashboard (HU-07)
    // ═══════════════════════════════════════════════════════════════════════════

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StatsController : ControllerBase
    {
        private readonly ReportDbContext _context;
        private readonly IHttpClientFactory _httpFactory;
        private readonly IConfiguration _config;

        public StatsController(
            ReportDbContext context,
            IHttpClientFactory httpFactory,
            IConfiguration config)
        {
            _context     = context;
            _httpFactory = httpFactory;
            _config      = config;
        }

        // ───────────────────────────────────────────────────────────────────
        // GET api/stats/dashboard — Estadísticas generales del dashboard
        // ───────────────────────────────────────────────────────────────────

        /// <summary>
        /// Devuelve las métricas consolidadas para el panel principal del dashboard (HU-07).
        /// Combina datos de ShiftReports locales con alertas consultadas a Alerts.Service.
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var http       = _httpFactory.CreateClient();
            var alertsBase = _config["Services:AlertsService"];
            var campusBase = _config["Services:CampusService"];

            // ── Datos de turnos (propios) ──────────────────────────────────
            var hoy           = DateTime.UtcNow.Date;
            var totalTurnos   = await _context.ShiftReports.CountAsync();
            var turnosActivos = await _context.ShiftReports.CountAsync(r => r.Estado == "Activo");

            double tiempoPromedio    = 0;
            int    totalAlertas      = 0, alertasHoy = 0, alertasActivas = 0, alertasResueltas = 0;
            int    guardiasServicio  = 0;

            try
            {
                // ── Alertas desde Alerts.Service (usa /all para inter-servicio) ──
                var alertsResp = await http.GetAsync($"{alertsBase}/api/alerts/all");
                if (alertsResp.IsSuccessStatusCode)
                {
                    var alerts = await alertsResp.Content
                        .ReadFromJsonAsync<List<AlertSummary>>();

                    if (alerts != null)
                    {
                        totalAlertas     = alerts.Count;
                        alertasHoy       = alerts.Count(a => a.FechaHora.Date == hoy);
                        alertasActivas   = alerts.Count(a => a.Estado == "Activa");
                        alertasResueltas = alerts.Count(a =>
                            a.Estado == "Resuelta" || a.Estado == "Cerrada");

                        // Auto-calcular tiempo de respuesta promedio desde timestamps reales (HU-07)
                        var conRespuesta = alerts
                            .Where(a => a.FechaAsumida.HasValue)
                            .ToList();

                        if (conRespuesta.Count > 0)
                        {
                            tiempoPromedio = conRespuesta
                                .Average(a => (a.FechaAsumida!.Value - a.FechaHora).TotalMinutes);
                            tiempoPromedio = Math.Max(0, Math.Round(tiempoPromedio, 1));
                        }
                    }
                }

                // ── Guardias en servicio desde Campus.Service ─────────────────
                var guardsResp = await http.GetAsync($"{campusBase}/api/guards");
                if (guardsResp.IsSuccessStatusCode)
                {
                    var guards = await guardsResp.Content
                        .ReadFromJsonAsync<List<GuardStatusSummary>>();
                    guardiasServicio = guards?.Count(g => g.Estado == "En Servicio") ?? 0;
                }
            }
            catch
            {
                // Degradación elegante: si los servicios no responden, devuelve lo que tenemos
            }

            return Ok(new DashboardStatsDto
            {
                TotalAlertas            = totalAlertas,
                AlertasHoy              = alertasHoy,
                AlertasActivas          = alertasActivas,
                AlertasResueltas        = alertasResueltas,
                TiempoRespuestaPromedio = tiempoPromedio,
                TotalGuardiasEnServicio = guardiasServicio,
                TotalTurnos             = totalTurnos,
                TurnosActivos           = turnosActivos
            });
        }


        // ───────────────────────────────────────────────────────────────────
        // GET api/stats/zones — Alertas por zona
        // ───────────────────────────────────────────────────────────────────

        /// <summary>
        /// Agrupa las alertas por zona y calcula porcentajes de resolución (HU-07).
        /// </summary>
        [HttpGet("zones")]
        public async Task<IActionResult> GetZoneStats()
        {
            var http       = _httpFactory.CreateClient();
            var alertsBase = _config["Services:AlertsService"];

            var alertsResp = await http.GetAsync($"{alertsBase}/api/alerts/all");
            if (!alertsResp.IsSuccessStatusCode)
                return StatusCode(502, new { mensaje = "No se pudo obtener datos de Alerts.Service" });

            var alerts = await alertsResp.Content
                .ReadFromJsonAsync<List<AlertSummary>>() ?? new List<AlertSummary>();

            var stats = alerts
                .GroupBy(a => new { a.ZonaId, a.NombreZona })
                .Select(g => new ZoneStatsDto
                {
                    ZonaId   = g.Key.ZonaId,
                    Zona     = g.Key.NombreZona,
                    Total    = g.Count(),
                    Resueltas = g.Count(a => a.Estado == "Resuelta" || a.Estado == "Cerrada"),
                    Activas  = g.Count(a => a.Estado == "Activa"),
                    PctResolucion = g.Count() == 0 ? 0
                        : Math.Round(
                            g.Count(a => a.Estado == "Resuelta" || a.Estado == "Cerrada") * 100.0 / g.Count(), 1)
                })
                .OrderByDescending(s => s.Total)
                .ToList();

            return Ok(stats);
        }

        // ───────────────────────────────────────────────────────────────────
        // GET api/stats/faculties — Alertas por facultad
        // ───────────────────────────────────────────────────────────────────

        /// <summary>Agrupa alertas por facultad (HU-07).</summary>
        [HttpGet("faculties")]
        public async Task<IActionResult> GetFacultyStats()
        {
            var http       = _httpFactory.CreateClient();
            var alertsBase = _config["Services:AlertsService"];

            var alertsResp = await http.GetAsync($"{alertsBase}/api/alerts/all");
            if (!alertsResp.IsSuccessStatusCode)
                return StatusCode(502, new { mensaje = "No se pudo obtener datos de Alerts.Service" });

            var alerts = await alertsResp.Content
                .ReadFromJsonAsync<List<AlertSummary>>() ?? new List<AlertSummary>();

            var stats = alerts
                .GroupBy(a => a.Facultad)
                .Select(g => new FacultyStatsDto
                {
                    Facultad  = string.IsNullOrEmpty(g.Key) ? "Sin especificar" : g.Key,
                    Total     = g.Count(),
                    Resueltas = g.Count(a => a.Estado == "Resuelta" || a.Estado == "Cerrada")
                })
                .OrderByDescending(s => s.Total)
                .ToList();

            return Ok(stats);
        }

        // ───────────────────────────────────────────────────────────────────
        // GET api/stats/trend — Serie temporal de alertas (últimos N días)
        // ───────────────────────────────────────────────────────────────────

        /// <summary>
        /// Devuelve la tendencia de alertas día a día para el gráfico de líneas (HU-07).
        /// Parámetro: days (default 30).
        /// </summary>
        [HttpGet("trend")]
        public async Task<IActionResult> GetDailyTrend([FromQuery] int days = 30)
        {
            if (days < 1 || days > 365)
                return BadRequest(new { mensaje = "El parámetro 'days' debe estar entre 1 y 365." });

            var http       = _httpFactory.CreateClient();
            var alertsBase = _config["Services:AlertsService"];

            var alertsResp = await http.GetAsync($"{alertsBase}/api/alerts/all");
            if (!alertsResp.IsSuccessStatusCode)
                return StatusCode(502, new { mensaje = "No se pudo obtener datos de Alerts.Service" });

            var alerts = await alertsResp.Content
                .ReadFromJsonAsync<List<AlertSummary>>() ?? new List<AlertSummary>();

            var desde = DateTime.UtcNow.Date.AddDays(-days + 1);

            // Generar todos los días del rango (incluyendo días sin alertas)
            var rango = Enumerable.Range(0, days)
                .Select(i => desde.AddDays(i))
                .ToList();

            var alertsFiltradas = alerts
                .Where(a => a.FechaHora.Date >= desde)
                .ToList();

            var trend = rango.Select(dia => new DailyTrendDto
            {
                Fecha     = dia.ToString("yyyy-MM-dd"),
                Total     = alertsFiltradas.Count(a => a.FechaHora.Date == dia),
                Resueltas = alertsFiltradas.Count(a =>
                    a.FechaHora.Date == dia &&
                    (a.Estado == "Resuelta" || a.Estado == "Cerrada"))
            }).ToList();

            return Ok(trend);
        }

        // ───────────────────────────────────────────────────────────────────
        // GET api/stats/guards — Rendimiento por guardia
        // ───────────────────────────────────────────────────────────────────

        /// <summary>
        /// Devuelve el ranking de guardias por alertas resueltas (HU-08).
        /// </summary>
        [HttpGet("guards")]
        public async Task<IActionResult> GetGuardPerformance()
        {
            var stats = await _context.ShiftReports
                .GroupBy(r => new { r.GuardiaId, r.NombreGuardia })
                .Select(g => new GuardPerformanceDto
                {
                    GuardiaId               = g.Key.GuardiaId,
                    NombreGuardia           = g.Key.NombreGuardia,
                    TotalAlertas            = g.Sum(r => r.AlertasAtendidas),
                    AlertasResueltas        = g.Sum(r => r.AlertasResueltas),
                    TiempoRespuestaPromedio = g.Where(r => r.TiempoRespuestaPromedio > 0).Any()
                        ? Math.Round(g.Where(r => r.TiempoRespuestaPromedio > 0)
                            .Average(r => r.TiempoRespuestaPromedio), 1)
                        : 0,
                    TotalTurnos             = g.Count()
                })
                .OrderByDescending(g => g.AlertasResueltas)
                .ToListAsync();

            return Ok(stats);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DTO interno para deserializar respuestas de Alerts.Service
    // ═══════════════════════════════════════════════════════════════════════════

    internal class AlertSummary
    {
        public int      Id         { get; set; }
        public int      ZonaId     { get; set; }
        public string   NombreZona { get; set; } = string.Empty;
        public string   Estado     { get; set; } = string.Empty;
        public string   Facultad   { get; set; } = string.Empty;
        public DateTime FechaHora  { get; set; }
        public DateTime? FechaAsumida  { get; set; }
        public DateTime? FechaResuelta { get; set; }
    }

    // DTO para contar guardias disponibles en Campus.Service
    internal class GuardStatusSummary
    {
        public int    Id     { get; set; }
        public string Estado { get; set; } = string.Empty;
    }
}
