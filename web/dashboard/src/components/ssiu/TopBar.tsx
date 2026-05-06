import { Search, Wifi, Moon } from "lucide-react";

export const TopBar = () => (
  <header className="h-20 shrink-0 flex items-center gap-4 px-6 border-b border-border bg-card/60 backdrop-blur-md">
    <div>
      <h1 className="text-xl font-bold tracking-tight">Centro de Alertas en Tiempo Real</h1>
      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          SignalR conectado
        </span>
        · Latencia 0.8s · 4 zonas activas
      </p>
    </div>

    <div className="flex-1 max-w-md ml-6 hidden md:block">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Buscar alerta, usuario o zona..."
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/60 border border-transparent focus:border-primary/40 focus:bg-card outline-none text-sm transition-smooth"
        />
      </div>
    </div>

    <div className="ml-auto flex items-center gap-2">
      <button className="w-10 h-10 rounded-xl bg-muted/60 hover:bg-muted flex items-center justify-center transition-smooth">
        <Wifi className="w-4 h-4" />
      </button>
      <button className="w-10 h-10 rounded-xl bg-muted/60 hover:bg-muted flex items-center justify-center transition-smooth">
        <Moon className="w-4 h-4" />
      </button>
      <div className="hidden lg:flex items-center gap-3 pl-3 ml-1 border-l border-border">
        <div className="text-right">
          <div className="text-xs font-semibold">Turno nocturno</div>
          <div className="text-[11px] text-muted-foreground">20:00 — 04:00</div>
        </div>
      </div>
    </div>
  </header>
);
