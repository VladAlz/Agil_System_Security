import { useState } from "react";
import { cn } from "@/lib/utils";
import { EyeOff, Eye } from "lucide-react";

export const ZONES_DATA = [
  { id: "1", name: "Sector FISEI", color: "#0ea5e9", fullName: "Facultad de Ingeniería en Sistemas, Electrónica e Industrial" },
  { id: "2", name: "Sector FCA", color: "#eab308", fullName: "Facultad de Contabilidad y Auditoría" },
  { id: "3", name: "Administración", color: "#a855f7", fullName: "Administración y Parqueaderos" },
  { id: "4", name: "Áreas Deportivas", color: "#22c55e", fullName: "Áreas Deportivas y Recreación" },
];

export const ZoneLegend = () => {
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="absolute top-6 right-6 z-[1000] pointer-events-auto bg-slate-900/90 text-white p-2 rounded-lg shadow-lg border border-white/10 hover:bg-slate-800 transition-colors"
        title="Mostrar Zonas de Seguridad"
      >
        <Eye className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="absolute top-6 right-6 z-[1000] pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-4 w-[280px]">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
          <h4 className="text-xs font-black text-white/80 uppercase tracking-widest">
            Zonas de Seguridad
          </h4>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-white/60 hover:text-white transition-colors"
            title="Ocultar Zonas"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {ZONES_DATA.map((zone) => (
            <div key={zone.id} className="flex items-start gap-3 group">
              <div 
                className="w-4 h-4 rounded-md shrink-0 mt-0.5 border border-white/20 shadow-inner transition-transform group-hover:scale-110"
                style={{ backgroundColor: zone.color, opacity: 0.8 }}
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-tight">
                  Zona {zone.id}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight mt-0.5 font-medium">
                  {zone.fullName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
