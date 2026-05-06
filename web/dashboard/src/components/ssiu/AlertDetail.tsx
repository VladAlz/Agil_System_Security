import { Alert } from "@/data/alerts";
import campusMap from "@/assets/campus-map.jpg";
import {
  Phone,
  MapPin,
  Clock,
  Shield,
  CheckCircle2,
  MessageSquare,
  Navigation,
  Users,
  Radio,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";


import { InteractiveMap } from "./InteractiveMap";



interface Props {
  alert: Alert;
}

// Mapeo simple de coordenadas relativas a Lat/Lng para la UTA centradas en los bloques principales
const getLatLng = (x: number, y: number): [number, number] => {
  const lat = -1.267584 - ((y - 50) / 100) * 0.0050;
  const lng = -78.624025 + ((x - 50) / 100) * 0.0050;
  return [lat, lng];
};

export const AlertDetail = ({ alert }: Props) => {
  const [conclusion, setConclusion] = useState("");
  const [isZoomed, setIsZoomed] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const isActive = alert.status === "active";
  const isClosed = alert.status === "closed";
  const [lat, lng] = getLatLng(alert.coords.x, alert.coords.y);

  return (
    <div className="flex-1 overflow-y-auto bg-background/50">
      {/* Map header */}
      <div 
        className={cn(
          "relative transition-all duration-500 ease-in-out border-b border-border overflow-hidden bg-slate-900",
          isZoomed ? "h-[500px]" : "h-72 lg:h-80"
        )}
        ref={mapRef}
      >
        <InteractiveMap lat={lat} lng={lng} isActive={isActive} />



        {/* Map overlay controls */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3 pointer-events-none z-[1000]">
          <div className="bg-card/90 backdrop-blur-md rounded-xl px-4 py-2.5 shadow-xl border border-white/10 pointer-events-auto">
            <div className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mb-1">Mapa en Vivo · Satélite</div>
            <div className="text-sm font-bold flex items-center gap-2">
              <Navigation className="w-4 h-4 text-primary animate-pulse" />
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </div>
          </div>
          
          <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2.5 rounded-xl bg-card/90 backdrop-blur-md border border-white/10 shadow-xl hover:bg-card transition-colors"
            >
              {isZoomed ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <div className="flex gap-1.5 p-1.5 rounded-xl bg-card/90 backdrop-blur-md border border-white/10 shadow-xl">
              {["Z1", "Z2", "Z3", "Z4"].map((z, i) => (
                <span
                  key={z}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center text-[10px] font-black rounded-lg transition-all",
                    alert.zone.includes(`Zona ${i + 1}`)
                      ? "bg-primary text-white shadow-lg shadow-primary/30"
                      : "text-muted-foreground/40"
                  )}
                >
                  {z}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* Content */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-6 space-y-8"
      >
        {/* User Info Header */}
        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-sunset flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-sunset/30">
              {alert.user.avatar}
            </div>
            {isActive && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full border-4 border-background flex items-center justify-center">
                <span className="w-2 h-2 bg-white rounded-full animate-ping" />
              </span>
            )}
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight">{alert.user.name}</h2>
              <span className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase",
                isActive ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-muted text-muted-foreground border border-border"
              )}>
                {isActive ? "Emergencia en curso" : "Caso Finalizado"}
              </span>
            </div>
            <p className="text-base text-muted-foreground font-medium">
              {alert.user.role} · <span className="text-foreground/80">{alert.user.faculty}</span>
            </p>
            
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                {alert.user.phone}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                {alert.location}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <Clock className="w-4 h-4 text-primary" />
                {alert.createdAt}
              </div>
              <div className="flex items-center gap-2 text-xs font-black font-mono text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                <Radio className="w-3.5 h-3.5" />
                {alert.code}
              </div>
            </div>
          </div>
        </div>

        {/* Actions & Description */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 bg-primary rounded-full" />
                <h3 className="text-sm font-black tracking-widest text-foreground uppercase">Descripción del Incidente</h3>
              </div>
              <div className="p-6 rounded-2xl border border-border bg-card shadow-inner text-base leading-relaxed font-medium">
                {alert.description}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 bg-sunset rounded-full" />
                <h3 className="text-sm font-black tracking-widest text-foreground uppercase">Acciones de Respuesta</h3>
              </div>
              <div className="space-y-4">
                <textarea
                  disabled={isClosed}
                  value={isClosed ? "Falsa alarma confirmada en sitio. Sin novedades adicionales." : conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  placeholder="Ingrese el reporte detallado de las acciones tomadas..."
                  className="w-full min-h-[160px] p-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-base resize-none transition-all disabled:opacity-60 font-medium"
                />
                <div className="flex flex-wrap gap-3">
                  {!isClosed && (
                    <>
                      {isActive && (
                        <Button className="h-12 px-6 bg-sunset hover:bg-sunset/90 text-white font-bold rounded-xl shadow-lg shadow-sunset/20 gap-2">
                          <Shield className="w-5 h-5" /> Asumir Alerta
                        </Button>
                      )}
                      <Button className="h-12 px-6 bg-success hover:bg-success/90 text-white font-bold rounded-xl shadow-lg shadow-success/20 gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Finalizar Caso
                      </Button>
                    </>
                  )}
                  <Button variant="outline" className="h-12 px-6 rounded-xl border-border hover:bg-card gap-2">
                    <MessageSquare className="w-5 h-5" /> Contactar Usuario
                  </Button>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <h4 className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Línea de Tiempo</h4>
              <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {alert.timeline.map((t, i) => (
                  <div key={i} className="relative pl-8">
                    <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    </div>
                    <div className="text-sm font-bold">{t.event}</div>
                    <div className="text-[10px] font-black text-muted-foreground/60 uppercase mt-0.5 font-mono">
                      {t.time} · {t.actor}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Users size={120} />
              </div>
              <div className="relative space-y-1">
                <p className="text-[10px] font-black tracking-widest opacity-70 uppercase">Guardias Disponibles</p>
                <h4 className="text-4xl font-black">07 / 12</h4>
                <div className="pt-4 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-white/20 border-2 border-primary backdrop-blur-sm" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold opacity-80">+3 en Zona 2</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
};
