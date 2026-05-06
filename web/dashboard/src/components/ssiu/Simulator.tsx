import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, AlertTriangle, UserPlus, MapPin } from "lucide-react";
import { Alert } from "@/data/alerts";

interface Props {
  onTriggerAlert: (alert: Alert) => void;
}

export const Simulator = ({ onTriggerAlert }: Props) => {
  const triggerRandom = () => {
    const id = `sim-${Math.floor(Math.random() * 10000)}`;
    const newAlert: Alert = {
      id,
      code: `ALT-${Math.floor(Math.random() * 9000) + 1000}`,
      user: {
        name: "Usuario Simulado",
        role: "Estudiante",
        faculty: "FISEI · Simulador",
        phone: "+593 99 000 0000",
        avatar: "US",
      },
      type: "panic",
      status: "active",
      zone: "Zona 2 — Huachi",
      location: "Área de Simulación",
      coords: { 
        x: Math.floor(Math.random() * 80) + 10, 
        y: Math.floor(Math.random() * 80) + 10 
      },
      createdAt: "ahora mismo",
      description: "ALERTA DE PRUEBA: Activada desde el simulador interno para validar el flujo de SignalR y respuesta.",
      trustGroup: ["Contacto de Emergencia A", "Contacto de Emergencia B"],
      timeline: [
        { time: new Date().toLocaleTimeString(), event: "Alerta de pánico simulada", actor: "Simulador" }
      ],
    };
    onTriggerAlert(newAlert);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10">
          <Play className="w-3.5 h-3.5 text-primary" />
          <span>Simulador de Alertas</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Panel de Simulación (Sprint 1)</DialogTitle>
          <DialogDescription>
            Utiliza este panel para disparar eventos locales y probar la reactividad del sistema mientras se integra el backend real.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button onClick={triggerRandom} className="bg-destructive hover:bg-destructive/90 text-white gap-2">
            <AlertTriangle className="w-4 h-4" /> Disparar Alerta de Pánico
          </Button>
          <Button variant="outline" className="gap-2" disabled>
            <UserPlus className="w-4 h-4" /> Simular Asignación de Guardia
          </Button>
          <Button variant="outline" className="gap-2" disabled>
            <MapPin className="w-4 h-4" /> Simular Movimiento GPS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
