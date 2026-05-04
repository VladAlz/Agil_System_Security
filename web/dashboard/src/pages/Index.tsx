import { useState } from "react";
import { Sidebar } from "@/components/ssiu/Sidebar";
import { TopBar } from "@/components/ssiu/TopBar";
import { AlertList } from "@/components/ssiu/AlertList";
import { AlertDetail } from "@/components/ssiu/AlertDetail";
import { alerts } from "@/data/alerts";

const Index = () => {
  const [selectedId, setSelectedId] = useState(alerts[0].id);
  const selected = alerts.find((a) => a.id === selectedId)!;

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <div className="flex-1 flex min-h-0 flex-col lg:flex-row">
          <AlertList alerts={alerts} selectedId={selectedId} onSelect={setSelectedId} />
          <AlertDetail alert={selected} />
        </div>
      </div>
    </div>
  );
};

export default Index;
