import { Bell, LayoutDashboard, Map, Shield, Users, BarChart3, Settings, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Simulator } from "./Simulator";
import { Alert } from "@/data/alerts";

const items = [
  { icon: Users,           label: "Turnos",    path: "/shifts",     badge: 0 },
  { icon: BarChart3,       label: "Reportes",  path: "/statistics", badge: 0 },
  { icon: Shield,          label: "Adm. Usuarios", path: "/users",   badge: 0 },
];

interface SidebarProps {
  onTriggerAlert?: (alert: Alert) => void;
  alertCount: number;
}

export const Sidebar = ({ onTriggerAlert, alertCount }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem("ssiu_user");
  const user = userStr ? JSON.parse(userStr) : null;
  
  const initials = user?.nombre
    ? user.nombre.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : "??";

  const handleLogout = () => {
    localStorage.removeItem("ssiu_token");
    localStorage.removeItem("ssiu_user");
    navigate("/login");
  };

  return (
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
          onClick={() => navigate(it.path)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth relative",
            location.pathname === it.path
              ? "bg-sidebar-accent text-sidebar-primary-foreground shadow-glow"
              : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          )}
          style={location.pathname === it.path ? { background: "var(--gradient-sunset)" } : undefined}
        >
          <it.icon className="w-5 h-5 shrink-0" />
          <span className="hidden lg:inline">{it.label}</span>
          {it.label === "Alertas" && alertCount > 0 && (
            <span className="ml-auto hidden lg:flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold animate-pulse-alert">
              {alertCount}
            </span>
          )}
        </button>
      ))}
      
      {onTriggerAlert && (
        <div className="mt-4 px-2 hidden lg:block">
          <Simulator onTriggerAlert={onTriggerAlert} />
        </div>
      )}
    </nav>

    <div className="p-4 border-t border-sidebar-border hidden lg:block">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-sunset flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{user?.nombre || "Usuario"}</div>
            <div className="text-[11px] text-sidebar-foreground/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {user?.rol || "En servicio"}
            </div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-destructive/10 text-sidebar-foreground/60 hover:text-destructive transition-smooth"
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  </aside>
);
};

