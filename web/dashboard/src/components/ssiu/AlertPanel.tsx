import React, { useEffect, useState } from "react";
import { Alert } from "@/data/alerts";
import { cn } from "@/lib/utils";
import { AlertTriangle, Shield, Clock, Eye, Flame, MapPin, Search } from "lucide-react";

interface AlertPanelProps {
  alerts: Alert[];
  selectedId: string;
  onSelect: (id: string) => void;
  onFocusZone?: (zoneId: string | null) => void;
}

const typeMeta: Record<string, { icon: any; label: string; color: string }> = {
  panic: { icon: AlertTriangle, label: "Pánico", color: "text-destructive" },
  medical: { icon: Clock, label: "Médica", color: "text-accent" },
  suspicious: { icon: Eye, label: "Sospecha", color: "text-secondary" },
  fire: { icon: Flame, label: "Incendio", color: "text-primary" },
};

const statusMeta: Record<string, { label: string; cls: string }> = {
  active: { label: "ACTIVA", cls: "bg-destructive/15 text-destructive border-destructive/20" },
  assigned: { label: "ASUMIDA", cls: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  enroute: { label: "EN CAMINO", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  resolved: { label: "RESUELTA", cls: "bg-success/15 text-success border-success/20" },
};

// Helper para calcular el tiempo transcurrido desde la creación de la alerta
const formatElapsedTime = (timeStr: string) => {
  try {
    const now = new Date();
    const [h, m, s] = timeStr.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return timeStr; // Retorna original si no es formato HH:MM:SS
    
    const alertTime = new Date();
    alertTime.setHours(h, m, s || 0);

    let diffMs = now.getTime() - alertTime.getTime();
    if (diffMs < 0) diffMs += 24 * 3600 * 1000; // Por si cruza la medianoche

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Hace unos segundos";
    return `Hace ${diffMins} min`;
  } catch {
    return timeStr;
  }
};

export const AlertPanel: React.FC<AlertPanelProps> = ({ alerts, selectedId, onSelect, onFocusZone }) => {
  const activeAlerts = alerts.filter(
    (a) => a.status === "active" || a.status === "assigned" || a.status === "enroute" || a.status === "resolved"
  );

  const [elapsedTimes, setElapsedTimes] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredAlerts = activeAlerts.filter(a => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.user.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.zone.toLowerCase().includes(q);
    }
    return true;
  });

  useEffect(() => {
    const updateTimes = () => {
      const times: Record<string, string> = {};
      activeAlerts.forEach((a) => {
        times[a.id] = formatElapsedTime(a.createdAt);
      });
      setElapsedTimes(times);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 15000); // Actualizar cada 15 segundos
    return () => clearInterval(interval);
  }, [alerts]);

  return (
    <div className="w-full lg:w-[350px] shrink-0 flex flex-col border-r border-border bg-card/40">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-base tracking-wide">Alertas Activas</h2>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive animate-pulse border border-destructive/25">
            {activeAlerts.length} emergencias
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Monitoreo y despacho en tiempo real</p>
        
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, código o zona..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-muted/50 border border-transparent rounded-lg focus:outline-none focus:border-primary/50 focus:bg-background transition-colors"
            />
          </div>
          
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[{id: "all", label: "Todas"}, {id: "active", label: "Activas"}, {id: "assigned", label: "Asumidas"}].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={cn(
                  "px-3 py-1 text-[10px] font-semibold rounded-full border transition-colors whitespace-nowrap",
                  filterStatus === f.id 
                    ? "bg-primary/20 border-primary/40 text-primary" 
                    : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-xs text-center space-y-2">
            <Shield className="w-8 h-8 opacity-25 text-success" />
            <p className="font-semibold text-success">Campus Seguro</p>
            <p className="text-[10px]">No hay emergencias que coincidan</p>
          </div>
        ) : (
          filteredAlerts.map((alert, i) => {
            const T = typeMeta[alert.type] || typeMeta.panic;
            const S = statusMeta[alert.status] || statusMeta.active;
            const isSelected = alert.id === selectedId;
            const isEmergency = alert.status === "active";

            return (
              <button
                key={alert.id}
                onClick={() => {
                  onSelect(alert.id);
                  if (onFocusZone && alert.zone) {
                    const match = alert.zone.match(/Zona\s+(\d+)/);
                    if (match && match[1]) {
                      onFocusZone(match[1]);
                    }
                  }
                }}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex gap-3",
                  isSelected
                    ? "bg-card border-primary/50 shadow-lg shadow-primary/5"
                    : "bg-card/60 border-border/55 hover:border-primary/25 hover:bg-card/90"
                )}
              >
                {isSelected && (
                  <span className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r bg-primary" />
                )}
                {isEmergency && (
                  <span className="absolute top-3.5 right-3.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
                  </span>
                )}

                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    isEmergency ? "bg-destructive/10 border border-destructive/15" : "bg-muted"
                  )}
                >
                  <T.icon className={cn("w-5 h-5", T.color)} />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm truncate pr-4 text-foreground">{alert.user.name}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground/80 font-medium">
                    {alert.code} · <span className="font-semibold">{alert.user.faculty}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                    <span className="truncate">{alert.zone.split("—")[0].trim()}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2.5">
                    <span
                      className={cn(
                        "text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded border shadow-sm",
                        S.cls
                      )}
                    >
                      {S.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 font-medium ml-auto flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground/50" />
                      {elapsedTimes[alert.id] || alert.createdAt}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
