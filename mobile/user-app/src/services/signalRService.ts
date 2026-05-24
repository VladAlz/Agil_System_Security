import * as signalR from '@microsoft/signalr';
import { HUB_URL } from '../config/api';

class SignalRService {
  private connection: signalR.HubConnection | null = null;

  async startConnection() {
    if (this.connection) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
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
    this.connection?.on('onAlertAssumed', callback);
  }

  onGuardEnRoute(callback: (alertId: string, guardName: string) => void) {
    this.connection?.on('onGuardEnRoute', callback);
  }

  onAlertResolved(callback: (alertId: string) => void) {
    this.connection?.on('onAlertResolved', callback);
  }

  onAlertClosed(callback: (alertId: string, conclusion: string) => void) {
    this.connection?.on('onAlertClosed', callback);
  }

  onAlertCancelled(callback: (alertId: string) => void) {
    this.connection?.on('onAlertCancelled', callback);
  }

  async stopConnection() {
    await this.connection?.stop();
    this.connection = null;
  }
}

export const signalRService = new SignalRService();
