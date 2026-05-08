import { useEffect, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { Alert, alerts as initialAlerts } from "@/data/alerts";
import { toast } from "sonner";

const HUB_URL = "http://localhost:5233/alerthub";

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
    // 1. Fetch initial alerts from backend
    fetch("http://localhost:5233/api/Alerts")
      .then(res => res.json())
      .then(data => {
        const mappedAlerts = data.map(mapBackendAlertToFrontend);
        setAlerts(mappedAlerts);
      })
      .catch(err => console.error("Error fetching alerts:", err));

    // 2. Start SignalR
    if (connection) {
      connection
        .start()
        .then(() => {
          setIsConnected(true);
          console.log("Connected to SignalR Hub");
          
          // Unirse al grupo de administradores
          connection.invoke("JoinAdminGroup").catch(console.error);

          connection.on("ReceiveAlert", (backendAlert: any) => {
            const mappedAlert = mapBackendAlertToFrontend(backendAlert);
            setAlerts((prev) => [mappedAlert, ...prev]);
            toast.error("¡NUEVA ALERTA RECIBIDA!", {
              description: `${mappedAlert.user.name} ha activado un botón de pánico en ${mappedAlert.location}`,
              duration: 10000,
            });
          });

          connection.on("AlertUpdated", (updatedAlert: any) => {
            const mapped = mapBackendAlertToFrontend(updatedAlert);
            setAlerts((prev) =>
              prev.map((a) => (a.id === mapped.id ? mapped : a))
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

  // Helper para mapear el modelo de C# al de React
  const mapBackendAlertToFrontend = (bAlert: any): Alert => {
    return {
      id: bAlert.id.toString(),
      code: `ALT-${1000 + bAlert.id}`,
      user: {
        name: bAlert.usuario?.nombre || "Desconocido",
        role: bAlert.usuario?.rol || "Estudiante",
        faculty: bAlert.usuario?.facultad || "",
        phone: "+593 99 000 0000",
        avatar: bAlert.usuario?.nombre?.substring(0,2).toUpperCase() || "?",
      },
      type: "panic",
      status: bAlert.estado === "Activa" ? "active" : "closed",
      zone: bAlert.zona?.nombre || "Zona Desconocida",
      location: `Lat: ${bAlert.lat.toFixed(4)}, Lng: ${bAlert.lng.toFixed(4)}`,
      coords: { x: 50, y: 50 }, // Valor por defecto visual
      createdAt: new Date(bAlert.fechaHora).toLocaleTimeString(),
      description: "Alerta real recibida desde backend C#.",
      trustGroup: [],
      timeline: [{ time: new Date(bAlert.fechaHora).toLocaleTimeString(), event: "Alerta creada", actor: "Sistema Real" }]
    };
  };

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

