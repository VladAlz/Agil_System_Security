import { useState, useMemo } from "react";
import { Sidebar } from "@/components/ssiu/Sidebar";
import { TopBar } from "@/components/ssiu/TopBar";
import { AlertPanel } from "@/components/ssiu/AlertPanel";
import { NotificationPanel } from "@/components/ssiu/NotificationPanel";
import { IncidentHistory } from "@/components/ssiu/IncidentHistory";
import { InteractiveMap } from "@/components/ssiu/InteractiveMap";
import { AlertToast } from "@/components/ssiu/AlertToast";
import { useAlertHub } from "@/hooks/use-alert-hub";
import { AlertTriangle, Shield, CheckCircle2, Clock, XCircle, Bell, History, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const Index = () => {
  const { alerts, isConnected, guards, manualAddAlert } = useAlertHub();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedZone, setFocusedZone] = useState<string | null>(null);

  // HU-11 — Paneles como overlays bajo demanda + señales emergentes
  const [showAlerts, setShowAlerts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedToasts, setDismissedToasts] = useState<Set<string>>(new Set());

  const selected = useMemo(() => alerts.find((a) => a.id === selectedId) || null, [alerts, selectedId]);

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

  // Señales emergentes: alertas activas que aún no se atienden/descartan
  const toastAlerts = useMemo(
    () => alerts.filter((a) => a.status === "active" && !dismissedToasts.has(a.id)),
    [alerts, dismissedToasts]
  );

  const dismissToast = (id: string) => setDismissedToasts((prev) => new Set(prev).add(id));
  const attendAlert = (id: string) => { setSelectedId(id); dismissToast(id); };  // centra la cámara + atiende

  const floatingButtons = [
    { key: "alerts", label: "Alertas", icon: AlertTriangle, badge: stats.activas, active: showAlerts,
      onClick: () => { setShowAlerts((v) => !v); setShowHistory(false); setShowNotifications(false); } },
    { key: "history", label: "Historial", icon: History, badge: 0, active: showHistory,
      onClick: () => { setShowHistory((v) => !v); setShowAlerts(false); setShowNotifications(false); } },
    { key: "notifs", label: "Notificaciones", icon: Bell, badge: 0, active: showNotifications,
      onClick: () => { setShowNotifications((v) => !v); setShowAlerts(false); setShowHistory(false); } },
  ];

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden relative">
      <Sidebar onTriggerAlert={manualAddAlert} alertCount={stats.activas} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        {/* ── Lienzo principal: mapa a pantalla completa con superposiciones ── */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          {/* Capa base: mapa */}
          <div className="absolute inset-0">
            <InteractiveMap
              alerts={alerts}
              guards={guards}
              selectedId={selectedId}
              onSelect={setSelectedId}
              focusedZone={focusedZone}
            />
          </div>

          {/* Señales emergentes priorizadas (top-center) */}
          <AlertToast alerts={toastAlerts} onAttend={attendAlert} onDismiss={dismissToast} />

          {/* Badge de desconexión SignalR */}
          {!isConnected && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1500] bg-yellow-500/90 backdrop-blur-sm text-black font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-black" />
              DESCONECTADO (SignalR)
            </div>
          )}

          {/* Cluster inferior izquierdo: métricas compactas + botones flotantes */}
          <div className="absolute bottom-4 left-4 z-[1500] flex flex-col gap-2 items-start">
            <div className="flex gap-2">
              {statCards.map((c) => (
                <div key={c.label} className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1.5 shadow-lg">
                  <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", c.color)}>
                    <c.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="leading-none">
                    <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{c.label}</p>
                    <p className="text-sm font-black text-white">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {floatingButtons.map((b) => (
                <button
                  key={b.key}
                  onClick={b.onClick}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold shadow-lg border transition-colors backdrop-blur-md",
                    b.active
                      ? "bg-primary text-white border-primary"
                      : "bg-slate-900/85 text-slate-200 border-white/10 hover:bg-slate-800"
                  )}
                >
                  <b.icon className="w-3.5 h-3.5" />
                  {b.label}
                  {b.badge > 0 && (
                    <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[9px] font-black flex items-center justify-center">
                      {b.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Drawer izquierdo: Alertas Activas ── */}
          <AnimatePresence>
            {showAlerts && (
              <motion.aside
                initial={{ x: -380, opacity: 0.5 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -380, opacity: 0.5 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 z-[1600] flex shadow-2xl bg-slate-950/85 backdrop-blur-xl"
              >
                <div className="relative h-full flex">
                  <AlertPanel alerts={alerts} selectedId={selectedId || ""} onSelect={setSelectedId} onFocusZone={setFocusedZone} />
                  <button onClick={() => setShowAlerts(false)} className="absolute top-3 right-3 z-10 p-1 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ── Drawer derecho: Notificaciones ── */}
          <AnimatePresence>
            {showNotifications && (
              <motion.aside
                initial={{ x: 360, opacity: 0.5 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 360, opacity: 0.5 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute inset-y-0 right-0 z-[1600] flex shadow-2xl bg-slate-950/85 backdrop-blur-xl"
              >
                <div className="relative h-full flex">
                  <NotificationPanel alerts={alerts} onSelectAlert={setSelectedId} />
                  <button onClick={() => setShowNotifications(false)} className="absolute top-3 left-3 z-10 p-1 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ── Bottom-sheet: Historial de Incidentes ── */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ y: 320, opacity: 0.5 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 320, opacity: 0.5 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute inset-x-0 bottom-0 z-[1600] shadow-2xl bg-slate-950/85 backdrop-blur-xl"
              >
                <div className="relative">
                  <IncidentHistory alerts={alerts} onSelectAlert={setSelectedId} />
                  <button onClick={() => setShowHistory(false)} className="absolute top-3 right-4 z-10 p-1 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Detalle de la alerta seleccionada (overlay no intrusivo) ── */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-4 right-4 z-[2000] w-[350px] max-w-[88vw] bg-card/95 backdrop-blur shadow-2xl rounded-xl border border-border/50 overflow-hidden"
              >
                <div className="p-4 relative">
                  <button onClick={() => setSelectedId(null)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors">
                    <XCircle className="w-5 h-5" />
                  </button>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-lg">{selected.user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-none">{selected.user.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{selected.user.faculty} · {selected.user.phone}</p>
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
