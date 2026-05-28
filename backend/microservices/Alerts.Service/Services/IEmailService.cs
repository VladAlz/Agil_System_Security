namespace Alerts.Service.Services
{
    public interface IEmailService
    {
        Task SendEmergencyAlertAsync(string toEmail, string toName, string studentName, string faculty, string zone, double lat, double lng);
    }
}
