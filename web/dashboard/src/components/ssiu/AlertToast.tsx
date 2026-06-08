// ─── AlertToast.tsx — Señales emergentes priorizadas (HU-11) ──────────────────
// Tarjetas flotantes que emergen sobre el mapa cuando llega una alerta. Las de
// prioridad alta (pánico/incendio) permanecen hasta que el admin las atiende o
// descarta; "Atender" centra la cámara del mapa en la alerta.

import { AnimatePresence, motion } from "framer-motion";
import { Alert } from "@/data/alerts";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITY: Record<string, { label: string; ring: string; text: string; btn: string }> = {
  panic:      { label: "PÁNICO — PRIORIDAD ALTA",   ring: "border-red-500",   text: "text-red-400",   btn: "bg-red-600 hover:bg-red-500" },
  fire:       { label: "INCENDIO — PRIORIDAD ALTA", ring: "border-red-500",   text: "text-red-400",   btn: "bg-red-600 hover:bg-red-500" },
  medical:    { label: "MÉDICA — PRIORIDAD MEDIA",  ring: "border-amber-500", text: "text-amber-400", btn: "bg-amber-600 hover:bg-amber-500" },
  suspicious: { label: "SOSPECHA — PRIORIDAD BAJA", ring: "border-sky-500",   text: "text-sky-400",   btn: "bg-sky-600 hover:bg-sky-500" },
};

interface Props {
  alerts: Alert[];                  // alertas activas a señalar
  onAttend: (id: string) => void;   // centra la cámara y atiende
  onDismiss: (id: string) => void;  // descarta la señal
}

export const AlertToast = ({ alerts, onAttend, onDismiss }: Props) => (
  <div className="absolute top-20 right-6 z-[2500] flex flex-col gap-3 w-[340px] max-w-[88vw]">
    <AnimatePresence>
      {alerts.map((a) => {
        const p = PRIORITY[a.type] ?? PRIORITY.panic;
        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: 30, scale: 0.92 }}
            animate={{ opacity: 0.6, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.92 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className={cn("rounded-xl border-2 shadow-2xl backdrop-blur-md p-3.5 bg-slate-900/95 cursor-default", p.ring)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className={cn("flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider", p.text)}>
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                ALERTA DE {p.label}
              </div>
              <button onClick={() => onDismiss(a.id)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm font-bold text-white mt-1.5">{a.user.name} · {a.zone}</p>
            <p className="text-[11px] text-slate-400 font-mono">{a.user.faculty || "—"} · {a.createdAt}</p>
            <button
              onClick={() => onAttend(a.id)}
              className={cn("mt-2.5 w-full py-1.5 rounded-lg text-xs font-black text-white transition-colors", p.btn)}
            >
              ATENDER
            </button>
          </motion.div>
        );
      })}
    </AnimatePresence>
  </div>
);
