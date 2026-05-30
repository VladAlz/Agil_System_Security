import { useState, useMemo } from "react";
import { Sidebar } from "@/components/ssiu/Sidebar";
import { TopBar } from "@/components/ssiu/TopBar";
import { AlertPanel } from "@/components/ssiu/AlertPanel";

import { NotificationPanel } from "@/components/ssiu/NotificationPanel";
import { IncidentHistory } from "@/components/ssiu/IncidentHistory";
import { InteractiveMap } from "@/components/ssiu/InteractiveMap";
import { useAlertHub } from "@/hooks/use-alert-hub";
import { AlertTriangle, Shield, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const Index = () => {
  const { alerts, isConnected, guards, manualAddAlert } = useAlertHub();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedZone, setFocusedZone] = useState<string | null>(null);
  
  const selected = useMemo(() => {
    return alerts.find((a) => a.id === selectedId) || null;
  }, [alerts, selectedId]);

  // Estadísticas en tiempo real
  const stats = useMemo(() => ({
    activas: alerts.filter((a) => a.status === "active").length,
    asumidas: alerts.filter((a) => a.status === "assigned").length,
    enCamino: alerts.filter((a) => a.status === "enroute").length,
    resueltas: alerts.filter((a) => a.status === "resolved" || a.status === "closed").length,
    total: alerts.length,
  }), [alerts]);

  const statCards = [
    { icon: AlertTriangle, label: "Activas", value: stats.activas, color: "bg-destructive" },
    { icon: Shield, label: "En Proceso", value: stats.asumidas + stats.enCamino, color: "bg-secondary" },
    { icon: CheckCircle2, label: "Resueltas", value: stats.resueltas, color: "bg-success" },
    { icon: Clock, label: "Total Hoy", value: stats.total, color: "bg-primary" },
  ];

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden relative">
      <Sidebar onTriggerAlert={manualAddAlert} alertCount={stats.activas} />
      <div className="flex-1 flex flex-col min-w-0">

        <TopBar />

        {/* Indicadores en tiempo real */}
        <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 pt-4 pb-2">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={cn(
                "relative overflow-hidden rounded-xl border border-border/60 bg-card/50 p-3.5",
                "hover:border-primary/20 hover:bg-card/80 transition-all duration-300"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className="text-2xl font-black tracking-tight mt-0.5">
                    {card.value}
                  </p>
                </div>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", card.color)}>
                  <card.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              {/* Barra inferior animada */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          ))}
        </div>

        {/* Main Dashboard Area */}
        <div className="flex-1 flex min-h-0 relative overflow-hidden">
          {/* Left panel: Active Alerts */}
          <AlertPanel 
            alerts={alerts} 
            selectedId={selectedId || ""} 
            onSelect={setSelectedId} 
            onFocusZone={setFocusedZone}
          />

          {/* Center Column: Map (Top) + History (Bottom) */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Map container */}
            <div className="flex-1 min-h-0 relative">
              {!isConnected && (
                <div className="absolute top-4 right-4 z-[1000] bg-yellow-500/90 backdrop-blur-sm text-black font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-black" />
                  DESCONECTADO (SignalR)
                </div>
              )}
              <InteractiveMap 
                alerts={alerts} 
                guards={guards}
                selectedId={selectedId} 
                onSelect={setSelectedId}
                focusedZone={focusedZone}
              />
            </div>
            
            {/* Bottom panel: Incident History */}
            <IncidentHistory 
              alerts={alerts} 
              onSelectAlert={setSelectedId}
            />
          </div>

          {/* Right panel: Recent Activity feed */}
          <NotificationPanel 
            alerts={alerts} 
            onSelectAlert={setSelectedId}
          />

          {/* Floating Selected Alert Details (Non-intrusive overlay on the map) */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-4 right-4 z-[2000] w-[350px] bg-card/95 backdrop-blur shadow-2xl rounded-xl border border-border/50 overflow-hidden"
              >
                <div className="p-4 relative">
                  <button 
                    onClick={() => setSelectedId(null)}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-lg">
                        {selected.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-none">{selected.user.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selected.user.faculty} · {selected.user.phone}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Código</span>
                      <span className="font-mono font-bold">{selected.code}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Estado</span>
                      <span className="font-bold uppercase text-primary">{selected.status}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Ubicación</span>
                      <span className="font-medium text-right max-w-[180px] truncate">{selected.location}</span>
                    </div>
                    {selected.guard && (
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <span className="text-muted-foreground">Guardia Asignado</span>
                        <span className="font-bold text-blue-500">{selected.guard}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Index;


