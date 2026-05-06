import * as signalR from '@microsoft/signalr';
import { ALERT_API } from './alertService';

class SignalRService {
  private connection: signalR.HubConnection | null = null;

  async startConnection() {
    if (this.connection) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${ALERT_API}/hubs/alerts`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    try {
      await this.connection.start();
      console.log('SignalR Connected to Alert Hub');
    } catch (err) {
      console.error('SignalR Connection Error: ', err);
      setTimeout(() => this.startConnection(), 5000);
    }
  }

  onAlertAssumed(callback: (alertId: string, guardName: string) => void) {
    this.connection?.on('AlertAssumed', callback);
  }

  onAlertClosed(callback: (alertId: string, conclusion: string) => void) {
    this.connection?.on('AlertClosed', callback);
  }

  async stopConnection() {
    await this.connection?.stop();
    this.connection = null;
  }
}

export const signalRService = new SignalRService();
