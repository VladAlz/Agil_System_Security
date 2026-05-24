import { useState, useMemo } from "react";
import { Sidebar } from "@/components/ssiu/Sidebar";
import { TopBar } from "@/components/ssiu/TopBar";
import { AlertPanel } from "@/components/ssiu/AlertPanel";
import { AlertDetail } from "@/components/ssiu/AlertDetail";
import { NotificationPanel } from "@/components/ssiu/NotificationPanel";
import { IncidentHistory } from "@/components/ssiu/IncidentHistory";
import { InteractiveMap } from "@/components/ssiu/InteractiveMap";
import { useAlertHub } from "@/hooks/use-alert-hub";
import { AlertTriangle, Shield, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const Index = () => {
  const { alerts, isConnected, manualAddAlert } = useAlertHub();
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

          {/* Sliding Details Panel */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute top-0 right-0 bottom-0 z-[2000] w-full lg:w-[600px] bg-card border-l border-border shadow-2xl flex flex-col"
              >
                <AlertDetail alert={selected} onClose={() => setSelectedId(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Index;


