using System.Net;
using System.Net.Mail;

namespace Alerts.Service.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<SmtpEmailService> _logger;

        public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendEmergencyAlertAsync(string toEmail, string toName, string studentName, string faculty, string zone, double lat, double lng)
        {
            try
            {
                var host = _config["Smtp:Host"];
                var port = _config.GetValue<int>("Smtp:Port");
                var email = _config["Smtp:Email"];
                var password = _config["Smtp:Password"];

                if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
                {
                    _logger.LogWarning("Configuración SMTP incompleta. No se enviará el correo a {ToEmail}.", toEmail);
                    return;
                }

                var fromAddress = new MailAddress(email, "Alerta SSIU");
                var toAddress = new MailAddress(toEmail, toName);

                using var smtp = new SmtpClient
                {
                    Host = host,
                    Port = port,
                    EnableSsl = true,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(fromAddress.Address, password)
                };

                using var message = new MailMessage(fromAddress, toAddress)
                {
                    Subject = "🚨 ALERTA DE EMERGENCIA - SSIU",
                    IsBodyHtml = true,
                    Body = GenerateEmailBody(toName, studentName, faculty, zone, lat, lng)
                };

                await smtp.SendMailAsync(message);
                _logger.LogInformation("Correo de emergencia enviado correctamente a {ToEmail}.", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar el correo de emergencia a {ToEmail}.", toEmail);
            }
        }

        private string GenerateEmailBody(string toName, string studentName, string faculty, string zone, double lat, double lng)
        {
            string mapsLink = $"https://www.google.com/maps?q={lat.ToString(System.Globalization.CultureInfo.InvariantCulture)},{lng.ToString(System.Globalization.CultureInfo.InvariantCulture)}";

            return $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;'>
                <div style='background-color: #ef4444; color: white; padding: 20px; text-align: center;'>
                    <h1 style='margin: 0; font-size: 24px;'>🚨 ALERTA DE EMERGENCIA</h1>
                </div>
                <div style='padding: 20px; background-color: #f9fafb; color: #333;'>
                    <p style='font-size: 16px;'>Hola <strong>{toName}</strong>,</p>
                    <p style='font-size: 16px;'>El estudiante <strong>{studentName}</strong>, quien te ha designado como su contacto de confianza, ha activado el botón de pánico en el campus.</p>
                    
                    <div style='background-color: white; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;'>
                        <p style='margin: 5px 0;'><strong>🏢 Facultad:</strong> {faculty}</p>
                        <p style='margin: 5px 0;'><strong>📍 Zona Asignada:</strong> {zone}</p>
                        <p style='margin: 5px 0;'><strong>⏰ Hora:</strong> {DateTime.Now:dd/MM/yyyy HH:mm:ss}</p>
                    </div>

                    <div style='text-align: center; margin-top: 30px;'>
                        <a href='{mapsLink}' style='background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px; display: inline-block;'>📍 Ver Ubicación en Maps</a>
                    </div>
                </div>
                <div style='background-color: #1f2937; color: #9ca3af; padding: 15px; text-align: center; font-size: 12px;'>
                    <p style='margin: 0;'>Este es un mensaje automático del Sistema de Seguridad Integral Universitaria (S.S.I.U.).<br>Por favor, actúe con rapidez.</p>
                </div>
            </div>";
        }
    }
}
