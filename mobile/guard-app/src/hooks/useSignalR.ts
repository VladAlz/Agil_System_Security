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

export function useSignalR({ zonaId, onAlertCreated }: UseSignalRProps) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    connection.onreconnecting(() => {
      console.log('SignalR reconectando...');
      setIsConnected(false);
    });

    connection.onreconnected(async () => {
      console.log('SignalR reconectado');
      setIsConnected(true);

      try {
        await connection.invoke('JoinAdminGroup');
        console.log('Reconectado al grupo admin');

        if (zonaId) {
          await connection.invoke('JoinZoneGroup', zonaId);
          console.log(`Reconectado al grupo zona_${zonaId}`);
        }
      } catch (error) {
        console.error('Error al volver a unirse a los grupos SignalR:', error);
      }
    });

    connection.onclose(() => {
      console.log('SignalR desconectado');
      setIsConnected(false);
    });

    connection.on('ReceiveAlert', (alert: SignalRAlert) => {
      console.log('Alerta recibida por SignalR:', alert);
      onAlertCreated(alert);
    });

    const startConnection = async () => {
      try {
        await connection.start();
        setIsConnected(true);

        console.log('SignalR conectado desde Guardia App');

        await connection.invoke('JoinAdminGroup');
        console.log('Unido al grupo admin para recibir alertas generales');

        if (zonaId) {
          await connection.invoke('JoinZoneGroup', zonaId);
          console.log(`Unido al grupo zona_${zonaId}`);
        }
      } catch (error) {
        console.error('Error conectando a SignalR:', error);
        setIsConnected(false);
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
    connection: connectionRef.current,
  };
}