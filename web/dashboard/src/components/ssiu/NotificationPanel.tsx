import React, { useState, useMemo } from "react";
import { Alert } from "@/data/alerts";
import { Bell, Filter, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationPanelProps {
  alerts: Alert[];
  onSelectAlert: (id: string) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ alerts, onSelectAlert }) => {
  const [selectedZone, setSelectedZone] = useState<string>("");

  // Obtener todas las zonas únicas de las alertas para el filtro
  const zones = useMemo(() => {
    const uniqueZones = new Set<string>();
    alerts.forEach((a) => {
      if (a.zone) uniqueZones.add(a.zone);
    });
    return Array.from(uniqueZones);
  }, [alerts]);

  // Aplanar todos los eventos del historial de alertas en una lista cronológica
  const notifications = useMemo(() => {
    const list = alerts.flatMap((a) => {
      return a.timeline.map((t) => ({
        alertId: a.id,
        code: a.code,
        userName: a.user.name,
        avatar: a.user.avatar,
        zone: a.zone,
        time: t.time,
        event: t.event,
        actor: t.actor,
        type: a.type,
        status: a.status,
      }));
    });

    // Ordenar de más reciente a más antiguo por hora
    return list
      .sort((a, b) => b.time.localeCompare(a.time))
      .filter((n) => !selectedZone || n.zone === selectedZone)
      .slice(0, 20); // Mostrar las últimas 20
  }, [alerts, selectedZone]);

  return (
    <div className="w-full lg:w-[320px] shrink-0 flex flex-col border-l border-border bg-card/20 backdrop-blur-md">
      <div className="p-5 border-b border-border space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary animate-pulse" />
          <h2 className="font-bold text-sm tracking-wide">Actividad Reciente</h2>
        </div>
        
        {/* Selector de zona */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1 border border-border/40">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full bg-transparent text-xs outline-none border-none text-muted-foreground font-medium py-0.5 cursor-pointer"
          >
            <option value="" className="bg-card text-foreground">Todas las zonas</option>
            {zones.map((zone) => (
              <option key={zone} value={zone} className="bg-card text-foreground">
                {zone.split("—")[0].trim()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-xs text-center space-y-2">
            <Bell className="w-8 h-8 opacity-25" />
            <p>No hay eventos registrados en esta zona</p>
          </div>
        ) : (
          notifications.map((notif, i) => (
            <button
              key={`${notif.alertId}-${notif.time}-${i}`}
              onClick={() => onSelectAlert(notif.alertId)}
              className={cn(
                "w-full text-left p-3.5 rounded-xl border border-border/40 bg-card/40 hover:bg-card hover:border-primary/20 transition-all duration-300",
                "relative overflow-hidden group flex items-start gap-2.5"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 font-bold text-xs text-muted-foreground">
                {notif.avatar}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary font-mono">{notif.code}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{notif.time}</span>
                </div>
                <p className="text-xs font-semibold text-foreground truncate">{notif.userName}</p>
                <p className="text-xs text-muted-foreground font-medium">{notif.event}</p>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider">
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{notif.zone.split("—")[0].trim()}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
