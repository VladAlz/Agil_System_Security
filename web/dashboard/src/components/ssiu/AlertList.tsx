import { Alert } from "@/data/alerts";
import { cn } from "@/lib/utils";
import { AlertTriangle, Activity, Eye, Flame, CheckCircle2 } from "lucide-react";

const typeMeta: Record<Alert["type"], { icon: any; label: string; color: string }> = {
  panic: { icon: AlertTriangle, label: "Pánico", color: "text-destructive" },
  medical: { icon: Activity, label: "Médica", color: "text-accent" },
  suspicious: { icon: Eye, label: "Sospecha", color: "text-secondary" },
  fire: { icon: Flame, label: "Incendio", color: "text-primary" },
};

const statusMeta: Record<Alert["status"], { label: string; cls: string }> = {
  active: { label: "ACTIVA", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  assigned: { label: "ASUMIDA", cls: "bg-secondary/20 text-secondary border-secondary/40" },
  closed: { label: "CERRADA", cls: "bg-muted text-muted-foreground border-border" },
};

interface Props {
  alerts: Alert[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const AlertList = ({ alerts, selectedId, onSelect }: Props) => {
  const active = alerts.filter((a) => a.status === "active").length;

  return (
    <div className="w-full lg:w-[400px] shrink-0 flex flex-col border-r border-border bg-card/40">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-base">Bandeja de Alertas</h2>
          <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-destructive/15 text-destructive">
            {active} activas
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Notificaciones en vivo vía WebSocket</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {alerts.map((a, i) => {
          const T = typeMeta[a.type];
          const S = statusMeta[a.status];
          const isSelected = a.id === selectedId;
          const isActive = a.status === "active";
          return (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              style={{ animationDelay: `${i * 60}ms` }}
              className={cn(
                "w-full text-left p-4 rounded-xl border transition-smooth animate-slide-in relative overflow-hidden",
                isSelected
                  ? "bg-card border-primary/50 shadow-elegant"
                  : "bg-card/70 border-border hover:border-primary/30 hover:bg-card"
              )}
            >
              {isSelected && (
                <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-sunset" />
              )}
              {isActive && (
                <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping-ring" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
                </span>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-11 h-11 rounded-lg flex items-center justify-center shrink-0",
                    isActive ? "bg-destructive/15" : "bg-muted"
                  )}
                >
                  <T.icon className={cn("w-5 h-5", T.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm truncate">{a.user.name}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {a.code} · {a.zone}
                  </div>
                  <div className="text-xs mt-1.5 text-foreground/80 truncate">{a.location}</div>

                  <div className="flex items-center gap-2 mt-2.5">
                    <span
                      className={cn(
                        "text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded border",
                        S.cls
                      )}
                    >
                      {S.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                      {a.status === "closed" && <CheckCircle2 className="w-3 h-3 text-success" />}
                      {a.createdAt}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
