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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Props {
  alert: Alert;
}

export const AlertDetail = ({ alert }: Props) => {
  const [conclusion, setConclusion] = useState("");
  const isActive = alert.status === "active";
  const isClosed = alert.status === "closed";

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Map header */}
      <div className="relative h-72 lg:h-80 overflow-hidden border-b border-border">
        <img
          src={campusMap}
          alt="Mapa del campus UTA con ubicación de alerta"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-dusk opacity-40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

        {/* Pin */}
        <div
          className="absolute"
          style={{ left: `${alert.coords.x}%`, top: `${alert.coords.y}%` }}
        >
          <div className="relative -translate-x-1/2 -translate-y-1/2">
            {isActive && (
              <span className="absolute inset-0 -m-4 rounded-full bg-destructive/40 animate-ping-ring" />
            )}
            <div
              className={cn(
                "relative w-12 h-12 rounded-full flex items-center justify-center shadow-glow border-2 border-background",
                isActive ? "bg-destructive animate-pulse-alert" : "bg-secondary"
              )}
            >
              <MapPin className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Map overlay info */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3">
          <div className="bg-card/85 backdrop-blur-md rounded-xl px-3 py-2 shadow-elegant border border-border">
            <div className="text-[10px] text-muted-foreground font-medium">UBICACIÓN GPS</div>
            <div className="text-xs font-semibold flex items-center gap-1.5">
              <Navigation className="w-3 h-3 text-primary" />
              -1.2491°, -78.6195° · ±4m
            </div>
          </div>
          <div className="flex gap-2">
            {["Zona 1", "Zona 2", "Zona 3", "Zona 4"].map((z, i) => (
              <span
                key={z}
                className={cn(
                  "text-[10px] font-bold px-2 py-1 rounded-md border backdrop-blur-md",
                  alert.zone.includes(`Zona ${i + 1}`)
                    ? "bg-primary text-primary-foreground border-primary shadow-glow"
                    : "bg-card/70 text-muted-foreground border-border"
                )}
              >
                Z{i + 1}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-sunset flex items-center justify-center text-xl font-bold text-primary-foreground shadow-glow shrink-0">
            {alert.user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold tracking-tight">{alert.user.name}</h2>
              {isActive && (
                <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded-md bg-destructive text-destructive-foreground animate-pulse-alert">
                  ALERTA ACTIVA
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {alert.user.role} · {alert.user.faculty}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-xs">
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary" />{alert.user.phone}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" />{alert.location}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" />{alert.createdAt}</span>
              <span className="flex items-center gap-1.5 font-mono"><Radio className="w-3.5 h-3.5 text-primary" />{alert.code}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body grid */}
      <div className="p-6 grid lg:grid-cols-3 gap-5">
        {/* Description + actions */}
        <div className="lg:col-span-2 space-y-5">
          <section>
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground mb-2">DESCRIPCIÓN DEL CASO</h3>
            <div className="p-4 rounded-xl border border-border bg-muted/40 text-sm leading-relaxed">
              {alert.description}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground mb-2">
              {isClosed ? "CONCLUSIÓN DEL GUARDIA" : "CERRAR CASO"}
            </h3>
            <textarea
              disabled={isClosed}
              value={isClosed ? "Falsa alarma confirmada en sitio. Sin novedades." : conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="Describe a detalle la conclusión, acciones realizadas, personas involucradas y estado final…"
              className="w-full min-h-[130px] p-4 rounded-xl bg-card border border-border focus:border-primary/50 outline-none text-sm resize-none transition-smooth disabled:opacity-70"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {!isClosed && isActive && (
                <button
                  className="px-5 h-11 rounded-xl bg-sunset text-primary-foreground font-semibold text-sm shadow-glow hover:opacity-95 transition-smooth flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" /> Asumir caso
                </button>
              )}
              {!isClosed && (
                <button className="px-5 h-11 rounded-xl bg-success text-success-foreground font-semibold text-sm hover:opacity-95 transition-smooth flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Cerrar caso
                </button>
              )}
              <button className="px-5 h-11 rounded-xl bg-card border border-border font-semibold text-sm hover:border-primary/40 transition-smooth flex items-center gap-2">
                <Phone className="w-4 h-4" /> Llamar
              </button>
              <button className="px-5 h-11 rounded-xl bg-card border border-border font-semibold text-sm hover:border-primary/40 transition-smooth flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Mensaje
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground mb-2">LÍNEA DE TIEMPO</h3>
            <ol className="relative border-l-2 border-border pl-5 space-y-4">
              {alert.timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[26px] top-1 w-3 h-3 rounded-full bg-sunset shadow-glow" />
                  <div className="text-sm font-medium">{t.event}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                    {t.time} · {t.actor}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Side panel */}
        <aside className="space-y-5">
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="text-xs font-bold tracking-wider text-muted-foreground mb-3">ESTADO</div>
            <div
              className={cn(
                "p-3 rounded-lg text-sm font-semibold flex items-center justify-between",
                isActive && "bg-destructive/15 text-destructive",
                alert.status === "assigned" && "bg-secondary/20 text-secondary-foreground",
                isClosed && "bg-success/15 text-success"
              )}
            >
              {isActive ? "Sin asignar" : alert.status === "assigned" ? `Asumida · ${alert.guard}` : `Cerrada · ${alert.guard}`}
              <Shield className="w-4 h-4" />
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold tracking-wider text-muted-foreground">GRUPO DE CONFIANZA</div>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            {alert.trustGroup.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin contactos registrados.</p>
            ) : (
              <ul className="space-y-2">
                {alert.trustGroup.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-sm">
                    <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                      {p.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className="p-5 rounded-xl text-primary-foreground relative overflow-hidden"
            style={{ background: "var(--gradient-sunset)" }}
          >
            <div className="bg-glow absolute inset-0" />
            <div className="relative">
              <div className="text-[11px] font-bold tracking-wider opacity-80">GUARDIAS DISPONIBLES</div>
              <div className="text-3xl font-bold mt-1">7 / 12</div>
              <div className="text-xs opacity-90 mt-1">3 en Zona 2 · ETA estimada 90 s</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
