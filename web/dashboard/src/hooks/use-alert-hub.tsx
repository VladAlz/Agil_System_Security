import { useEffect, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { Alert, alerts as initialAlerts } from "@/data/alerts";
import { toast } from "sonner";
import { API_URL, HUB_URL } from "@/config/api";

export const useAlertHub = () => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
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
    const token = localStorage.getItem("ssiu_token") || "";

    fetch(`${API_URL}/alerts?page=0&pageSize=100`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        // La respuesta ahora es { total, page, pageSize, totalPages, items: [...] }
        const alertsArray = Array.isArray(data) ? data : (data.items ?? []);
        const mappedAlerts = alertsArray.map(mapBackendAlertToFrontend);
        setAlerts(mappedAlerts);
      })
      .catch(err => console.warn("[useAlertHub] Error fetching initial alerts:", err));

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

          connection.on("onAlertAssumed", (data: any) => {
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === data.id?.toString()
                  ? { ...a, status: "assigned", guard: data.guardiaAsignadoNombre }
                  : a
              )
            );
            toast.info("Alerta asumida", {
              description: `${data.guardiaAsignadoNombre} asumió la alerta #${data.id}`,
            });
          });

          connection.on("onGuardEnRoute", (data: any) => {
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === data.id?.toString() ? { ...a, status: "enroute" } : a
              )
            );
          });

          connection.on("onAlertResolved", (data: any) => {
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === data.id?.toString() ? { ...a, status: "resolved" } : a
              )
            );
          });

          connection.on("onAlertClosed", (data: any) => {
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === data.id?.toString() ? { ...a, status: "closed" } : a
              )
            );
          });

          connection.on("onAlertCancelled", (data: any) => {
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === data.id?.toString() ? { ...a, status: "cancelled" } : a
              )
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

  // Mapeo de estados del backend (español) al frontend (inglés)
  const mapEstadoToStatus = (estado: string): Alert['status'] => {
    const map: Record<string, Alert['status']> = {
      'Activa':    'active',
      'Asumida':   'assigned',
      'En Camino': 'enroute',
      'Resuelta':  'resolved',
      'Cerrada':   'closed',
      'Cancelada': 'cancelled',
    };
    return map[estado] || 'active';
  };

  // Helper para mapear el modelo de C# al de React
  // Compatible con el nuevo modelo desnormalizado de Alerts.Service
  const mapBackendAlertToFrontend = (bAlert: any): Alert => {
    const nombreUsuario = bAlert.nombreUsuario || bAlert.usuario?.nombre || "Desconocido";
    const nombreZona    = bAlert.nombreZona    || bAlert.zona?.nombre    || "Zona Desconocida";
    return {
      id:    bAlert.id.toString(),
      code:  `ALT-${1000 + bAlert.id}`,
      user: {
        name:    nombreUsuario,
        role:    bAlert.usuario?.rol || "Estudiante",
        faculty: bAlert.facultad || bAlert.usuario?.facultad || "",
        phone:   "+593 99 000 0000",
        avatar:  nombreUsuario.substring(0, 2).toUpperCase(),
      },
      type:     "panic",
      status:   mapEstadoToStatus(bAlert.estado),
      zone:     nombreZona,
      location: `Lat: ${bAlert.lat?.toFixed(4)}, Lng: ${bAlert.lng?.toFixed(4)}`,
      // Coordenadas GPS reales para el mapa (HU-06)
      lat:    bAlert.lat,
      lng:    bAlert.lng,
      coords: { x: 50, y: 50 },   // fallback si lat/lng no llegan
      createdAt: new Date(bAlert.fechaHora).toLocaleTimeString(),
      description: "Alerta real recibida desde backend C#.",
      guard:       bAlert.guardiaAsignadoNombre || undefined,
      trustGroup:  [],
      timeline:    [{ time: new Date(bAlert.fechaHora).toLocaleTimeString(), event: "Alerta creada", actor: "Sistema Real" }]
    };
  };

  const closeAlert = useCallback(async (alertId: string, conclusion: string) => {
    try {
      const res = await fetch(`${API_URL}/alerts/${alertId}/close`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conclusion }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Actualizar estado local
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, status: "closed" } : a
        )
      );
    } catch (err) {
      console.error("Error closing alert: ", err);
    }
  }, []);

  const manualAddAlert = useCallback((newAlert: Alert) => {
    setAlerts((prev) => [newAlert, ...prev]);
    toast.error("¡NUEVA ALERTA RECIBIDA!", {
      description: `${newAlert.user.name} ha activado un botón de pánico en ${newAlert.location}`,
      duration: 10000,
    });
  }, []);

  return { alerts, isConnected, closeAlert, manualAddAlert };
};

