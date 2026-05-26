import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { HUB_URL } from '../../config/api';

export type SignalRAlert = {
  id: number | string;
  usuarioId?: number;
  zonaId?: number;
  nombreUsuario?: string;
  nombreZona?: string;
  colorZona?: string;
  facultad?: string;
  correoUsuario?: string;
  lat?: number;
  lng?: number;
  latitud?: number;
  longitud?: number;
  estado?: string;
  fechaHora?: string;
  fechaCreacion?: string;
  usuario?: {
    id?: number;
    nombre?: string;
    correo?: string;
    facultad?: string;
  };
  zona?: {
    id?: number;
    nombre?: string;
    color?: string;
  };
};

export type AlertStatusEvent = {
  alertId?: number | string;
  id?: number | string;
  estado?: string;
  status?: string;
  guardId?: number;
  guardiaId?: number;
  guardName?: string;
  guardiaNombre?: string;
  message?: string;
};

export type NormalizedAlertStatusEvent = {
  alertId?: number | string;
  estado?: string;
  guardId?: number;
  guardName?: string;
  message?: string;
};

type UseSignalRProps = {
  zonaId?: number | null;
  onAlertCreated?: (alert: SignalRAlert) => void;
  onAlertUpdated?: (event: NormalizedAlertStatusEvent) => void;
  onAlertRemoved?: (alertId: number | string) => void;
  onReconnect?: () => void;
};

export type SignalRStatus = 'connected' | 'reconnecting' | 'disconnected';

function normalizeAlertEvent(
  payload: AlertStatusEvent
): NormalizedAlertStatusEvent {
  return {
    alertId: payload.alertId ?? payload.id,
    estado: payload.estado ?? payload.status,
    guardId: payload.guardId ?? payload.guardiaId,
    guardName: payload.guardName ?? payload.guardiaNombre,
    message: payload.message,
  };
}

export function useSignalR({
  zonaId,
  onAlertCreated,
  onAlertUpdated,
  onAlertRemoved,
  onReconnect,
}: UseSignalRProps = {}) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<SignalRStatus>('disconnected');

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    const joinGroups = async () => {
      try {
        await connection.invoke('JoinAdminGroup');
        console.log('Unido al grupo admin para recibir alertas generales');

        if (zonaId) {
          await connection.invoke('JoinZoneGroup', zonaId);
          console.log(`Unido al grupo zona_${zonaId}`);
        }
      } catch (error) {
        console.error('Error al unirse a grupos SignalR:', error);
      }
    };

    connection.onreconnecting(() => {
      console.log('SignalR reconectando...');
      setIsConnected(false);
      setConnectionStatus('reconnecting');
    });

    connection.onreconnected(async () => {
      console.log('SignalR reconectado');
      setIsConnected(true);
      setConnectionStatus('connected');

      await joinGroups();

      // Al reconectar, la pantalla puede volver a consultar /Alerts
      // para evitar datos desactualizados.
      onReconnect?.();
    });

    connection.onclose(() => {
      console.log('SignalR desconectado');
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    connection.on('ReceiveAlert', (alert: SignalRAlert) => {
      console.log('Alerta recibida por SignalR:', alert);
      onAlertCreated?.(alert);
    });

    connection.on('onAlertAssumed', (payload: AlertStatusEvent) => {
      const event = normalizeAlertEvent(payload);

      console.log('Alerta asumida por SignalR:', event);

      onAlertUpdated?.({
        ...event,
        estado: 'Asumida',
      });
    });

    connection.on('onGuardEnRoute', (payload: AlertStatusEvent) => {
      const event = normalizeAlertEvent(payload);

      console.log('Guardia en camino por SignalR:', event);

      onAlertUpdated?.({
        ...event,
        estado: 'En Camino',
      });
    });

    connection.on('onAlertResolved', (payload: AlertStatusEvent) => {
      const event = normalizeAlertEvent(payload);

      console.log('Alerta resuelta por SignalR:', event);

      onAlertUpdated?.({
        ...event,
        estado: 'Resuelta',
      });
    });

    connection.on('onAlertClosed', (payload: AlertStatusEvent) => {
      const event = normalizeAlertEvent(payload);

      console.log('Alerta cerrada por SignalR:', event);

      if (event.alertId) {
        onAlertRemoved?.(event.alertId);
      }
    });

    connection.on('onAlertCancelled', (payload: AlertStatusEvent) => {
      const event = normalizeAlertEvent(payload);

      console.log('Alerta cancelada por SignalR:', event);

      if (event.alertId) {
        onAlertRemoved?.(event.alertId);
      }
    });

    const startConnection = async () => {
      try {
        setConnectionStatus('reconnecting');

        await connection.start();

        setIsConnected(true);
        setConnectionStatus('connected');

        console.log('SignalR conectado desde Guardia App');

        await joinGroups();
      } catch (error) {
        console.error('Error conectando a SignalR:', error);
        setIsConnected(false);
        setConnectionStatus('disconnected');
      }
    };

    startConnection();

    return () => {
      connection.off('ReceiveAlert');
      connection.off('onAlertAssumed');
      connection.off('onGuardEnRoute');
      connection.off('onAlertResolved');
      connection.off('onAlertClosed');
      connection.off('onAlertCancelled');

      connection.stop();
      connectionRef.current = null;
    };
  }, [
    zonaId,
    onAlertCreated,
    onAlertUpdated,
    onAlertRemoved,
    onReconnect,
  ]);

  return {
    isConnected,
    connectionStatus,
    connection: connectionRef.current,
  };
}