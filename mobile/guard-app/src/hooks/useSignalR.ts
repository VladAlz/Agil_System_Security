import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
const IS_WEB =
  typeof window !== 'undefined' && window.location.hostname === 'localhost';

const HUB_URL = IS_WEB
  ? 'http://localhost:5233/alerthub'
  : 'http://10.0.2.2:5233/alerthub';

export type SignalRAlert = {
  id: number | string;
  usuario?: {
    id?: number;
    nombre?: string;
    correo?: string;
  };
  zona?: {
    id?: number;
    nombre?: string;
    color?: string;
  };
  latitud?: number;
  longitud?: number;
  estado?: string;
  fechaCreacion?: string;
};

type UseSignalRProps = {
  zonaId?: number | null;
  onAlertCreated: (alert: SignalRAlert) => void;
};

export type SignalRStatus = 'connected' | 'reconnecting' | 'disconnected';

export function useSignalR({ zonaId, onAlertCreated }: UseSignalRProps) {
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
    });

    connection.onclose(() => {
      console.log('SignalR desconectado');
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    connection.on('ReceiveAlert', (alert: SignalRAlert) => {
      console.log('Alerta recibida por SignalR:', alert);
      onAlertCreated(alert);
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
      connection.stop();
      connectionRef.current = null;
    };
  }, [zonaId, onAlertCreated]);

  return {
    isConnected,
    connectionStatus,
    connection: connectionRef.current,
  };
}