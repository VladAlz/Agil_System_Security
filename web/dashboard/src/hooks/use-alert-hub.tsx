import { useEffect, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { Alert, alerts as initialAlerts } from "@/data/alerts";
import { toast } from "sonner";

const HUB_URL = "http://localhost:5002/hubs/alerts";

export const useAlertHub = () => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          setIsConnected(true);
          console.log("Connected to SignalR Hub");

          connection.on("ReceiveAlert", (newAlert: Alert) => {
            setAlerts((prev) => [newAlert, ...prev]);
            toast.error("¡NUEVA ALERTA RECIBIDA!", {
              description: `${newAlert.user.name} ha activado un botón de pánico en ${newAlert.location}`,
              duration: 10000,
            });
          });

          connection.on("AlertUpdated", (updatedAlert: Alert) => {
            setAlerts((prev) =>
              prev.map((a) => (a.id === updatedAlert.id ? updatedAlert : a))
            );
          });
        })
        .catch((err) => {
          console.error("SignalR Connection Error: ", err);
          setIsConnected(false);
        });

      return () => {
        connection.stop();
      };
    }
  }, [connection]);

  const closeAlert = useCallback(async (alertId: string, conclusion: string) => {
    if (connection) {
      try {
        await connection.invoke("CloseAlert", alertId, conclusion);
      } catch (err) {
        console.error("Error closing alert: ", err);
      }
    }
  }, [connection]);

  const manualAddAlert = useCallback((newAlert: Alert) => {
    setAlerts((prev) => [newAlert, ...prev]);
    toast.error("¡NUEVA ALERTA RECIBIDA!", {
      description: `${newAlert.user.name} ha activado un botón de pánico en ${newAlert.location}`,
      duration: 10000,
    });
  }, []);

  return { alerts, isConnected, closeAlert, manualAddAlert };
};

