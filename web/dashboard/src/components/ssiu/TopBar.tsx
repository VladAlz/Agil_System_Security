import { LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export const TopBar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-20 shrink-0 flex items-center gap-4 px-6 border-b border-border bg-card/60 backdrop-blur-md">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Centro de Alertas en Tiempo Real</h1>
        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            SignalR conectado
          </span>
          · 4 zonas activas · Campus Huachi
        </p>
      </div>

      <div className="flex-1"></div>

      <div className="ml-auto flex items-center gap-2">

        <div className="flex items-center gap-3 pl-3 ml-1 border-l border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:bg-muted/60 p-1.5 rounded-xl transition-smooth">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold leading-tight">{user?.nombre || "Usuario"}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{user?.rol || "Invitado"}</div>
                </div>
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border backdrop-blur-xl">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <User className="w-4 h-4" /> Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="gap-2 text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
