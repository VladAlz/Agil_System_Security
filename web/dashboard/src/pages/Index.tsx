import { useState } from "react";
import { Sidebar } from "@/components/ssiu/Sidebar";
import { TopBar } from "@/components/ssiu/TopBar";
import { AlertList } from "@/components/ssiu/AlertList";
import { AlertDetail } from "@/components/ssiu/AlertDetail";
import { useAlertHub } from "@/hooks/use-alert-hub";

const Index = () => {
  const { alerts, isConnected, manualAddAlert } = useAlertHub();

  const [selectedId, setSelectedId] = useState<string | null>(alerts.length > 0 ? alerts[0].id : null);
  
  const selected = alerts.find((a) => a.id === selectedId) || alerts[0];

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
      <Sidebar onTriggerAlert={manualAddAlert} alertCount={alerts.length} />
      <div className="flex-1 flex flex-col min-w-0">

        <TopBar />
        <div className="flex-1 flex min-h-0 flex-col lg:flex-row relative">
          {!isConnected && (
            <div className="absolute top-0 right-0 m-4 z-50">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
              </span>
            </div>
          )}
          <AlertList alerts={alerts} selectedId={selectedId || ""} onSelect={setSelectedId} />
          {selected ? (
            <AlertDetail alert={selected} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Seleccione una alerta para ver los detalles
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;

