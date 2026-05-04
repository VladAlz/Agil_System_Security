import { Bell, LayoutDashboard, Map, Shield, Users, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { icon: LayoutDashboard, label: "Panel", active: false },
  { icon: Bell, label: "Alertas", active: true, badge: 2 },
  { icon: Map, label: "Mapa UTA", active: false },
  { icon: Users, label: "Guardias", active: false },
  { icon: BarChart3, label: "Reportes", active: false },
  { icon: Settings, label: "Ajustes", active: false },
];

export const Sidebar = () => (
  <aside className="hidden md:flex w-20 lg:w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
    <div className="h-20 flex items-center gap-3 px-5 border-b border-sidebar-border">
      <div className="w-11 h-11 rounded-xl bg-sunset shadow-glow flex items-center justify-center">
        <Shield className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <div className="hidden lg:block">
        <div className="font-bold text-base leading-tight">SSIU</div>
        <div className="text-[11px] text-sidebar-foreground/60 leading-tight">Seguridad UTA</div>
      </div>
    </div>

    <nav className="flex-1 p-3 space-y-1">
      {items.map((it) => (
        <button
          key={it.label}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth relative",
            it.active
              ? "bg-sidebar-accent text-sidebar-primary-foreground shadow-glow"
              : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          )}
          style={it.active ? { background: "var(--gradient-sunset)" } : undefined}
        >
          <it.icon className="w-5 h-5 shrink-0" />
          <span className="hidden lg:inline">{it.label}</span>
          {it.badge && (
            <span className="ml-auto hidden lg:flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold animate-pulse-alert">
              {it.badge}
            </span>
          )}
        </button>
      ))}
    </nav>

    <div className="p-4 border-t border-sidebar-border hidden lg:block">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-sunset flex items-center justify-center text-sm font-bold text-primary-foreground">
          GR
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">G. Ramírez</div>
          <div className="text-[11px] text-sidebar-foreground/60 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            En servicio · Zona 2
          </div>
        </div>
      </div>
    </div>
  </aside>
);
